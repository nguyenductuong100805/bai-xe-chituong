import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  Car,
  Compass,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { api } from "./api/client";
import AuthPage from "./components/AuthPage";
import BookingModal from "./components/BookingModal";
import CalendarBoard from "./components/CalendarBoard";
import ContractsWorkspaceView from "./components/ContractsWorkspaceView";
import CustomerPortalView from "./components/CustomerPortalView";
import DashboardView from "./components/DashboardView";
import DriverPortalView from "./components/DriverPortalView";
import DriversDispatchView from "./components/DriversDispatchView";
import FleetManagementView from "./components/FleetManagementView";
import MiotoExplore from "./components/MiotoExplore";
import ReturnCheckoutModal from "./components/ReturnCheckoutModal";
import VehicleDetailModal from "./components/VehicleDetailModal";

const AUTH_STORAGE_KEY = "nhaxechituong_auth";

const NAV_ITEMS = [
  { id: "DASHBOARD", label: "Tổng quan vận hành", icon: LayoutDashboard },
  { id: "FLEET", label: "Quản lý Đội xe", icon: Car },
  { id: "CONTRACTS", label: "Đơn đặt xe & Hợp đồng", icon: FileText },
  { id: "DRIVERS", label: "Điều phối & Tài xế", icon: Users },
  { id: "CALENDAR", label: "Lịch đặt xe (Ngày/Tháng)", icon: CalendarDays },
  { id: "EXPLORE", label: "Khám phá xe (Mioto)", icon: Compass },
];

