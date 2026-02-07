from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class TableColumn(BaseModel):
    name: str
    data_type: str
    is_nullable: bool
    is_primary_key: bool
    default: Optional[str] = None


class ForeignKeyReference(BaseModel):
    column_name: str
    referenced_table: str
    referenced_column: str
    on_delete: Optional[str] = None


class TableOverview(BaseModel):
    table_name: str
    row_count: int
    columns: List[TableColumn]
    foreign_keys: List[ForeignKeyReference]
    sample_rows: List[Dict[str, Any]]


class DatabaseOverview(BaseModel):
    schema: str
    generated_at: datetime
    total_tables: int
    total_rows: int
    tables: List[TableOverview]


class TableRowsResponse(BaseModel):
    table_name: str
    total_rows: int
    limit: int
    offset: int
    rows: List[Dict[str, Any]]
