from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import Base, SessionLocal, engine
from app.routers import auth, contracts, vehicles
from app.routers.auth import ensure_admin_account

Path("uploads").mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code-First: tạo bảng từ SQLAlchemy Models và đảm bảo tài khoản Admin (tienpro / 123456)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_admin_account(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Nhà Xe Chí Tường — API Quản Lý Cho Thuê Ô Tô",
    description="Hệ thống quản lý danh mục xe tự lái & có tài xế, State Machine, Hợp đồng, Giao nhận & Tính phí phát sinh.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(contracts.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "brand": "Nhà Xe Chí Tường"}