export default function App() {
  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [topSearch, setTopSearch] = useState("");

  const [dashboard, setDashboard] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [contracts, setContracts] = useState([]);

  const [detailVehicleId, setDetailVehicleId] = useState(null);
  const [bookingTarget, setBookingTarget] = useState(null);
  const [checkoutContract, setCheckoutContract] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [dash, vehs, ctrs] = await Promise.all([
        api.getDashboard(),
        api.getVehicles(),
        api.getContracts(),
      ]);
      setDashboard(dash);
      setVehicles(vehs);
      setContracts(ctrs);
    } catch {
      // ignore transient errors
    }
  }, []);

  useEffect(() => {
    if (auth) {
      loadAll();
    }
  }, [auth, loadAll]);

  const handleLoginSuccess = (authData) => {
    setAuth(authData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  };

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  if (!auth) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (auth.role === "CUSTOMER") {
    return (
      <CustomerPortalView
        auth={auth}
        vehicles={vehicles}
        contracts={contracts}
        onRefresh={loadAll}
        onProfileUpdated={handleLoginSuccess}
        onLogout={handleLogout}
      />
    );
  }

  if (auth.role === "DRIVER") {
    return (
      <DriverPortalView
        auth={auth}
        vehicles={vehicles}
        onRefresh={loadAll}
        onProfileUpdated={handleLoginSuccess}
        onLogout={handleLogout}
      />
    );
  }

  const filteredVehicles = vehicles.filter((v) => {
    if (selectedCity && v.location_city !== selectedCity) return false;
    if (topSearch) {
      const kw = topSearch.toLowerCase();
      if (!`${v.license_plate} ${v.brand} ${v.model}`.toLowerCase().includes(kw)) {
        return false;
      }
    }
    return true;
  });

  const handleQuickNewBooking = () => {
    const firstAvailable =
      filteredVehicles.find((v) => v.status === "AVAILABLE") ||
      vehicles.find((v) => v.status === "AVAILABLE");
    if (firstAvailable) {
      setBookingTarget({
        vehicle: firstAvailable,
        initialDate: new Date().toISOString().slice(0, 10),
      });
    } else {
      alert("Hiện tại không có xe nào ở trạng thái Rảnh (AVAILABLE) để tạo đơn mới.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#faf8ff] text-[#131b2e]">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      )}

      {/* Left Sidebar (Nhà Xe Chí Tường - Admin ERP) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00236f] text-white shadow-xs">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight text-[#00236f]">
                  Nhà Xe Chí Tường
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Quản trị Vận hành ERP</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-[#f2f3ff] px-3 py-2 text-xs font-semibold text-[#131b2e]">
            <MapPin className="h-3.5 w-3.5 text-[#00236f]" />
            <select
              className="w-full bg-transparent focus:outline-none"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="">Toàn bộ chi nhánh</option>
              <option value="TP.HCM">Kho Tân Bình (TP.HCM)</option>
              <option value="Hà Nội">Kho Cầu Giấy (Hà Nội)</option>
              <option value="Đà Nẵng">Kho Hải Châu (Đà Nẵng)</option>
            </select>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold transition ${
                  isActive
                    ? "bg-[#00236f] text-white shadow-sm"
                    : "text-[#444651] hover:bg-[#f2f3ff] hover:text-[#00236f]"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="m-3 space-y-2.5 rounded-2xl bg-[#f2f3ff] p-3.5 text-xs">
          <div>
            <div className="font-bold text-[#131b2e]">Nhà Xe Chí Tường</div>
            <div className="text-[11px] text-slate-500">Admin: {auth.username}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-3.5 w-3.5" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-xs sm:px-6">
          <div className="flex flex-1 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                placeholder="Tìm biển số, dòng xe..."
                className="w-full bg-transparent text-xs focus:outline-none"
                value={topSearch}
                onChange={(e) => setTopSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleQuickNewBooking}
              className="flex items-center gap-1.5 rounded-xl bg-[#00236f] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1e3a8a]"
            >
              <Plus className="h-4 w-4" /> Tạo đơn thuê mới
            </button>

            <button
              title="Thông báo vận hành"
              className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>

            <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00236f] text-xs font-bold text-white">
                AD
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#131b2e]">{auth.username}</div>
                <div className="text-[11px] text-slate-500">Quản trị viên</div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          {activeTab === "DASHBOARD" && (
            <DashboardView
              dashboard={dashboard}
              vehicles={filteredVehicles}
              contracts={contracts}
              onRefresh={loadAll}
              onOpenNewBooking={handleQuickNewBooking}
              onCheckoutContract={(c) => setCheckoutContract(c)}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "FLEET" && (
            <FleetManagementView
              vehicles={filteredVehicles}
              onRefresh={loadAll}
              onBookVehicle={(vehicle) =>
                setBookingTarget({
                  vehicle,
                  initialDate: new Date().toISOString().slice(0, 10),
                })
              }
            />
          )}

          {activeTab === "CONTRACTS" && (
            <ContractsWorkspaceView
              contracts={contracts}
              onReturnCheckout={(c) => setCheckoutContract(c)}
              onOpenNewBooking={handleQuickNewBooking}
            />
          )}

          {activeTab === "DRIVERS" && (
            <DriversDispatchView
              vehicles={filteredVehicles}
              contracts={contracts}
              onCheckoutContract={(c) => setCheckoutContract(c)}
            />
          )}

          {activeTab === "CALENDAR" && (
            <CalendarBoard
              vehicles={filteredVehicles}
              contracts={contracts}
              onQuickBook={(vehicle, initialDate) =>
                setBookingTarget({ vehicle, initialDate })
              }
              onSelectContract={(c) => {
                if (c.status === "ACTIVE") setCheckoutContract(c);
              }}
            />
          )}

          {activeTab === "EXPLORE" && (
            <MiotoExplore
              vehicles={filteredVehicles}
              onViewDetail={(id) => setDetailVehicleId(id)}
              onBook={(vehicle) =>
                setBookingTarget({
                  vehicle,
                  initialDate: new Date().toISOString().slice(0, 10),
                })
              }
            />
          )}
        </main>
      </div>

      {detailVehicleId && (
        <VehicleDetailModal
          vehicleId={detailVehicleId}
          onClose={() => setDetailVehicleId(null)}
          onBook={(vehicle) => {
            setDetailVehicleId(null);
            setBookingTarget({
              vehicle,
              initialDate: new Date().toISOString().slice(0, 10),
            });
          }}
        />
      )}

      {bookingTarget && (
        <BookingModal
          vehicle={bookingTarget.vehicle}
          initialDate={bookingTarget.initialDate}
          onClose={() => setBookingTarget(null)}
          onSuccess={() => {
            setBookingTarget(null);
            loadAll();
          }}
        />
      )}

      {checkoutContract && (
        <ReturnCheckoutModal
          contract={checkoutContract}
          onClose={() => setCheckoutContract(null)}
          onSuccess={() => {
            setCheckoutContract(null);
            loadAll();
          }}
        />
      )}
    </div>
  );
}
