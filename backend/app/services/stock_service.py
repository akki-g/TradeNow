import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta, date
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, func
from sqlalchemy.dialects.postgresql import insert 
import asyncio

from app.models.stock import Stock, OHLCVDaily
from app.schemas.stock import OHLCVResponse, OHLCVPoint, StockInfo


class StockDataService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_stock(self, ticker: str) -> Stock:
        """
        get stock data fron db or create if dne
        """

        # query for existing stock

        result = await self.session.execute(
            select(Stock).where(Stock.ticker == ticker.upper())
        )
        stock = result.scalar_one_or_none()

        if stock:
            return stock
        
        # fetch stock info from yf
        stock_info = await self._fetch_stock_info(ticker)
        stock = Stock(
            ticker=ticker.upper(),
            name = stock_info.get('longName', ticker),
            exchange=stock_info.get('exchange'), 
            sector=stock_info.get('industry'),
            market_cap=stock_info.get('marketCap')
        )

        self.session.add(stock)
        await self.session.commit()
        await self.session.refresh(stock)


        return stock

    async def _fetch_stock_info(self, ticker: str) -> dict:
        # get stock data from yf

        def _fetch():
            try: 
                return yf.Ticker(ticker).info
            except:
                return {}
            
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _fetch)
    
    async def get_ohlcv(self, ticker:str, period: str = "max", force_refresh:bool = False):
        """
        get ohlcv data for ticker
        period options: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        """

        stock = await self.get_or_create_stock(ticker)

        if period == 'max':
            end_date = datetime.now().date()
            start_date = date(1900, 1, 1)
        else:
            end_date = datetime.now().date()
            start_date = self._get_start_date(period, end_date)

        needs_fetch = force_refresh or await self._needs_data_fetch(stock.id, start_date, end_date)

        if needs_fetch:
            await self._fetch_and_store_ohlcv(stock, period, start_date, end_date)

        result = await self.session.execute(
            select(OHLCVDaily)
            .where(
                OHLCVDaily.stock_id == stock.id,
                OHLCVDaily.time >= start_date,
                OHLCVDaily.time <= end_date
            )
            .order_by(OHLCVDaily.time)
        )

        ohlcv_records = result.scalars().all()

        #convert to resp format

        data_points = [
            OHLCVPoint(
                time=record.time,
                open=float(record.open),
                high=float(record.high),
                low=float(record.low),
                close=float(record.close),
                volume=int(record.volume)
            )
            for record in ohlcv_records
        ]

        return OHLCVResponse(
            ticker=ticker.upper(),
            period=period,
            data=data_points,
            metadata={
                'records': len(data_points),
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }
        )
    
    def _get_start_date(self, period:str, end_date:date) -> date:
        period_map = {
            '1d': timedelta(days=1),
            '5d': timedelta(days=5),
            '1mo': timedelta(days=30),
            '3mo': timedelta(days=90),
            '6mo': timedelta(days=180),
            '1y': timedelta(days=365),
            '2y': timedelta(days=730),
            '5y': timedelta(days=1825),
            '10y': timedelta(days=3650),
            'ytd': None,  # Handle separately
            'max': timedelta(days=7300)  # ~20 years
        }
        
        if period == 'ytd':
            return date(end_date.year, 1, 1)
        
        delta = period_map.get(period, timedelta(days=365))
        return end_date - delta
    

    async def _fetch_and_store_ohlcv(self, stock: Stock, period: str, start_date: date, end_date: date):

        def _fetch():
            ticker=yf.Ticker(stock.ticker)
            df = ticker.history(
                start=start_date,
                end=end_date + timedelta(days=1),
                auto_adjust=False
            )
            return df
        
        loop = asyncio.get_event_loop()
        df = await loop.run_in_executor(None, _fetch)

        if df.empty:
            return
        
        records = []    
        
        for idx, row in df.iterrows():
            records.append({
                'time': idx.to_pydatetime(),
                'stock_id': stock.id,
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'adj_close': float(row['Close']),
                'volume': int(row['Volume'])
            })

        if not records:
            return
    

        stmt = insert(OHLCVDaily).values(records)
        stmt = stmt.on_conflict_do_update(
            index_elements=['stock_id', 'time'],
            set_ = {
                'open': stmt.excluded.open,
                'high': stmt.excluded.high,
                'low': stmt.excluded.low,
                'close': stmt.excluded.close,
                'adj_close': stmt.excluded.adj_close,
                'volume': stmt.excluded.volume
            }
        )
        await self.session.execute(stmt)
        await self.session.commit()


    async def get_stock_info(self, ticker: str) -> StockInfo:

        stock = await self.get_or_create_stock(ticker)

        info = await self._fetch_stock_info(ticker)

        current_price = info.get('current_price') or info.get('regularMarketPrice')
        previous_close = info.get('previousClose')

        change = None
        change_percent = None

        if current_price and previous_close:
            change = current_price - previous_close
            change_percent = (change / previous_close) * 100

        return StockInfo(
            ticker=stock.ticker,
            name=stock.name,
            exchange=stock.exchange,
            sector=stock.sector,
            industry=stock.industry,
            market_cap=stock.market_cap,
            current_price=current_price,
            change=change,
            change_percent=change_percent
        )
    

    async def _needs_data_fetch(self, stock_id: int, start_date: date, end_date: date) -> bool:
        
        result = await self.session.execute(
            select(func.min(OHLCVDaily.time), func.max(OHLCVDaily.time))
            .where(OHLCVDaily.stock_id == stock_id)
        )

        min_date, max_date = result.first()

        if not min_date or not max_date:
            return True
        
        if start_date < min_date.date() or end_date > max_date.date():
            return True
        
        return False
