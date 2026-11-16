# AutoFleet — Hệ thống Quản lý Cho Thuê Ô Tô (Tự lái & Có tài xế)

## Kiến trúc
- **Backend:** Python, FastAPI, SQLAlchemy 2.0 ORM (Code-First + SQLite), Transaction (`transaction_scope`), Data Access Layer (`app/dal/`), State Machine (`app/state_machine/vehicle_sm.py`).
- **Frontend:** ReactJS (Vite + Tailwind CSS + Lucide Icons) với Lịch đặt xe trực quan Theo Ngày / Theo Tháng, Quản lý Đội xe & State Machine, Hợp đồng & Chốt thanh toán nhanh.

## Cách chạy Demo

### 1. Chạy Backend (FastAPI - Port 8000)
```powershell
cd e:\mon_sangt5\backend
.\.venv\Scripts\uvicorn app.main:app --reload --port 8000
```
API Docs (Swagger): http://127.0.0.1:8000/docs

### 2. Chạy Frontend (ReactJS - Port 5173)
```powershell
cd e:\mon_sangt5\frontend
npm run dev
```
Truy cập giao diện tại: http://localhost:5173

### 3. Chạy Unit Test Backend
```powershell
cd e:\mon_sangt5\backend
.\.venv\Scripts\pytest -v
```
