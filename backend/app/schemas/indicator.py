from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any

class IndicatorParamSchema(BaseModel):
    name: str
    param_type: str
    default: Any
    min_val: Optional[float] = None
    max_val: Optional[float] = None

class IndicatorSummary(BaseModel):
    name: str
    display_name: str
    category: str

class IndicatorDetail(BaseModel):
    name: str
    display_name: str
    category: str
    output_type: str
    params: List[IndicatorParamSchema]
    output_names: List[str]

class CalculateRequest(BaseModel):
    ticker: str
    indicator_name: str
    params: Dict[str, Any]
    period: str = "1y"

class IndicatorDataPoint(BaseModel):
    time: datetime
    value: Optional[float]

class CalculateResponse(BaseModel):
    indicator: str
    output_type: str
    data: Dict[str, List[IndicatorDataPoint]]

class BatchIndicatorItem(BaseModel):
    name: str
    params: dict

class BatchCalculateRequest(BaseModel):
    ticker: str
    period: str = "1y"
    indicators: List[BatchIndicatorItem]

class BatchCalculateResponse(BaseModel):
    ticker: str
    results: List[CalculateResponse]

