from fastapi import APIRouter, Query, HTTPException, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_session
from app.schemas.indicator import *
from app.services.indicators.calculator import indicator_calculator
from app.services.indicators.registry import indicator_registry
from app.services.stock_service import StockDataService

router = APIRouter(prefix="/indicators", tags=["indicators"])

@router.get("/")
def get_available_indicators():
    indicators = indicator_registry.list_all()
    result = [IndicatorSummary(
        name=ind.name,
        display_name=ind.display_name,
        category=ind.category
    ) for ind in indicators]

    return result


@router.get("/{indicator_name}/")
def get_indicator_info(indicator_name: str):
    ind = indicator_registry.get(indicator_name)

    if not ind:
        raise HTTPException(status_code=404, detail=f"Indicator {indicator_name} does not exist in current registry")

    return IndicatorDetail(
        name=ind.name,
        display_name=ind.display_name,
        category=ind.category,
        output_type=ind.output_type,
        params=[IndicatorParamSchema(
            name=p.name,
            param_type= p.param_type,
            default=p.default,
            min_val=p.min_val,
            max_val=p.max_val
        ) for p in ind.params],
        output_names= ind.output_names
    )


@router.post("/calculate/")
async def calculate_indicator(request: CalculateRequest, session: AsyncSession = Depends(get_session)):
    stock_service = StockDataService(session)

    ohlcv_response = await stock_service.get_ohlcv(request.ticker, request.period)

    calc = indicator_calculator.calculate(ohlcv_response, request.indicator_name, request.params)

    return CalculateResponse(
        indicator=calc.get('indicator'),
        output_type=calc.get('output_type'),
        data=calc.get('data')
    )

@router.post("/calculate-batch/")
async def calculate_batch(request: BatchCalculateRequest, session: AsyncSession = Depends(get_session)):
    stock_service = StockDataService(session)

    ohlcv_response = await stock_service.get_ohlcv(request.ticker, request.period)

    res = []
    for item in request.indicators:
        calc = indicator_calculator.calculate(ohlcv_response, item.name, item.params)
        calc_res = CalculateResponse(
            indicator=calc.get('indicator'),
            output_type=calc.get('output_type'),
            data=calc.get('data')
        )
        res.append(calc_res)

    return BatchCalculateResponse(
        ticker=request.ticker,
        results=res
    )
    