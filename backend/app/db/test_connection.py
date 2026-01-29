import asyncio
from sqlalchemy import text
from app.db.base import engine
from app.config import settings


async def test_connection():
    """Test Database connection and timescaleDB"""

    print(f"testing conn to: {settings.DATABASE_URL}")

    try: 
        async with engine.begin() as conn:

            result = await conn.execute(text("SELECT version();"))
            version = result.scalar()
            print(f"PostgreSQL version: {version}")

            result = await conn.execute(text("""
                SELECT extname, extversion
                FROM pg_extension
                WHERE extname = 'timescaledb';
        """))
            timescale = result.first()

            if timescale:
                print(f"timescale version: {timescale[1]}")
            else:
                print("timescaledb extention not found")

            print("database connection successful")

    except Exception as e:
        print(f"Connectoin failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(test_connection())