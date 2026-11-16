from datetime import date
import json
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import transaction_scope
from app.dal.vehicle_dal import VehicleDAL
from app.models.entities import MaintenanceRecord, Vehicle, VehicleStateLog
from app.models.enums import RentalType, VehicleStatus
from app.schemas.schemas import FinishMaintenanceRequest, MaintenanceRequest, VehicleCreate
from app.state_machine.vehicle_sm import (
    InvalidStateTransitionError,
    VehicleStateMachine,
    VehicleTrigger,
)


class VehicleService:
    def __init__(self, db: Session):
        self.db = db
        self.vehicle_dal = VehicleDAL(db)

    def list_vehicles(
        self,
        rental_type: Optional[RentalType] = None,
        vehicle_status: Optional[VehicleStatus] = None,
        keyword: Optional[str] = None,
        city: Optional[str] = None,
        seats: Optional[int] = None,
        transmission: Optional[str] = None,
        fuel_type: Optional[str] = None,
        no_collateral: Optional[bool] = None,
        delivery_available: Optional[bool] = None,
        max_price: Optional[float] = None,
        sort_by: Optional[str] = None,
    ) -> List[Vehicle]:
        return self.vehicle_dal.filter_vehicles(
            rental_type=rental_type,
            status=vehicle_status,
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

    def get_vehicle_detail(self, vehicle_id: int) -> Vehicle:
        vehicle = self.vehicle_dal.get_with_logs(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy xe.")
        return vehicle

    def create_vehicle(self, payload: VehicleCreate) -> Vehicle:
        if self.vehicle_dal.get_by_license_plate(payload.license_plate):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Biển số '{payload.license_plate}' đã tồn tại trong hệ thống.",
            )
        with transaction_scope(self.db):
            data = payload.model_dump()
            gallery = data.pop("gallery_images", []) or []
            data["gallery_images"] = json.dumps(gallery)
            if not data.get("image_url") and gallery:
                data["image_url"] = gallery[0]
            vehicle = Vehicle(**data, status=VehicleStatus.AVAILABLE)
            self.vehicle_dal.create(vehicle)
            self.vehicle_dal.add_state_log(
                VehicleStateLog(
                    vehicle_id=vehicle.id,
                    from_status=VehicleStatus.AVAILABLE,
                    to_status=VehicleStatus.AVAILABLE,
                    trigger="INITIAL_REGISTER",
                    note="Thêm mới xe vào hệ thống",
                )
            )
            return vehicle

    def send_to_maintenance(self, vehicle_id: int, payload: MaintenanceRequest) -> Vehicle:
        vehicle = self.vehicle_dal.get_by_id(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy xe.")

        try:
            next_status = VehicleStateMachine.transition(
                vehicle.status, VehicleTrigger.SEND_TO_MAINTENANCE
            )
        except InvalidStateTransitionError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

        with transaction_scope(self.db):
            prev_status = vehicle.status
            vehicle.status = next_status
            self.vehicle_dal.update(vehicle)

            self.vehicle_dal.add_maintenance_record(
                MaintenanceRecord(
                    vehicle_id=vehicle.id,
                    description=payload.description,
                    cost=payload.estimated_cost,
                    start_date=date.today(),
                    is_completed=False,
                )
            )
            self.vehicle_dal.add_state_log(
                VehicleStateLog(
                    vehicle_id=vehicle.id,
                    from_status=prev_status,
                    to_status=next_status,
                    trigger=VehicleTrigger.SEND_TO_MAINTENANCE.value,
                    note=payload.description,
                )
            )
            return vehicle

    def finish_maintenance(self, vehicle_id: int, payload: FinishMaintenanceRequest) -> Vehicle:
        vehicle = self.vehicle_dal.get_by_id(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy xe.")

        try:
            next_status = VehicleStateMachine.transition(
                vehicle.status, VehicleTrigger.FINISH_MAINTENANCE
            )
        except InvalidStateTransitionError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

        with transaction_scope(self.db):
            prev_status = vehicle.status
            vehicle.status = next_status
            self.vehicle_dal.update(vehicle)

            self.vehicle_dal.complete_open_maintenance(
                vehicle_id=vehicle.id,
                end_date=date.today(),
                cost=payload.final_cost,
            )
            self.vehicle_dal.add_state_log(
                VehicleStateLog(
                    vehicle_id=vehicle.id,
                    from_status=prev_status,
                    to_status=next_status,
                    trigger=VehicleTrigger.FINISH_MAINTENANCE.value,
                    note=payload.note or "Hoàn tất bảo trì, xe sẵn sàng cho thuê",
                )
            )
            return vehicle
