from fastapi import APIRouter
from typing import List

from app.services.indicators.registry import indicator_registry
from app.services.indicators.base import IndicatorDefinition
from app.services.indicators.calculator import IndicatorCalculator

router = APIRouter(prefix='/indicators', tags=["indicators"])


@router.get("/", response_model=List[str]) 
async def get_avaliable_indicators():   
    return [ind.name for ind in indicator_registry]

@router.get("/{name}", response_model=IndicatorDefinition)
async def get_indicator_info(name:str):
    return indicator_registry.get(name)
