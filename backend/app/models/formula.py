from sqlalchemy import Column, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base, TimestampMixin

class CustomFormula(Base, TimestampMixin):
    __tablename__ = "custom_formulas"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    formula_code = Column(Text, nullable=False)
    compiled_ast = Column(Text) #json string
    is_public = Column(Boolean, default=False)

    user = relationship("User", back_populates="custom_formulas")

    def __repr__(self):
        return f"<CustomFormula {self.name}>"
    
