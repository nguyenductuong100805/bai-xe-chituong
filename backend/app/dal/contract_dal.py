from datetime import date
from typing import Dict, List, Optional

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, joinedload

from app.dal.base_dal import BaseDAL
from app.models.entities import Customer, RentalContract
from app.models.enums import ContractStatus


class CustomerDAL(BaseDAL[Customer]):
    def __init__(self, db: Session):
        super().__init__(Customer, db)

    def get_by_phone(self, phone: str) -> Optional[Customer]:
        stmt = select(Customer).where(Customer.phone == phone)
        return self.db.execute(stmt).scalar_one_or_none()


class ContractDAL(BaseDAL[RentalContract]):
    """
    Data Access Layer cho RentalContract.
    Hỗ trợ truy vấn giao thoa lịch đặt theo ngày/tháng và tổng hợp doanh thu.
    """

    def __init__(self, db: Session):
        super().__init__(RentalContract, db)

    def get_detailed(self, contract_id: int) -> Optional[RentalContract]:
        stmt = (
            select(RentalContract)
            .options(joinedload(RentalContract.vehicle), joinedload(RentalContract.customer))
            .where(RentalContract.id == contract_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_detailed(
        self,
        status: Optional[ContractStatus] = None,
        vehicle_id: Optional[int] = None,
    ) -> List[RentalContract]:
        stmt = (
            select(RentalContract)
            .options(joinedload(RentalContract.vehicle), joinedload(RentalContract.customer))
        )
        conditions = []
        if status is not None:
            conditions.append(RentalContract.status == status)
        if vehicle_id is not None:
            conditions.append(RentalContract.vehicle_id == vehicle_id)
        if conditions:
            stmt = stmt.where(and_(*conditions))
        stmt = stmt.order_by(RentalContract.id.desc())
        return list(self.db.execute(stmt).scalars().all())

    def has_overlapping_active_contract(
        self,
        vehicle_id: int,
        start_date: date,
        end_date: date,
        exclude_contract_id: Optional[int] = None,
    ) -> bool:
        stmt = select(func.count(RentalContract.id)).where(
            RentalContract.vehicle_id == vehicle_id,
            RentalContract.status == ContractStatus.ACTIVE,
            RentalContract.start_date <= end_date,
            RentalContract.expected_end_date >= start_date,
        )
        if exclude_contract_id is not None:
            stmt = stmt.where(RentalContract.id != exclude_contract_id)
        count = self.db.execute(stmt).scalar_one()
        return count > 0

    def get_contracts_overlapping_period(
        self,
        period_start: date,
        period_end: date,
    ) -> List[RentalContract]:
        """Lấy toàn bộ hợp đồng (ACTIVE hoặc COMPLETED) giao thoa với khoảng lịch [period_start, period_end]."""
        stmt = (
            select(RentalContract)
            .options(joinedload(RentalContract.vehicle), joinedload(RentalContract.customer))
            .where(
                RentalContract.status != ContractStatus.CANCELLED,
                RentalContract.start_date <= period_end,
                RentalContract.expected_end_date >= period_start,
            )
            .order_by(RentalContract.start_date.asc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_revenue_summary(self) -> Dict[str, float]:
        stmt = select(
            func.coalesce(func.sum(RentalContract.total_amount), 0.0),
            func.coalesce(func.sum(RentalContract.total_extra_fee), 0.0),
            func.count(RentalContract.id),
        ).where(RentalContract.status == ContractStatus.COMPLETED)
        total_revenue, total_extra, completed_count = self.db.execute(stmt).one()
        return {
            "completed_contracts": int(completed_count),
            "total_revenue": float(total_revenue),
            "total_extra_fees": float(total_extra),
        }
