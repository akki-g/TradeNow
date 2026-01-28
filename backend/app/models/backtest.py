from sqlalchemy import Column, String, Integer, Numeric, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
import uuid 
from app.db.base import Base, TimestampMixin

class BacktestRun(Base, TimestampMixin):
    __tablename__ = "backtest_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    strategy_id = Column(String(36), ForeignKey("strategies.id"), nullable=False)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    initial_capital = Column(Numeric(15, 2), default=100000)
    status = Column(String(20), default='pending')

    strategy = relationship("Strategy", back_populates="backtest_runs")
    results = relationship("BacktestResult", back_populates="run", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<BacktestRun {self.id} - {self.status}>"
    

class BacktestResult(Base):
    __tablename__ = "backtest_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String(36), ForeignKey("backtest_run.id", ondelete="CASCADE"), nullable=False)  
    total_return = Column(Numeric(10, 4))
    sharpe_ratio = Column(Numeric(8, 4))
    max_drawdown = Column(Numeric(10, 4))
    win_rate = Column(Numeric(6,4))
    total_trades = Column(Integer)
    equity_curve = Column(Text) # json str
    trades = Column(Text) # also json str

    run = relationship("BacktestRun", back_populates="results")
    def __repr__(self):
        return f"<BacktestResult for run {self.run_id}>"
    