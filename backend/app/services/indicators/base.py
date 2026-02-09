from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Callable
import pandas as pd

class IndicatorCategory(str, Enum):
    TREND = "trend"
    MOMENTUM = "momentum"
    VOLATILITY = "volatility"
    VOLUME = "volume"

class OutputType(str, Enum):
    OVERLAY = "overlay"         # if drawn on price chart
    SEPARATE = "separate"       # if gets its own pane

@dataclass
class IndicatorParam:
    name: str
    param_type: str
    default: any
    min_val: Optional[float] = None
    max_val: Optional[float] = None

@dataclass
class IndicatorDefinition:
    name: str
    display_name: str
    category: IndicatorCategory
    output_type: OutputType
    params: List[IndicatorParam]
    output_names: List[str]
    compute_fn: Callable
