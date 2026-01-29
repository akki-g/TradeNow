from sqlalchemy import text
from app.db.base import engine, Base
from app.models import *
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init_db():
    """init db with tables and timescale hypertable"""

    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"))
        logger.info("TimescaleDV extension enabled")

        #drop all tables 
        # await conn.run_sync(Base.metadata.drop_all)
        # logger.info("dropped existing tables")

        # create all tables
        await conn.run_sync(Base.metadata.create_all)
        logger.info("created tables successfully")

        try:
            await conn.execute(text("""
                SELECT create_hypertable(
                    'ohlcv_daily',
                    'time',
                    if_not_exists => True,
                    chunk_time_interval => INTERVAL '1 month'
                    );
            """))

            logger.info("converted ohlcv_daily to timescaledb hypertable")
        except Exception as e:
            logger.warning(f"Hypertbale might already exist: {e}")

        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_ohlcv_stock_time_desc
            ON ohlcv_daily (stock_id, time DESC);
        """))
        logger.info("Database initalization complete")


async def reset_db():
    """drop and recreate all tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        logger.info("Dropped all tables")

    await init_db()


if __name__ == "__main__":
    import asyncio
    asyncio.run(init_db())