from sqlalchemy import Column, String, ForeignKey, Integer
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base, TimestampMixin


class Watchlist(Base, TimestampMixin):
    __tablename__ = "watchlists"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)

    user = relationship("User", back_populates="watchlists")
    items = relationship("WachlistItem", back_populates="watchlist", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Watchlist {self.name}>"
    

class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    watchlist_id = Column(String(36), ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False)
    stock_id = Column(Integer, ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)

    watchlist = relationship("Watchlist", back_populates="items")

    def __repr__(self):
        return f"<WatchlistItem {self.stock_id} in {self.watchlist_id}"
    

    