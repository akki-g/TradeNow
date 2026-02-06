from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class OHLCVPoint(BaseModel):
    time: datetime
    open: float 
    high: float
    low: float 
    close: float
    volume: int

class OHLCVResponse(BaseModel):
    ticker: str
    period: str
    data: List[OHLCVPoint]
    metadata: dict = {}


class StockInfo(BaseModel):
    ticker: str
    name: str
    exchange: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[int] = None
    current_price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None

class SearchResult(BaseModel):
    ticker: str
    name: str
    exchange: Optional[str]
    sector: Optional[str]