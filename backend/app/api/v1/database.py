from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_session
from app.schemas.database import DatabaseOverview, TableRowsResponse
from app.services.database_service import DatabaseExplorerService


router = APIRouter(prefix="/database", tags=["database"])


@router.get("/overview", response_model=DatabaseOverview)
async def get_database_overview(
    sample_limit: int = Query(5, ge=0, le=100),
    session: AsyncSession = Depends(get_session),
):
    try:
        service = DatabaseExplorerService(session)
        return await service.get_overview(sample_limit=sample_limit)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error fetching database overview: {exc}")


@router.get("/tables/{table_name}/rows", response_model=TableRowsResponse)
async def get_table_rows(
    table_name: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    try:
        service = DatabaseExplorerService(session)
        return await service.get_table_rows(table_name=table_name, limit=limit, offset=offset)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error fetching table rows: {exc}")
