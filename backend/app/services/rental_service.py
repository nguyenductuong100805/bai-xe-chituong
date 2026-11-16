from datetime import date, datetime
import math
from typing import Tuple

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import transaction_scope
from app.dal.contract_dal import ContractDAL, CustomerDAL
from app.dal.vehicle_dal import VehicleDAL
from app.models.entities import (
    Customer,
    MaintenanceRecord,
    PromoCode,
    RentalContract,
    Vehicle,
    VehicleStateLog,
)
from app.models.enums import ContractStatus, PricingMode, RentalType
from app.schemas.schemas import (
    ContractCreateRequest,
    ExtraFeePreview,
    ReturnVehicleRequest,
)
from app.state_machine.vehicle_sm import (
    InvalidStateTransitionError,
    VehicleStateMachine,
    VehicleTrigger,
)

FUEL_PENALTY_PER_10_PERCENT = 150000.0


class RentalService:
    def __init__(self, db: Session):
        self.db = db
        self.vehicle_dal = VehicleDAL(db)
        self.customer_dal = CustomerDAL(db)
        self.contract_dal = ContractDAL(db)

    @staticmethod
    def calculate_base_fees(
        vehicle: Vehicle,
        rental_type: RentalType,
        pricing_mode: PricingMode,
        start_date: date,
        expected_end_date: date,
        include_insurance: bool = True,
        delivery_distance_km: int = 0,
    ) -> Tuple[float, float, float, float, int]:
        rental_days = max(1, (expected_end_date - start_date).days + 1)

        if pricing_mode == PricingMode.MONTHLY:
            months = max(1, math.ceil(rental_days / 30))
            base_rental_fee = vehicle.monthly_rate * months
        else:
            base_rental_fee = vehicle.daily_rate * rental_days

        driver_fee = 0.0
        if rental_type == RentalType.WITH_DRIVER:
            daily_driver = vehicle.driver_daily_fee if vehicle.driver_daily_fee > 0 else 500000.0
            driver_fee = daily_driver * rental_days

        insurance_fee = (vehicle.insurance_daily_fee * rental_days) if include_insurance else 0.0

        delivery_fee = 0.0
        if delivery_distance_km > vehicle.delivery_free_km and vehicle.delivery_available:
            billable_km = delivery_distance_km - vehicle.delivery_free_km
            delivery_fee = billable_km * vehicle.delivery_fee_per_km

        return base_rental_fee, driver_fee, insurance_fee, delivery_fee, rental_days

    @staticmethod
    def calculate_extra_fees(
        contract: RentalContract,
        vehicle: Vehicle,
        payload: ReturnVehicleRequest,
    ) -> ExtraFeePreview:
        planned_days = max(1, (contract.expected_end_date - contract.start_date).days + 1)
        actual_days = max(1, (payload.actual_return_date - contract.start_date).days + 1)

        extra_days = max(0, (payload.actual_return_date - contract.expected_end_date).days)
        extra_days_charge = extra_days * vehicle.daily_rate
        late_fee_charge = extra_days_charge + (payload.late_hours * vehicle.late_hour_fee)

        if payload.return_odometer < contract.handover_odometer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số km khi trả xe không thể nhỏ hơn số km lúc giao xe.",
            )
        driven_km = payload.return_odometer - contract.handover_odometer
        effective_days = max(planned_days, actual_days)
        allowed_km = effective_days * vehicle.daily_km_limit
        extra_km = max(0, driven_km - allowed_km)
        extra_km_charge = extra_km * vehicle.extra_km_fee

        fuel_diff = max(0, contract.handover_fuel_percent - payload.return_fuel_percent)
        fuel_fee_charge = math.ceil(fuel_diff / 10) * FUEL_PENALTY_PER_10_PERCENT if fuel_diff > 0 else 0.0

        damage_fee_charge = payload.damage_fee
        cleaning_fee_charge = payload.cleaning_fee

        total_extra_fee = (
            extra_km_charge
            + late_fee_charge
            + fuel_fee_charge
            + damage_fee_charge
            + cleaning_fee_charge
        )
        base_subtotal = (
            contract.base_rental_fee
            + contract.driver_fee
            + contract.insurance_fee
            + contract.delivery_fee
            - contract.discount_amount
        )
        total_amount = max(0.0, base_subtotal) + total_extra_fee
        amount_due_on_return = total_amount - contract.deposit_amount

        return ExtraFeePreview(
            rental_days=effective_days,
            extra_days_charge=extra_days_charge,
            driven_km=driven_km,
            allowed_km=allowed_km,
            extra_km=extra_km,
            extra_km_charge=extra_km_charge,
            late_fee_charge=late_fee_charge,
            fuel_fee_charge=fuel_fee_charge,
            damage_fee_charge=damage_fee_charge,
            cleaning_fee_charge=cleaning_fee_charge,
            total_extra_fee=total_extra_fee,
            total_amount=total_amount,
            deposit_amount=contract.deposit_amount,
            amount_due_on_return=amount_due_on_return,
        )

    def _resolve_promo_discount(self, promo_code_str: str | None, subtotal: float) -> Tuple[str | None, float]:
        if not promo_code_str or not promo_code_str.strip():
            return None, 0.0
        code_clean = promo_code_str.strip().upper()
        promo = self.db.execute(
            select(PromoCode).where(PromoCode.code == code_clean, PromoCode.is_active.is_(True))
        ).scalar_one_or_none()
        if not promo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mã giảm giá '{code_clean}' không hợp lệ hoặc đã hết hạn.",
            )
        discount = subtotal * (promo.discount_percent / 100.0)
        if promo.max_discount_amount > 0:
            discount = min(discount, promo.max_discount_amount)
        return code_clean, discount

    def create_contract_and_handover(self, payload: ContractCreateRequest) -> RentalContract:
        if payload.expected_end_date < payload.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ngày kết thúc dự kiến phải lớn hơn hoặc bằng ngày bắt đầu.",
            )

        vehicle = self.vehicle_dal.get_by_id(payload.vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy xe.")

        try:
            next_status = VehicleStateMachine.transition(
                vehicle.status, VehicleTrigger.START_RENTAL
            )
        except InvalidStateTransitionError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

        if self.contract_dal.has_overlapping_active_contract(
            vehicle.id, payload.start_date, payload.expected_end_date
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Xe đã có hợp đồng thuê trùng trong khoảng ngày này.",
            )

        base_rental_fee, driver_fee, insurance_fee, delivery_fee, _ = self.calculate_base_fees(
            vehicle=vehicle,
            rental_type=payload.rental_type,
            pricing_mode=payload.pricing_mode,
            start_date=payload.start_date,
            expected_end_date=payload.expected_end_date,
            include_insurance=payload.include_insurance,
            delivery_distance_km=payload.delivery_distance_km,
        )

        subtotal = base_rental_fee + driver_fee + insurance_fee + delivery_fee
        promo_code, discount_amount = self._resolve_promo_discount(payload.promo_code, subtotal)
        total_amount = max(0.0, subtotal - discount_amount)

        with transaction_scope(self.db):
            customer = self.customer_dal.get_by_phone(payload.customer_phone)
            if not customer:
                customer = Customer(
                    full_name=payload.customer_name,
                    phone=payload.customer_phone,
                    id_card=payload.customer_id_card,
                    driver_license=payload.customer_driver_license,
                )
                self.customer_dal.create(customer)

            handover_odo = (
                payload.handover_odometer
                if payload.handover_odometer is not None
                else vehicle.current_odometer
            )
            code = f"HD-{datetime.now().strftime('%Y%m%d%H%M%S')}-{vehicle.id}"

            contract = RentalContract(
                contract_code=code,
                vehicle_id=vehicle.id,
                customer_id=customer.id,
                rental_type=payload.rental_type,
                pricing_mode=payload.pricing_mode,
                start_date=payload.start_date,
                expected_end_date=payload.expected_end_date,
                base_rental_fee=base_rental_fee,
                driver_fee=driver_fee,
                insurance_fee=insurance_fee,
                delivery_address=payload.delivery_address,
                delivery_distance_km=payload.delivery_distance_km,
                delivery_fee=delivery_fee,
                promo_code=promo_code,
                discount_amount=discount_amount,
                collateral_type=payload.collateral_type,
                deposit_amount=payload.deposit_amount,
                handover_odometer=handover_odo,
                handover_fuel_percent=payload.handover_fuel_percent,
                handover_notes=payload.handover_notes,
                total_extra_fee=0.0,
                total_amount=total_amount,
                amount_due_on_return=total_amount - payload.deposit_amount,
                status=ContractStatus.ACTIVE,
            )
            self.contract_dal.create(contract)

            prev_status = vehicle.status
            vehicle.status = next_status
            vehicle.current_odometer = handover_odo
            self.vehicle_dal.update(vehicle)

            self.vehicle_dal.add_state_log(
                VehicleStateLog(
                    vehicle_id=vehicle.id,
                    from_status=prev_status,
                    to_status=next_status,
                    trigger=VehicleTrigger.START_RENTAL.value,
                    note=f"Giao xe theo hợp đồng {code} ({customer.full_name})",
                )
            )

        return self.contract_dal.get_detailed(contract.id)

    def preview_return_fees(self, contract_id: int, payload: ReturnVehicleRequest) -> ExtraFeePreview:
        contract = self.contract_dal.get_detailed(contract_id)
        if not contract:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hợp đồng.")
        if contract.status != ContractStatus.ACTIVE:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Hợp đồng này đã kết thúc.")
        return self.calculate_extra_fees(contract, contract.vehicle, payload)

    def return_vehicle_and_checkout(
        self, contract_id: int, payload: ReturnVehicleRequest
    ) -> RentalContract:
        contract = self.contract_dal.get_detailed(contract_id)
        if not contract:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hợp đồng.")
        if contract.status != ContractStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hợp đồng đã được thanh toán hoặc hủy trước đó.",
            )

        vehicle = contract.vehicle
        trigger = (
            VehicleTrigger.RETURN_NEED_MAINTENANCE
            if payload.need_maintenance
            else VehicleTrigger.RETURN_GOOD
        )
        try:
            next_status = VehicleStateMachine.transition(vehicle.status, trigger)
        except InvalidStateTransitionError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

        fee_summary = self.calculate_extra_fees(contract, vehicle, payload)

        with transaction_scope(self.db):
            contract.actual_return_date = payload.actual_return_date
            contract.return_odometer = payload.return_odometer
            contract.return_fuel_percent = payload.return_fuel_percent
            contract.return_notes = payload.return_notes
            contract.late_hours = payload.late_hours
            contract.extra_km_charge = fee_summary.extra_km_charge
            contract.late_fee_charge = fee_summary.late_fee_charge
            contract.fuel_fee_charge = fee_summary.fuel_fee_charge
            contract.damage_fee_charge = fee_summary.damage_fee_charge
            contract.cleaning_fee_charge = fee_summary.cleaning_fee_charge
            contract.total_extra_fee = fee_summary.total_extra_fee
            contract.total_amount = fee_summary.total_amount
            contract.amount_due_on_return = fee_summary.amount_due_on_return
            contract.status = ContractStatus.COMPLETED
            self.contract_dal.update(contract)

            prev_status = vehicle.status
            vehicle.status = next_status
            vehicle.current_odometer = payload.return_odometer
            vehicle.trips_count += 1
            self.vehicle_dal.update(vehicle)

            if payload.need_maintenance:
                self.vehicle_dal.add_maintenance_record(
                    MaintenanceRecord(
                        vehicle_id=vehicle.id,
                        description=payload.maintenance_description or "Bảo trì sau khi trả xe",
                        cost=payload.damage_fee,
                        start_date=payload.actual_return_date,
                        is_completed=False,
                    )
                )

            self.vehicle_dal.add_state_log(
                VehicleStateLog(
                    vehicle_id=vehicle.id,
                    from_status=prev_status,
                    to_status=next_status,
                    trigger=trigger.value,
                    note=f"Trả xe & thanh toán hợp đồng {contract.contract_code}",
                )
            )

        return self.contract_dal.get_detailed(contract.id)
