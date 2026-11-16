from enum import Enum


class VehicleStatus(str, Enum):
    AVAILABLE = "AVAILABLE"       # Rảnh
    RENTED = "RENTED"             # Đang thuê
    MAINTENANCE = "MAINTENANCE"   # Bảo trì


class RentalType(str, Enum):
    SELF_DRIVE = "SELF_DRIVE"     # Tự lái
    WITH_DRIVER = "WITH_DRIVER"   # Có tài xế


class PricingMode(str, Enum):
    DAILY = "DAILY"               # Thuê theo ngày
    MONTHLY = "MONTHLY"           # Thuê theo tháng


class ContractStatus(str, Enum):
    ACTIVE = "ACTIVE"             # Đang thuê / Đã giao xe
    COMPLETED = "COMPLETED"       # Đã trả xe & Thanh toán
    CANCELLED = "CANCELLED"       # Đã hủy
