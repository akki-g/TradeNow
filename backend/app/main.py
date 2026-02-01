from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.db.init_db import init_db
from app.api.v1 import stocks

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting trading platform API")
    await init_db()
    yield 

    print("Shutting Down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    description="Stock analysis and backtesting platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(stocks.router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    await init_db()
    print('Trading platform API started')

@app.get("/")
async def root():
    return {
        "message": "Trading Platform API",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}



