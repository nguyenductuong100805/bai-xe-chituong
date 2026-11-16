import hashlib
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db, transaction_scope
from app.models.entities import Customer, DriverProfile, UserAccount
from app.schemas.schemas import (
    AuthResponse,
    CustomerRegisterRequest,
    DriverRegisterRequest,
    LoginRequest,
    ProfileUpdateRequest,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Profiles"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def ensure_admin_account(db: Session) -> None:
    admin = db.execute(
        select(UserAccount).where(UserAccount.username == "tienpro")
    ).scalar_one_or_none()
    if not admin:
        with transaction_scope(db):
            db.add(
                UserAccount(
                    username="tienpro",
                    password_hash=hash_password("123456"),
                    role="ADMIN",
                    full_name="Quản trị viên (Nhà Xe Chí Tường)",
                )
            )


def _build_auth_response(db: Session, user: UserAccount) -> AuthResponse:
    customer = db.get(Customer, user.customer_id) if user.customer_id else None
    driver = db.get(DriverProfile, user.driver_id) if user.driver_id else None
    return AuthResponse(
        user_id=user.id,
        username=user.username,
        role=user.role,
        full_name=user.full_name,
        customer=customer,
        driver=driver,
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.execute(
        select(UserAccount).where(
            UserAccount.username == payload.username.strip(),
            UserAccount.role == payload.role.upper(),
        )
    ).scalar_one_or_none()

    if not user or user.password_hash != hash_password(payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai tên đăng nhập, mật khẩu hoặc vai trò không khớp.",
        )
    return _build_auth_response(db, user)


@router.post("/register/customer", response_model=AuthResponse, status_code=201)
def register_customer(payload: CustomerRegisterRequest, db: Session = Depends(get_db)):
    if db.execute(
        select(UserAccount).where(UserAccount.username == payload.username.strip())
    ).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Tên đăng nhập đã tồn tại.")

    existing_customer = db.execute(
        select(Customer).where(Customer.phone == payload.phone.strip())
    ).scalar_one_or_none()

    with transaction_scope(db):
        if existing_customer:
            customer = existing_customer
            customer.full_name = payload.full_name
            customer.date_of_birth = payload.date_of_birth
            customer.email = payload.email
            customer.id_card = payload.id_card
            customer.driver_license = payload.driver_license
            customer.address = payload.address
            customer.emergency_contact = payload.emergency_contact
        else:
            customer = Customer(
                full_name=payload.full_name,
                date_of_birth=payload.date_of_birth,
                phone=payload.phone.strip(),
                email=payload.email,
                id_card=payload.id_card,
                driver_license=payload.driver_license,
                address=payload.address,
                emergency_contact=payload.emergency_contact,
            )
            db.add(customer)
            db.flush()

        user = UserAccount(
            username=payload.username.strip(),
            password_hash=hash_password(payload.password),
            role="CUSTOMER",
            full_name=payload.full_name,
            customer_id=customer.id,
        )
        db.add(user)
        db.flush()
    return _build_auth_response(db, user)


@router.post("/register/driver", response_model=AuthResponse, status_code=201)
def register_driver(payload: DriverRegisterRequest, db: Session = Depends(get_db)):
    if db.execute(
        select(UserAccount).where(UserAccount.username == payload.username.strip())
    ).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Tên đăng nhập đã tồn tại.")

    if db.execute(
        select(DriverProfile).where(DriverProfile.phone == payload.phone.strip())
    ).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Số điện thoại tài xế đã được đăng ký.")

    with transaction_scope(db):
        driver = DriverProfile(
            full_name=payload.full_name,
            date_of_birth=payload.date_of_birth,
            phone=payload.phone.strip(),
            email=payload.email,
            id_card=payload.id_card,
            address=payload.address,
            license_class=payload.license_class,
            license_image_url=payload.license_image_url,
        )
        db.add(driver)
        db.flush()

        user = UserAccount(
            username=payload.username.strip(),
            password_hash=hash_password(payload.password),
            role="DRIVER",
            full_name=payload.full_name,
            driver_id=driver.id,
        )
        db.add(user)
        db.flush()
    return _build_auth_response(db, user)


@router.get("/profile/{user_id}", response_model=AuthResponse)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.get(UserAccount, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản.")
    return _build_auth_response(db, user)


@router.put("/profile/{user_id}", response_model=AuthResponse)
def update_profile(
    user_id: int,
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
):
    user = db.get(UserAccount, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản.")

    with transaction_scope(db):
        user.full_name = payload.full_name
        if user.role == "CUSTOMER" and user.customer_id:
            c: Optional[Customer] = db.get(Customer, user.customer_id)
            if c:
                c.full_name = payload.full_name
                c.date_of_birth = payload.date_of_birth
                c.phone = payload.phone
                c.email = payload.email
                c.id_card = payload.id_card
                c.driver_license = payload.driver_license
                c.address = payload.address
                c.emergency_contact = payload.emergency_contact
        elif user.role == "DRIVER" and user.driver_id:
            d: Optional[DriverProfile] = db.get(DriverProfile, user.driver_id)
            if d:
                d.full_name = payload.full_name
                d.date_of_birth = payload.date_of_birth
                d.phone = payload.phone
                d.email = payload.email
                d.id_card = payload.id_card
                d.address = payload.address
                if payload.license_class:
                    d.license_class = payload.license_class
                if payload.license_image_url is not None:
                    d.license_image_url = payload.license_image_url
    return _build_auth_response(db, user)
