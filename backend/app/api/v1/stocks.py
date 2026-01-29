from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.base import get_session
from app.services.stock_service import StockDataService
from app.schemas.stock import OHLCVResponse, StockInfo

router = APIRouter(prefix="/stocks", tags=["stocks"])

@router.get("/{ticker}/ohlcv", response_model=OHLCVResponse)
async def get_ohlcv(
    ticker: str,
    period: str = Query("max", regex="^(1d|5d|1mo|3mo|6mo|1y|2y|5y|10y|ytd|max)$"),
    force_refresh: bool = False, 
    session: AsyncSession = Depends(get_session)
):
    """Get OHLCV data for a stock"""

    try: 
        service = StockDataService(session)
        return await service.get_ohlcv(ticker, period, force_refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")
    

@router.get("/{ticker}/info", response_model=StockInfo)
async def get_stock_info(
    ticker: str,
    session: AsyncSession = Depends(get_session)
):
    """get current stock info including price and metadata"""

    try:
        service = StockDataService(session)
        return await service.get_stock_info(ticker)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock infor: {str(e)}")
    