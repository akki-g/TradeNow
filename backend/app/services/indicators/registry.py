from typing import Dict, Optional, List
from .base import IndicatorDefinition, IndicatorParam, IndicatorCategory, OutputType
from . import implementations as impl


class IndicatorRegistry:
    def __init__(self):
        
        self._indicators: Dict[str, IndicatorDefinition] = {}
        self._register_defaults()

    def _register_defaults(self):
        self.register(IndicatorDefinition(
            name="sma",
            display_name="Simple Moving Average",
            category=IndicatorCategory.TREND,
            output_type=OutputType.OVERLAY,
            params=[IndicatorParam("period", "int", default=20, min_val=1, max_val=500)],
            output_names=["sma"],
            compute_fn=impl.compute_sma,
        ))

        self.register(IndicatorDefinition(
            name="ema",
            display_name="Exponential Moving Average",
            category=IndicatorCategory.TREND,
            output_type=OutputType.OVERLAY,
            params=[IndicatorParam("period", "int", default=20, min_val=1, max_val=500)],
            output_names=["ema"],
            compute_fn=impl.compute_ema,
        ))
        # MACD
        self.register(IndicatorDefinition(
            name="macd",
            display_name="MACD",
            category=IndicatorCategory.MOMENTUM,
            output_type=OutputType.SEPARATE,
            params=[
                IndicatorParam("fast", "int", default=12, min_val=1, max_val=200),
                IndicatorParam("slow", "int", default=26, min_val=1, max_val=500),
                IndicatorParam("signal", "int", default=9, min_val=1, max_val=200),
            ],
            output_names=["macd", "signal", "histogram"],
            compute_fn=impl.compute_macd,
        ))
        # Bollinger Bands
        self.register(IndicatorDefinition(
            name="bbands",
            display_name="Bollinger Bands",
            category=IndicatorCategory.VOLATILITY,
            output_type=OutputType.OVERLAY,
            params=[
                IndicatorParam("period", "int", default=20, min_val=1, max_val=500),
                IndicatorParam("std_dev", "float", default=2.0, min_val=0.1, max_val=10.0),
            ],
            output_names=["upper", "middle", "lower"],
            compute_fn=impl.compute_bbands,
        ))


    def register(self, indicator: IndicatorDefinition):
        self._indicators[indicator.name] = indicator
    
    def get(self, name: str) -> Optional[IndicatorDefinition]:
        return self._indicators.get(name)

    def list_all(self) -> List[IndicatorDefinition]:
        return list(self._indicators.values())
    
    def list_by_category(self, category: IndicatorCategory) -> List[IndicatorDefinition]:
        return [i for i in self._indicators.values() if i.category == category]
    

indicator_registry = IndicatorRegistry()