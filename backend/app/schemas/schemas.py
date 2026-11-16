from datetime import date, datetime
import json
import re
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import ContractStatus, PricingMode, RentalType, VehicleStatus

VN_PLATE_REGEX = re.compile(r"^[0-9]{2}[A-Z]{1,2}-[0-9]{3,5}(\.[0-9]{2})?$")


def validate_vn_license_plate(value: str) -> str:
    cleaned = value.strip().upper()
    if not VN_PLATE_REGEX.match(cleaned):
        raise ValueError(
            "Biển số xe không đúng định dạng Việt Nam (VD hợp lệ: 51H-886.99, 30A-12345, 51K-123.45)."
        )
    return cleaned


class VehicleCreate(BaseModel):
    license_plate: str = Field(..., min_length=4, max_length=20)
    brand: str
    model: str
    year: int = Field(..., ge=2000, le=2030)
    seats: int = Field(default=5, ge=2, le=45)
    color: str = "Trắng"
    location_city: str = "TP.HCM"
    location_district: str = "Quận 1"
    transmission: str = "Số tự động"
    fuel_type: str = "Xăng"
    fuel_consumption: str = "7.5L/100km"
    features: str = "Bluetooth,Camera lùi,Cảm biến va chạm,Bản đồ,Thu phí không dừng ETC"
    image_url: Optional[str] = None
    gallery_images: List[str] = Field(default_factory=list)
    walkaround_video_url: Optional[str] = None
    no_collateral: bool = False
    delivery_available: bool = True
    delivery_free_km: int = 5
    delivery_fee_per_km: float = 15000.0
    insurance_daily_fee: float = 95000.0
    rental_type: RentalType = RentalType.SELF_DRIVE
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    driver_id: Optional[int] = None
    owner_name: Optional[str] = None
    vehicle_address: Optional[str] = None

    @field_validator("license_plate")
    @classmethod
    def check_plate(cls, v: str) -> str:
        return validate_vn_license_plate(v)
    daily_rate: float = Field(..., gt=0)
    monthly_rate: float = Field(..., gt=0)
    driver_daily_fee: float = Field(default=0.0, ge=0)
    daily_km_limit: int = Field(default=250, gt=0)
    extra_km_fee: float = Field(default=5000.0, ge=0)
    late_hour_fee: float = Field(default=100000.0, ge=0)
    current_odometer: int = Field(default=0, ge=0)
    notes: Optional[str] = None


class VehicleStateLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_status: VehicleStatus
    to_status: VehicleStatus
    trigger: str
    note: Optional[str]
    created_at: datetime


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author_name: str
    rating: int
    comment: str
    created_at: datetime


class ReviewCreate(BaseModel):
    author_name: str = Field(..., min_length=2)
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=3)


class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    license_plate: str
    brand: str
    model: str
    year: int
    seats: int
    color: str
    location_city: str
    location_district: str
    transmission: str
    fuel_type: str
    fuel_consumption: str
    features: str
    image_url: Optional[str]
    gallery_images: List[str] = Field(default_factory=list)
    walkaround_video_url: Optional[str] = None

    @field_validator("gallery_images", mode="before")
    @classmethod
    def parse_gallery(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else []
            except Exception:
                return []
        return v
    no_collateral: bool
    delivery_available: bool
    delivery_free_km: int
    delivery_fee_per_km: float
    insurance_daily_fee: float
    rating: float
    trips_count: int
    rental_type: RentalType
    driver_name: Optional[str]
    driver_phone: Optional[str]
    driver_id: Optional[int] = None
    owner_name: Optional[str] = None
    vehicle_address: Optional[str] = None
    daily_rate: float
    monthly_rate: float
    driver_daily_fee: float
    daily_km_limit: int
    extra_km_fee: float
    late_hour_fee: float
    current_odometer: int
    status: VehicleStatus
    notes: Optional[str]
    created_at: datetime


class VehicleDetailOut(VehicleOut):
    state_logs: List[VehicleStateLogOut] = []
    reviews: List[ReviewOut] = []


class MaintenanceRequest(BaseModel):
    description: str = Field(..., min_length=3)
    estimated_cost: float = Field(default=0.0, ge=0)


class FinishMaintenanceRequest(BaseModel):
    final_cost: Optional[float] = Field(default=None, ge=0)
    note: Optional[str] = None


class PromoCodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    description: str
    discount_percent: float
    max_discount_amount: float


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    date_of_birth: Optional[date] = None
    phone: str
    email: Optional[str] = None
    id_card: str
    driver_license: Optional[str]
    address: Optional[str]
    emergency_contact: Optional[str] = None


class DriverProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    date_of_birth: Optional[date] = None
    phone: str
    email: Optional[str] = None
    id_card: str
    address: Optional[str] = None
    license_class: str
    license_image_url: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str
    role: str  # ADMIN | CUSTOMER | DRIVER


class CustomerRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=4)
    full_name: str = Field(..., min_length=2)
    date_of_birth: Optional[date] = None
    phone: str = Field(..., min_length=8)
    email: Optional[str] = None
    id_card: str = Field(..., min_length=6)
    driver_license: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None


class DriverRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=4)
    full_name: str = Field(..., min_length=2)
    date_of_birth: Optional[date] = None
    phone: str = Field(..., min_length=8)
    email: Optional[str] = None
    id_card: str = Field(..., min_length=6)
    address: Optional[str] = None
    license_class: str = "B2"
    license_image_url: Optional[str] = None


class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(..., min_length=2)
    date_of_birth: Optional[date] = None
    phone: str = Field(..., min_length=8)
    email: Optional[str] = None
    id_card: str = Field(..., min_length=6)
    driver_license: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    license_class: Optional[str] = None
    license_image_url: Optional[str] = None


class AuthResponse(BaseModel):
    user_id: int
    username: str
    role: str
    full_name: str
    customer: Optional[CustomerOut] = None
    driver: Optional[DriverProfileOut] = None


class ContractCreateRequest(BaseModel):
    vehicle_id: int
    customer_name: str = Field(..., min_length=2)
    customer_phone: str = Field(..., min_length=8)
    customer_id_card: str = Field(..., min_length=6)
    customer_driver_license: Optional[str] = None

    rental_type: RentalType
    pricing_mode: PricingMode = PricingMode.DAILY
    start_date: date
    expected_end_date: date

    include_insurance: bool = True
    delivery_address: Optional[str] = None
    delivery_distance_km: int = Field(default=0, ge=0)
    promo_code: Optional[str] = None
    collateral_type: str = "MONEY"
    deposit_amount: float = Field(default=0.0, ge=0)

    handover_odometer: Optional[int] = Field(default=None, ge=0)
    handover_fuel_percent: int = Field(default=100, ge=0, le=100)
    handover_notes: Optional[str] = None


class ReturnVehicleRequest(BaseModel):
    actual_return_date: date
    return_odometer: int = Field(..., ge=0)
    return_fuel_percent: int = Field(default=100, ge=0, le=100)
    late_hours: int = Field(default=0, ge=0)
    damage_fee: float = Field(default=0.0, ge=0)
    cleaning_fee: float = Field(default=0.0, ge=0)
    need_maintenance: bool = False
    maintenance_description: Optional[str] = None
    return_notes: Optional[str] = None


class ContractOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    contract_code: str
    vehicle_id: int
    customer_id: int
    rental_type: RentalType
    pricing_mode: PricingMode
    start_date: date
    expected_end_date: date
    actual_return_date: Optional[date]
    base_rental_fee: float
    driver_fee: float
    insurance_fee: float
    delivery_address: Optional[str]
    delivery_distance_km: int
    delivery_fee: float
    promo_code: Optional[str]
    discount_amount: float
    collateral_type: str
    deposit_amount: float
    handover_odometer: int
    handover_fuel_percent: int
    handover_notes: Optional[str]
    return_odometer: Optional[int]
    return_fuel_percent: Optional[int]
    return_notes: Optional[str]
    late_hours: int
    extra_km_charge: float
    late_fee_charge: float
    fuel_fee_charge: float
    damage_fee_charge: float
    cleaning_fee_charge: float
    total_extra_fee: float
    total_amount: float
    amount_due_on_return: float
    status: ContractStatus
    created_at: datetime
    vehicle: Optional[VehicleOut] = None
    customer: Optional[CustomerOut] = None


class ExtraFeePreview(BaseModel):
    rental_days: int
    extra_days_charge: float
    driven_km: int
    allowed_km: int
    extra_km: int
    extra_km_charge: float
    late_fee_charge: float
    fuel_fee_charge: float
    damage_fee_charge: float
    cleaning_fee_charge: float
    total_extra_fee: float
    total_amount: float
    deposit_amount: float
    amount_due_on_return: float


class DashboardSummary(BaseModel):
    vehicle_status_counts: Dict[str, int]
    total_vehicles: int
    active_contracts: int
    completed_contracts: int
    total_revenue: float
    total_extra_fees: float
