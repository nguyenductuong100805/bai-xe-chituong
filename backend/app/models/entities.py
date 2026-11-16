from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import Boolean, Date, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ContractStatus, PricingMode, RentalType, VehicleStatus


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    license_plate: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    brand: Mapped[str] = mapped_column(String(60), nullable=False)
    model: Mapped[str] = mapped_column(String(80), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    seats: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    color: Mapped[str] = mapped_column(String(30), default="Trắng", nullable=False)

    # Thuộc tính chuẩn Mioto (Khu vực, Truyền động, Nhiên liệu, Tiện ích, Bảo hiểm, Giao xe)
    location_city: Mapped[str] = mapped_column(String(60), default="TP.HCM", nullable=False, index=True)
    location_district: Mapped[str] = mapped_column(String(60), default="Quận 1", nullable=False)
    transmission: Mapped[str] = mapped_column(String(30), default="Số tự động", nullable=False)
    fuel_type: Mapped[str] = mapped_column(String(30), default="Xăng", nullable=False)
    fuel_consumption: Mapped[str] = mapped_column(String(40), default="7.5L/100km", nullable=False)
    features: Mapped[str] = mapped_column(
        Text, default="Bluetooth,Camera lùi,Cảm biến va chạm,Bản đồ,Thu phí không dừng ETC", nullable=False
    )
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    gallery_images: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of image URLs
    walkaround_video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    no_collateral: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    delivery_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    delivery_free_km: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    delivery_fee_per_km: Mapped[float] = mapped_column(Float, default=15000.0, nullable=False)
    insurance_daily_fee: Mapped[float] = mapped_column(Float, default=95000.0, nullable=False)

    rating: Mapped[float] = mapped_column(Float, default=4.9, nullable=False)
    trips_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    rental_type: Mapped[RentalType] = mapped_column(
        SAEnum(RentalType), default=RentalType.SELF_DRIVE, nullable=False
    )
    driver_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    driver_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    driver_id: Mapped[Optional[int]] = mapped_column(ForeignKey("driver_profiles.id"), nullable=True)
    owner_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    vehicle_address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    daily_rate: Mapped[float] = mapped_column(Float, nullable=False)
    monthly_rate: Mapped[float] = mapped_column(Float, nullable=False)
    driver_daily_fee: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    daily_km_limit: Mapped[int] = mapped_column(Integer, default=250, nullable=False)
    extra_km_fee: Mapped[float] = mapped_column(Float, default=5000.0, nullable=False)
    late_hour_fee: Mapped[float] = mapped_column(Float, default=100000.0, nullable=False)

    current_odometer: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[VehicleStatus] = mapped_column(
        SAEnum(VehicleStatus), default=VehicleStatus.AVAILABLE, nullable=False, index=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)

    contracts: Mapped[List["RentalContract"]] = relationship(back_populates="vehicle")
    state_logs: Mapped[List["VehicleStateLog"]] = relationship(
        back_populates="vehicle", order_by="desc(VehicleStateLog.created_at)"
    )
    maintenance_records: Mapped[List["MaintenanceRecord"]] = relationship(back_populates="vehicle")
    reviews: Mapped[List["Review"]] = relationship(
        back_populates="vehicle", order_by="desc(Review.created_at)"
    )


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    id_card: Mapped[str] = mapped_column(String(30), nullable=False)
    driver_license: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    emergency_contact: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)

    contracts: Mapped[List["RentalContract"]] = relationship(back_populates="customer")


class DriverProfile(Base):
    __tablename__ = "driver_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    id_card: Mapped[str] = mapped_column(String(30), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    license_class: Mapped[str] = mapped_column(String(20), default="B2", nullable=False)
    license_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(60), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # ADMIN | CUSTOMER | DRIVER
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    customer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("customers.id"), nullable=True)
    driver_id: Mapped[Optional[int]] = mapped_column(ForeignKey("driver_profiles.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(200), nullable=False)
    discount_percent: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    max_discount_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class RentalContract(Base):
    __tablename__ = "rental_contracts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    contract_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)

    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False, index=True)

    rental_type: Mapped[RentalType] = mapped_column(SAEnum(RentalType), nullable=False)
    pricing_mode: Mapped[PricingMode] = mapped_column(SAEnum(PricingMode), default=PricingMode.DAILY, nullable=False)

    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    expected_end_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    actual_return_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    base_rental_fee: Mapped[float] = mapped_column(Float, nullable=False)
    driver_fee: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    insurance_fee: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    delivery_address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    delivery_distance_km: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    delivery_fee: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    promo_code: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    discount_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    collateral_type: Mapped[str] = mapped_column(String(30), default="MONEY", nullable=False)
    deposit_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Handover (Giao xe)
    handover_odometer: Mapped[int] = mapped_column(Integer, nullable=False)
    handover_fuel_percent: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    handover_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Return & Extra Fees (Nhận xe & Phí phát sinh)
    return_odometer: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    return_fuel_percent: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    return_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    late_hours: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    extra_km_charge: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    late_fee_charge: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    fuel_fee_charge: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    damage_fee_charge: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    cleaning_fee_charge: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    total_extra_fee: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    amount_due_on_return: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    status: Mapped[ContractStatus] = mapped_column(
        SAEnum(ContractStatus), default=ContractStatus.ACTIVE, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)

    vehicle: Mapped["Vehicle"] = relationship(back_populates="contracts")
    customer: Mapped["Customer"] = relationship(back_populates="contracts")
    review: Mapped[Optional["Review"]] = relationship(back_populates="contract", uselist=False)


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False, index=True)
    contract_id: Mapped[Optional[int]] = mapped_column(ForeignKey("rental_contracts.id"), nullable=True)
    author_name: Mapped[str] = mapped_column(String(100), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)

    vehicle: Mapped["Vehicle"] = relationship(back_populates="reviews")
    contract: Mapped[Optional["RentalContract"]] = relationship(back_populates="review")


class VehicleStateLog(Base):
    __tablename__ = "vehicle_state_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False, index=True)
    from_status: Mapped[VehicleStatus] = mapped_column(SAEnum(VehicleStatus), nullable=False)
    to_status: Mapped[VehicleStatus] = mapped_column(SAEnum(VehicleStatus), nullable=False)
    trigger: Mapped[str] = mapped_column(String(50), nullable=False)
    note: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)

    vehicle: Mapped["Vehicle"] = relationship(back_populates="state_logs")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_completed: Mapped[bool] = mapped_column(default=False, nullable=False)

    vehicle: Mapped["Vehicle"] = relationship(back_populates="maintenance_records")
