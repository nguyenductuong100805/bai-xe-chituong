from datetime import date, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.entities import Vehicle
from app.models.enums import ContractStatus, PricingMode, RentalType, VehicleStatus
from app.schemas.schemas import ContractCreateRequest, MaintenanceRequest, ReturnVehicleRequest
from app.services.rental_service import RentalService
from app.services.vehicle_service import VehicleService
from app.state_machine.vehicle_sm import (
    InvalidStateTransitionError,
    VehicleStateMachine,
    VehicleTrigger,
)


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


def test_state_machine_valid_and_invalid_transitions():
    assert (
        VehicleStateMachine.transition(VehicleStatus.AVAILABLE, VehicleTrigger.START_RENTAL)
        == VehicleStatus.RENTED
    )
    assert (
        VehicleStateMachine.transition(VehicleStatus.RENTED, VehicleTrigger.RETURN_NEED_MAINTENANCE)
        == VehicleStatus.MAINTENANCE
    )
    assert (
        VehicleStateMachine.transition(VehicleStatus.MAINTENANCE, VehicleTrigger.FINISH_MAINTENANCE)
        == VehicleStatus.AVAILABLE
    )

    with pytest.raises(InvalidStateTransitionError):
        VehicleStateMachine.transition(VehicleStatus.MAINTENANCE, VehicleTrigger.START_RENTAL)

    with pytest.raises(InvalidStateTransitionError):
        VehicleStateMachine.transition(VehicleStatus.RENTED, VehicleTrigger.SEND_TO_MAINTENANCE)


def test_contract_handover_extra_fees_and_return_transaction(db_session):
    vehicle = Vehicle(
        license_plate="51A-999.99",
        brand="Honda",
        model="Civic",
        year=2024,
        seats=5,
        color="Trắng",
        rental_type=RentalType.SELF_DRIVE,
        daily_rate=1000000,
        monthly_rate=22000000,
        driver_daily_fee=0,
        daily_km_limit=200,
        extra_km_fee=5000,
        late_hour_fee=100000,
        current_odometer=10000,
        status=VehicleStatus.AVAILABLE,
    )
    db_session.add(vehicle)
    db_session.commit()

    rental_service = RentalService(db_session)
    start = date(2026, 11, 1)
    end = date(2026, 11, 3)  # 3 ngày -> định mức 600 km

    contract = rental_service.create_contract_and_handover(
        ContractCreateRequest(
            vehicle_id=vehicle.id,
            customer_name="Nguyễn Văn A",
            customer_phone="0909000111",
            customer_id_card="079099000111",
            rental_type=RentalType.SELF_DRIVE,
            pricing_mode=PricingMode.DAILY,
            start_date=start,
            expected_end_date=end,
            deposit_amount=2000000,
            handover_fuel_percent=100,
        )
    )

    assert contract.status == ContractStatus.ACTIVE
    assert contract.base_rental_fee == 3000000
    db_session.refresh(vehicle)
    assert vehicle.status == VehicleStatus.RENTED

    # Không thể đưa xe đang thuê đi bảo trì trực tiếp
    with pytest.raises(Exception):
        VehicleService(db_session).send_to_maintenance(
            vehicle.id, MaintenanceRequest(description="Thay nhớt", estimated_cost=500000)
        )

    # Trả xe: chạy 700km (vượt 100km = 500k), trễ 2 giờ (200k), thiếu 20% xăng (300k), hư hỏng 0đ
    completed = rental_service.return_vehicle_and_checkout(
        contract.id,
        ReturnVehicleRequest(
            actual_return_date=end,
            return_odometer=10700,
            return_fuel_percent=80,
            late_hours=2,
            damage_fee=0,
            need_maintenance=False,
        ),
    )

    assert completed.status == ContractStatus.COMPLETED
    assert completed.extra_km_charge == 500000
    assert completed.late_fee_charge == 200000
    assert completed.fuel_fee_charge == 300000
    assert completed.total_extra_fee == 1000000
    assert completed.insurance_fee == 285000
    assert completed.total_amount == 4285000
    assert completed.amount_due_on_return == 2285000  # 4.285tr - 2tr cọc

    db_session.refresh(vehicle)
    assert vehicle.status == VehicleStatus.AVAILABLE
    assert vehicle.current_odometer == 10700
