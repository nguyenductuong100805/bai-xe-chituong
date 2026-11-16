from datetime import date
from typing import Dict, List, Optional

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.dal.base_dal import BaseDAL
from app.models.entities import (
    MaintenanceRecord,
    RentalContract,
    Review,
    Vehicle,
    VehicleStateLog,
)
from app.models.enums import ContractStatus, RentalType, VehicleStatus


class VehicleDAL(BaseDAL[Vehicle]):
    """
    Data Access Layer cho Vehicle.
    Hỗ trợ truy vấn nâng cao kiểu LINQ/HQL: lọc đa tiêu chí chuẩn Mioto,
    subquery kiểm tra lịch trống, GROUP BY thống kê, và eager loading.
    """

    def __init__(self, db: Session):
        super().__init__(Vehicle, db)

    def get_by_license_plate(self, license_plate: str) -> Optional[Vehicle]:
        stmt = select(Vehicle).where(Vehicle.license_plate == license_plate)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_with_logs(self, vehicle_id: int) -> Optional[Vehicle]:
        stmt = (
            select(Vehicle)
            .options(
                selectinload(Vehicle.state_logs),
                selectinload(Vehicle.maintenance_records),
                selectinload(Vehicle.reviews),
            )
            .where(Vehicle.id == vehicle_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def filter_vehicles(
        self,
        rental_type: Optional[RentalType] = None,
        status: Optional[VehicleStatus] = None,
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
        stmt = select(Vehicle)
        conditions = []
        if rental_type is not None:
            conditions.append(Vehicle.rental_type == rental_type)
        if status is not None:
            conditions.append(Vehicle.status == status)
        if city:
            conditions.append(Vehicle.location_city == city)
        if seats is not None:
            conditions.append(Vehicle.seats == seats)
        if transmission:
            conditions.append(Vehicle.transmission == transmission)
        if fuel_type:
            conditions.append(Vehicle.fuel_type == fuel_type)
        if no_collateral is True:
            conditions.append(Vehicle.no_collateral.is_(True))
        if delivery_available is True:
            conditions.append(Vehicle.delivery_available.is_(True))
        if max_price is not None:
            conditions.append(Vehicle.daily_rate <= max_price)
        if keyword:
            pattern = f"%{keyword.strip()}%"
            conditions.append(
                or_(
                    Vehicle.license_plate.ilike(pattern),
                    Vehicle.brand.ilike(pattern),
                    Vehicle.model.ilike(pattern),
                    Vehicle.location_district.ilike(pattern),
                    Vehicle.driver_name.ilike(pattern),
                )
            )
        if conditions:
            stmt = stmt.where(and_(*conditions))

        if sort_by == "price_asc":
            stmt = stmt.order_by(Vehicle.daily_rate.asc())
        elif sort_by == "price_desc":
            stmt = stmt.order_by(Vehicle.daily_rate.desc())
        elif sort_by == "rating_desc":
            stmt = stmt.order_by(Vehicle.rating.desc(), Vehicle.trips_count.desc())
        elif sort_by == "trips_desc":
            stmt = stmt.order_by(Vehicle.trips_count.desc())
        else:
            stmt = stmt.order_by(Vehicle.id.asc())

        return list(self.db.execute(stmt).scalars().all())

    def find_available_in_date_range(
        self,
        start_date: date,
        end_date: date,
        rental_type: Optional[RentalType] = None,
    ) -> List[Vehicle]:
        overlapping_contracts = (
            select(RentalContract.vehicle_id)
            .where(
                RentalContract.status == ContractStatus.ACTIVE,
                RentalContract.start_date <= end_date,
                RentalContract.expected_end_date >= start_date,
            )
            .scalar_subquery()
        )
        stmt = select(Vehicle).where(
            Vehicle.status == VehicleStatus.AVAILABLE,
            Vehicle.id.not_in(overlapping_contracts),
        )
        if rental_type is not None:
            stmt = stmt.where(Vehicle.rental_type == rental_type)
        stmt = stmt.order_by(Vehicle.daily_rate.asc())
        return list(self.db.execute(stmt).scalars().all())

    def get_status_summary(self) -> Dict[str, int]:
        stmt = select(Vehicle.status, func.count(Vehicle.id)).group_by(Vehicle.status)
        rows = self.db.execute(stmt).all()
        summary = {status.value: 0 for status in VehicleStatus}
        for status, count in rows:
            summary[status.value] = count
        return summary

    def add_state_log(self, log: VehicleStateLog) -> VehicleStateLog:
        self.db.add(log)
        self.db.flush()
        return log

    def add_maintenance_record(self, record: MaintenanceRecord) -> MaintenanceRecord:
        self.db.add(record)
        self.db.flush()
        return record

    def add_review(self, review: Review) -> Review:
        self.db.add(review)
        self.db.flush()
        return review

    def complete_open_maintenance(self, vehicle_id: int, end_date: date, cost: Optional[float] = None) -> None:
        stmt = (
            select(MaintenanceRecord)
            .where(
                MaintenanceRecord.vehicle_id == vehicle_id,
                MaintenanceRecord.is_completed.is_(False),
            )
            .order_by(MaintenanceRecord.id.desc())
        )
        records = self.db.execute(stmt).scalars().all()
        for rec in records:
            rec.is_completed = True
            rec.end_date = end_date
            if cost is not None:
                rec.cost = cost
            self.db.add(rec)
        self.db.flush()
