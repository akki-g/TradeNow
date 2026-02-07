import re
from datetime import date, datetime, time, timezone
from decimal import Decimal
from typing import Any, Dict, List, Mapping
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.database import (
    DatabaseOverview,
    ForeignKeyReference,
    TableColumn,
    TableOverview,
    TableRowsResponse,
)


class DatabaseExplorerService:
    PUBLIC_SCHEMA = "public"
    VALID_IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_overview(self, sample_limit: int = 5) -> DatabaseOverview:
        table_names = await self._list_table_names()
        tables: List[TableOverview] = []
        total_rows = 0

        for table_name in table_names:
            row_count = await self._count_rows(table_name)
            total_rows += row_count

            columns = await self._get_columns(table_name)
            foreign_keys = await self._get_foreign_keys(table_name)
            sample_rows = await self._fetch_rows(table_name, limit=sample_limit, offset=0)

            tables.append(
                TableOverview(
                    table_name=table_name,
                    row_count=row_count,
                    columns=columns,
                    foreign_keys=foreign_keys,
                    sample_rows=sample_rows,
                )
            )

        return DatabaseOverview(
            schema=self.PUBLIC_SCHEMA,
            generated_at=datetime.now(timezone.utc),
            total_tables=len(tables),
            total_rows=total_rows,
            tables=tables,
        )

    async def get_table_rows(self, table_name: str, limit: int, offset: int) -> TableRowsResponse:
        normalized_table_name = self._validate_identifier(table_name)

        if not await self._table_exists(normalized_table_name):
            raise KeyError(f"Unknown table: {normalized_table_name}")

        total_rows = await self._count_rows(normalized_table_name)
        rows = await self._fetch_rows(normalized_table_name, limit=limit, offset=offset)

        return TableRowsResponse(
            table_name=normalized_table_name,
            total_rows=total_rows,
            limit=limit,
            offset=offset,
            rows=rows,
        )

    async def _list_table_names(self) -> List[str]:
        query = text(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = :schema
              AND table_type = 'BASE TABLE'
            ORDER BY table_name;
            """
        )
        result = await self.session.execute(query, {"schema": self.PUBLIC_SCHEMA})
        return [str(row.table_name) for row in result]

    async def _table_exists(self, table_name: str) -> bool:
        query = text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = :schema
                  AND table_name = :table_name
            ) AS table_exists;
            """
        )
        result = await self.session.execute(
            query, {"schema": self.PUBLIC_SCHEMA, "table_name": table_name}
        )
        row = result.one()
        return bool(row.table_exists)

    async def _get_columns(self, table_name: str) -> List[TableColumn]:
        primary_keys_query = text(
            """
            SELECT kcu.column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema = kcu.table_schema
            WHERE tc.table_schema = :schema
              AND tc.table_name = :table_name
              AND tc.constraint_type = 'PRIMARY KEY'
            ORDER BY kcu.ordinal_position;
            """
        )
        primary_key_result = await self.session.execute(
            primary_keys_query,
            {"schema": self.PUBLIC_SCHEMA, "table_name": table_name},
        )
        primary_key_columns = {str(row.column_name) for row in primary_key_result}

        columns_query = text(
            """
            SELECT
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_schema = :schema
              AND table_name = :table_name
            ORDER BY ordinal_position;
            """
        )
        columns_result = await self.session.execute(
            columns_query,
            {"schema": self.PUBLIC_SCHEMA, "table_name": table_name},
        )

        columns: List[TableColumn] = []
        for row in columns_result:
            column_name = str(row.column_name)
            columns.append(
                TableColumn(
                    name=column_name,
                    data_type=str(row.data_type),
                    is_nullable=str(row.is_nullable).upper() == "YES",
                    is_primary_key=column_name in primary_key_columns,
                    default=str(row.column_default) if row.column_default is not None else None,
                )
            )

        return columns

    async def _get_foreign_keys(self, table_name: str) -> List[ForeignKeyReference]:
        foreign_keys_query = text(
            """
            SELECT
                kcu.column_name AS column_name,
                ccu.table_name AS referenced_table,
                ccu.column_name AS referenced_column,
                rc.delete_rule AS on_delete
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
             AND ccu.constraint_schema = tc.table_schema
            JOIN information_schema.referential_constraints AS rc
              ON rc.constraint_name = tc.constraint_name
             AND rc.constraint_schema = tc.table_schema
            WHERE tc.table_schema = :schema
              AND tc.table_name = :table_name
              AND tc.constraint_type = 'FOREIGN KEY'
            ORDER BY kcu.ordinal_position;
            """
        )
        result = await self.session.execute(
            foreign_keys_query,
            {"schema": self.PUBLIC_SCHEMA, "table_name": table_name},
        )

        return [
            ForeignKeyReference(
                column_name=str(row.column_name),
                referenced_table=str(row.referenced_table),
                referenced_column=str(row.referenced_column),
                on_delete=str(row.on_delete) if row.on_delete is not None else None,
            )
            for row in result
        ]

    async def _count_rows(self, table_name: str) -> int:
        table_identifier = self._quote_identifier(table_name)
        query = text(f"SELECT COUNT(*) AS row_count FROM {table_identifier};")
        result = await self.session.execute(query)
        row = result.one()
        return int(row.row_count)

    async def _fetch_rows(self, table_name: str, limit: int, offset: int) -> List[Dict[str, Any]]:
        if limit <= 0:
            return []

        table_identifier = self._quote_identifier(table_name)
        query = text(f"SELECT * FROM {table_identifier} LIMIT :limit OFFSET :offset;")
        result = await self.session.execute(query, {"limit": limit, "offset": offset})
        mapped_rows = result.mappings().all()
        return [self._serialize_mapping(row) for row in mapped_rows]

    def _quote_identifier(self, identifier: str) -> str:
        normalized_identifier = self._validate_identifier(identifier)
        return f'"{normalized_identifier}"'

    def _validate_identifier(self, identifier: str) -> str:
        if not self.VALID_IDENTIFIER_PATTERN.match(identifier):
            raise ValueError("Invalid table name")
        return identifier

    def _serialize_mapping(self, row: Mapping[str, Any]) -> Dict[str, Any]:
        return {str(key): self._serialize_value(value) for key, value in row.items()}

    def _serialize_value(self, value: Any) -> Any:
        if value is None:
            return None
        if isinstance(value, (datetime, date, time)):
            return value.isoformat()
        if isinstance(value, Decimal):
            return float(value)
        if isinstance(value, UUID):
            return str(value)
        if isinstance(value, bytes):
            return value.hex()
        if isinstance(value, dict):
            return {str(key): self._serialize_value(item) for key, item in value.items()}
        if isinstance(value, list):
            return [self._serialize_value(item) for item in value]
        return value
