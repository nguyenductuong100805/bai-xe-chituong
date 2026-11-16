from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dal.contract_dal import ContractDAL
from app.dal.vehicle_dal import VehicleDAL
from app.models.entities import PromoCode
from app.models.enums import ContractStatus
from app.schemas.schemas import (
    ContractCreateRequest,
    ContractOut,
    DashboardSummary,
    ExtraFeePreview,
    PromoCodeOut,
    ReturnVehicleRequest,
)
from app.services.rental_service import RentalService

router = APIRouter(prefix="/api/contracts", tags=["Contracts & Rentals"])


@router.get("/promos", response_model=List[PromoCodeOut])
def list_active_promos(db: Session = Depends(get_db)):
    return list(
        db.execute(select(PromoCode).where(PromoCode.is_active.is_(True))).scalars().all()
    )


@router.get("", response_model=List[ContractOut])
def list_contracts(
    status: Optional[ContractStatus] = Query(default=None),
    vehicle_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    return ContractDAL(db).list_detailed(status=status, vehicle_id=vehicle_id)


@router.get("/calendar", response_model=List[ContractOut])
def get_calendar_contracts(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
):
    return ContractDAL(db).get_contracts_overlapping_period(start_date, end_date)


@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    vehicle_counts = VehicleDAL(db).get_status_summary()
    rev = ContractDAL(db).get_revenue_summary()
    active_count = len(ContractDAL(db).list_detailed(status=ContractStatus.ACTIVE))
    return DashboardSummary(
        vehicle_status_counts=vehicle_counts,
        total_vehicles=sum(vehicle_counts.values()),
        active_contracts=active_count,
        completed_contracts=rev["completed_contracts"],
        total_revenue=rev["total_revenue"],
        total_extra_fees=rev["total_extra_fees"],
    )


@router.post("", response_model=ContractOut, status_code=201)
def create_contract_and_handover(
    payload: ContractCreateRequest,
    db: Session = Depends(get_db),
):
    return RentalService(db).create_contract_and_handover(payload)


@router.post("/{contract_id}/preview-return", response_model=ExtraFeePreview)
def preview_return_fees(
    contract_id: int,
    payload: ReturnVehicleRequest,
    db: Session = Depends(get_db),
):
    return RentalService(db).preview_return_fees(contract_id, payload)


@router.post("/{contract_id}/return", response_model=ContractOut)
def return_vehicle_and_checkout(
    contract_id: int,
    payload: ReturnVehicleRequest,
    db: Session = Depends(get_db),
):
    return RentalService(db).return_vehicle_and_checkout(contract_id, payload)
