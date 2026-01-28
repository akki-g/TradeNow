from sqlalchemy import Column, Integer, String, Boolean, BigInteger, Numeric, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin

class Stock(Base, TimestampMixin):

    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    exchange = Column(String(50), index=True)
    sector = Column(String(100), index=True)
    industry = Column(String(100))
    market_cap = Column(BigInteger)

    is_active = Column(Boolean, default=True)


    ohlcv_daily = relationship("OHLCVDaily", back_populates="stock", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Stock {self.ticker}: {self.name}>"
    

class OHLCVDaily(Base):
    __tablename__ = "ohlcv_daily"

    time = Column(DateTime, primary_key=True)
    stock_id = Column(Integer, ForeignKey("stocks.id", ondelete="CASCADE"), primary_key=True)

    open = Column(Numeric(12, 4), nullable=False)
    high = Column(Numeric(12, 4), nullable=False)
    low = Column(Numeric(12, 4), nullable=False)
    close = Column(Numeric(12, 4), nullable=False)
    adj_close = Column(Numeric(12, 4))
    volume = Column(BigInteger, nullable=False)


    stock = relationship("Stock", back_populates="ohlcv_daily")

    __table_args__ = (
        Index('idx_ohlcv_stock_time', 'stock_id', 'time')
    )

    def __repr__(self):
        return f"<OHLCV {self.stock_id} @ {self.time}>"
    

