from sqlalchemy.ext.asyncio import AsyncSession
from services.stock_service import StockDataService
from .registry import indicator_registry
from schemas.stock import OHLCVResponse
import pandas as pd


class IndicatorCalculator: 
    def __init__(self, session: AsyncSession):
        self.stock_service = StockDataService(session)
        self.registry = indicator_registry

    async def calculate(self, ticker: str, indicator_name: str, params: dict, period: str = "max") -> dict:

        ohlcv_response = await self.stock_service.get_ohlcv(ticker, period=period)
        df = self._response_to_dataframe(ohlcv_response)

        indicator = self.registry.get(indicator_name)
        if not indicator:
            raise ValueError(f"Unknown Indicator: {indicator_name}")
        
        valid_params = {p.name: params.get(p.name, p.default) for p in indicator.params}

        results = indicator.compute_fn(df, **valid_params)

        return {
            "indicator": indicator_name,
            "output_type": indicator.output_type.value,
            "data": {
                name: [
                    {"time": t.isoformat(), "value": float(v) if pd.notna(v) else None}
                    for t, v in zip(df.index, series)
                ]
                for name, series in results.items()
            }
        }

    def _response_to_dataframe(response: OHLCVResponse) -> pd.DataFrame:
        
        rows = [res.model_dump() for res in response]

        df = pd.DataFrame(rows)

        df.set_index('time', inplace=True)

        df['open'] = df['open'].astype(float)
        df['high'] = df['high'].astype(float)
        df['low'] = df['low'].astype(float)
        df['close'] = df['close'].astype(float)
        df['volume'] = df['volume'].astype(float)

        return df
        
