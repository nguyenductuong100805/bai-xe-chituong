import base64
from datetime import date
import os
from pathlib import Path
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db, transaction_scope
from app.dal.vehicle_dal import VehicleDAL
from app.models.entities import Review
from app.models.enums import RentalType, VehicleStatus
from app.schemas.schemas import (
    FinishMaintenanceRequest,
    MaintenanceRequest,
    ReviewCreate,
    ReviewOut,
    VehicleCreate,
    VehicleDetailOut,
    VehicleOut,
)
from app.services.vehicle_service import VehicleService

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])
UPLOAD_DIR = Path("/tmp/uploads") if os.environ.get("VERCEL") else Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class MediaUploadRequest(BaseModel):
    filename: str
    content_base64: str


@router.post("/upload-media")
def upload_vehicle_media(payload: MediaUploadRequest):
    raw_b64 = payload.content_base64
    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]
    try:
        binary = base64.b64decode(raw_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Dữ liệu file không hợp lệ.")

    ext = Path(payload.filename).suffix.lower() or ".bin"
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm", ".mov"}:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file ảnh (jpg/png/webp) hoặc video (mp4/webm/mov).")

    file_name = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / file_name
    dest.write_bytes(binary)
    return {"url": f"/uploads/{file_name}"}


@router.get("", response_model=List[VehicleOut])
def list_vehicles(
    rental_type: Optional[RentalType] = Query(default=None),
    status: Optional[VehicleStatus] = Query(default=None),
    keyword: Optional[str] = Query(default=None),
    city: Optional[str] = Query(default=None),
    seats: Optional[int] = Query(default=None),
    transmission: Optional[str] = Query(default=None),
    fuel_type: Optional[str] = Query(default=None),
    no_collateral: Optional[bool] = Query(default=None),
    delivery_available: Optional[bool] = Query(default=None),
    max_price: Optional[float] = Query(default=None),
    sort_by: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    return VehicleService(db).list_vehicles(
        rental_type=rental_type,
        vehicle_status=status,
        keyword=keyword,
        city=city,
        seats=seats,
        transmission=transmission,
        fuel_type=fuel_type,
        no_collateral=no_collateral,
        delivery_available=delivery_available,
        max_price=max_price,
        sort_by=sort_by,
    )


@router.get("/available", response_model=List[VehicleOut])
def find_available_vehicles(
    start_date: date = Query(...),
    end_date: date = Query(...),
    rental_type: Optional[RentalType] = Query(default=None),
    db: Session = Depends(get_db),
):
    return VehicleDAL(db).find_available_in_date_range(start_date, end_date, rental_type)


@router.get("/{vehicle_id}", response_model=VehicleDetailOut)
def get_vehicle_detail(vehicle_id: int, db: Session = Depends(get_db)):
    return VehicleService(db).get_vehicle_detail(vehicle_id)


@router.post("", response_model=VehicleOut, status_code=201)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    return VehicleService(db).create_vehicle(payload)


@router.post("/{vehicle_id}/reviews", response_model=ReviewOut, status_code=201)
def add_vehicle_review(
    vehicle_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
):
    dal = VehicleDAL(db)
    vehicle = dal.get_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy xe.")
    with transaction_scope(db):
        review = Review(
            vehicle_id=vehicle_id,
            author_name=payload.author_name,
            rating=payload.rating,
            comment=payload.comment,
        )
        dal.add_review(review)
        avg_rating = db.execute(
            select(func.avg(Review.rating)).where(Review.vehicle_id == vehicle_id)
        ).scalar_one()
        vehicle.rating = round(float(avg_rating or 5.0), 1)
        dal.update(vehicle)
        return review


@router.post("/{vehicle_id}/maintenance", response_model=VehicleOut)
def send_to_maintenance(
    vehicle_id: int,
    payload: MaintenanceRequest,
    db: Session = Depends(get_db),
):
    return VehicleService(db).send_to_maintenance(vehicle_id, payload)


@router.post("/{vehicle_id}/finish-maintenance", response_model=VehicleOut)
def finish_maintenance(
    vehicle_id: int,
    payload: FinishMaintenanceRequest,
    db: Session = Depends(get_db),
):
    return VehicleService(db).finish_maintenance(vehicle_id, payload)
