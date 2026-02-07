import talib
import pandas as pd
from typing import Dict

def compute_sma(df: pd.DataFrame, period: int = 20) -> Dict[str, pd.Series]:
    return {"sma": talib.SMA(df["close"], timeperiod=period)}

def compute_ema(df: pd.DataFrame, period: int = 20) -> Dict[str, pd.Series]:
    return {"ema": talib.EMA(df['close'], timeperiod=period)}

def compute_rsi(df: pd.DataFrame, period: int = 14) -> Dict[str, pd.Series]:
    return {"rsi": talib.RSI(df["close"], timeperiod=period)}

def compute_macd(df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, pd.Series]:
    macd,macd_signal, macd_hist = talib.MACD(
        df["close"], fastperiod=fast, slowperiod=slow, signalperiod=signal
    )
    return {"macd": macd, "signal": macd_signal, "histogram": macd_hist}

def compute_bbands(df: pd.DataFrame, period: int = 20, std_dev: float = 2.0) -> Dict[str, pd.Series]:
    upper, middle, lower = talib.BBANDS(
        df["close"], timeperiod=period, nbdevup=std_dev, nbdevdn=std_dev
    )
    return {"upper": upper, "middle": middle, "lower":lower}
