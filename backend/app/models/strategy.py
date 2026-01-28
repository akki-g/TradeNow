from sqlalchemy import Column, String, Boolean, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
import uuid 
from app.db.base import Base, TimestampMixin


class Strategy(Base, TimestampMixin):
    __tablename__ = "strategies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)


    user = relationship("User", back_populates="strategies")
    rules = relationship("StrategyRule", back_populates="strategy", cascade="all, delete-orphan")
    backtest_runs = relationship("BacktestRun", back_populates="strategy")

    def __repr__(self):
        return f"<Strategy {self.name}>"
    

class StrategyRule(Base):
    __tablename__ = "strategy_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    strategy_id = Column(String(36), ForeignKey('strategies.id', ondelete="CASCADE"), nullable=False)
    rule_type = Column(String(20), nullable=False)
    condition_json = Column(Text, nullable=False)
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    strategy = relationship("Strategy", back_populates="rules")

    def __repr__(self):
        return f"<StrategyRule {self.rule_type} for {self.strategy_id}>"
    

