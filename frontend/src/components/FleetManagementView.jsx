import { useState } from "react";
import {
  History,
  LayoutGrid,
  List,
  Plus,
  Search,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import { api } from "../api/client";
import { RENTAL_TYPE_LABEL, STATUS_META, formatVND } from "../utils/format";

export default function FleetManagementView({ vehicles, onRefresh, onBookVehicle }) {
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [viewMode, setViewMode] = useState("TABLE"); // TABLE | GRID
  const [showAddModal, setShowAddModal] = useState(false);
  const [logsModalVehicle, setLogsModalVehicle] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [newVehicle, setNewVehicle] = useState({
    license_plate: "",
    brand: "",
    model: "",
    year: 2024,
    seats: 5,
    color: "Trắng",
    location_city: "TP.HCM",
    location_district: "Quận 1",
    transmission: "Số tự động",
    fuel_type: "Xăng",
    rental_type: "SELF_DRIVE",
    driver_name: "",
    driver_phone: "",
    daily_rate: 900000,
    monthly_rate: 20000000,
    driver_daily_fee: 0,
    daily_km_limit: 250,
    extra_km_fee: 5000,
    late_hour_fee: 100000,
    current_odometer: 0,
  });

  const availCount = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const rentedCount = vehicles.filter((v) => v.status === "RENTED").length;
  const maintCount = vehicles.filter((v) => v.status === "MAINTENANCE").length;
  const selfDriveCount = vehicles.filter((v) => v.rental_type === "SELF_DRIVE").length;
  const withDriverCount = vehicles.filter((v) => v.rental_type === "WITH_DRIVER").length;

  const filtered = vehicles.filter((v) => {
    if (filterType && v.rental_type !== filterType) return false;
    if (filterStatus && v.status !== filterStatus) return false;
    if (keyword) {
      const kw = keyword.toLowerCase();
      if (!`${v.license_plate} ${v.brand} ${v.model}`.toLowerCase().includes(kw)) return false;
    }
    return true;
  });

  const handleSendMaintenance = async (v) => {
    setErrorMsg("");
    try {
      await api.sendToMaintenance(v.id, {
        description: "Bảo dưỡng định kỳ / Kiểm tra kỹ thuật",
        estimated_cost: 1000000,
      });
      onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleFinishMaintenance = async (v) => {
    setErrorMsg("");
    try {
      await api.finishMaintenance(v.id, {
        note: "Hoàn tất bảo trì, xe đạt chuẩn xuất bến",
      });
      onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleViewLogs = async (v) => {
    const detail = await api.getVehicleDetail(v.id);
    setLogsModalVehicle(detail);
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      await api.createVehicle({
        ...newVehicle,
        year: Number(newVehicle.year),
        seats: Number(newVehicle.seats),
        daily_rate: Number(newVehicle.daily_rate),
        monthly_rate: Number(newVehicle.monthly_rate),
        driver_daily_fee: Number(newVehicle.driver_daily_fee),
        daily_km_limit: Number(newVehicle.daily_km_limit),
        extra_km_fee: Number(newVehicle.extra_km_fee),
        late_hour_fee: Number(newVehicle.late_hour_fee),
        current_odometer: Number(newVehicle.current_odometer),
      });
      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Vận hành đội xe &bull; Danh mục phương tiện & State Machine
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#131b2e]">
            Quản lý Đội xe & Phương tiện
          </h2>
          <p className="text-sm text-[#444651]">
            Kiểm soát chặt chẽ vòng đời trạng thái xe (Rảnh → Đang thuê → Bảo trì) bằng State Machine Python.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#00236f] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1e3a8a]"
        >
          <Plus className="h-4 w-4" /> Thêm xe mới vào đội xe
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* 4 Mini KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500">Sẵn sàng giao</div>
          <div className="mt-1.5 text-2xl font-extrabold text-emerald-700">
            {availCount} <span className="text-xs font-medium text-slate-400">/ {vehicles.length} xe</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500">Đang cho thuê</div>
          <div className="mt-1.5 text-2xl font-extrabold text-[#00236f]">
            {rentedCount} <span className="text-xs font-medium text-slate-400">xe lăn bánh</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500">Đang bảo dưỡng</div>
          <div className="mt-1.5 text-2xl font-extrabold text-rose-600">
            {String(maintCount).padStart(2, "0")} <span className="text-xs font-medium text-slate-400">tại xưởng</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500">Phân loại dịch vụ</div>
          <div className="mt-1.5 text-sm font-bold text-slate-800">
            {selfDriveCount} Tự lái &bull; {withDriverCount} Có tài xế
          </div>
        </div>
      </div>

      {/* Filter Bar chuẩn AutoFleet Pro */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              placeholder="Tìm theo biển số, hãng xe..."
              className="w-48 bg-transparent text-xs focus:outline-none"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <button
            onClick={() => setFilterType("")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
              filterType === "" ? "bg-[#00236f] text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            Tất cả ({vehicles.length})
          </button>
          <button
            onClick={() => setFilterType("SELF_DRIVE")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
              filterType === "SELF_DRIVE" ? "bg-[#00236f] text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            Chỉ Tự lái ({selfDriveCount})
          </button>
          <button
            onClick={() => setFilterType("WITH_DRIVER")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
              filterType === "WITH_DRIVER" ? "bg-[#00236f] text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            Có tài xế ({withDriverCount})
          </button>

          <select
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Trạng thái: Toàn bộ</option>
            <option value="AVAILABLE">Sẵn sàng giao (Rảnh)</option>
            <option value="RENTED">Đang thuê</option>
            <option value="MAINTENANCE">Đang bảo trì</option>
          </select>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setViewMode("TABLE")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 ${
              viewMode === "TABLE" ? "bg-white text-[#00236f] shadow-xs" : "text-slate-600"
            }`}
          >
            <List className="h-3.5 w-3.5" /> Bảng dữ liệu
          </button>
          <button
            onClick={() => setViewMode("GRID")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 ${
              viewMode === "GRID" ? "bg-white text-[#00236f] shadow-xs" : "text-slate-600"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Lưới thẻ xe
          </button>
        </div>
      </div>

      {viewMode === "TABLE" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Phương tiện & Biển số</th>
                  <th className="px-4 py-3">Hình thức / Dòng xe</th>
                  <th className="px-4 py-3">Nhiên liệu / Truyền động</th>
                  <th className="px-4 py-3">ODO hiện tại</th>
                  <th className="px-4 py-3">Đơn giá thuê</th>
                  <th className="px-4 py-3">Trạng thái State Machine</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => {
                  const meta = STATUS_META[v.status];
                  return (
                    <tr key={v.id} className="hover:bg-[#f2f3ff]/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              v.image_url ||
                              "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=200&q=60"
                            }
                            alt={v.model}
                            className="h-11 w-16 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-mono text-xs font-bold text-[#131b2e]">
                              {v.license_plate}
                            </div>
                            <div className="text-xs text-slate-500">
                              {v.brand} {v.model} {v.year}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {RENTAL_TYPE_LABEL[v.rental_type]}
                        </span>
                        <div className="mt-1 text-xs text-slate-500">
                          {v.seats} chỗ {v.driver_name ? `• TX: ${v.driver_name}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div className="font-semibold text-slate-800">{v.fuel_type}</div>
                        <div>{v.transmission}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {v.current_odometer.toLocaleString()} km
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-[#131b2e]">{formatVND(v.daily_rate)}</div>
                        <div className="text-[11px] text-slate-500">/ ngày</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {v.status === "AVAILABLE" && (
                            <>
                              <button
                                onClick={() => onBookVehicle(v)}
                                className="rounded-lg bg-[#00236f] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1e3a8a]"
                              >
                                Cho thuê
                              </button>
                              <button
                                onClick={() => handleSendMaintenance(v)}
                                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                              >
                                Bảo trì
                              </button>
                            </>
                          )}
                          {v.status === "MAINTENANCE" && (
                            <button
                              onClick={() => handleFinishMaintenance(v)}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Hoàn tất bảo trì
                            </button>
                          )}
                          <button
                            onClick={() => handleViewLogs(v)}
                            title="Lịch sử State Machine"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                          >
                            <History className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => {
            const meta = STATUS_META[v.status];
            return (
              <div
                key={v.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {v.brand} {v.model} ({v.year})
                      </h3>
                      <p className="font-mono text-xs font-semibold text-slate-500">
                        {v.license_plate} • {v.seats} chỗ
                      </p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Giá ngày / tháng:</span>
                      <strong className="text-slate-900">
                        {formatVND(v.daily_rate)} / {formatVND(v.monthly_rate)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Odo hiện tại:</span>
                      <span>{v.current_odometer.toLocaleString()} km</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                  {v.status === "AVAILABLE" && (
                    <>
                      <button
                        onClick={() => onBookVehicle(v)}
                        className="flex-1 rounded-xl bg-[#00236f] py-2 text-xs font-semibold text-white"
                      >
                        Cho thuê ngay
                      </button>
                      <button
                        onClick={() => handleSendMaintenance(v)}
                        className="flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"
                      >
                        <Wrench className="h-3.5 w-3.5" /> Bảo trì
                      </button>
                    </>
                  )}
                  {v.status === "MAINTENANCE" && (
                    <button
                      onClick={() => handleFinishMaintenance(v)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white"
                    >
                      <ShieldCheck className="h-4 w-4" /> Hoàn tất bảo trì
                    </button>
                  )}
                  <button
                    onClick={() => handleViewLogs(v)}
                    className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                  >
                    <History className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Lịch sử State Machine */}
      {logsModalVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">
                Nhật ký State Machine — {logsModalVehicle.license_plate}
              </h3>
              <button onClick={() => setLogsModalVehicle(null)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 max-h-80 space-y-2.5 overflow-y-auto text-xs">
              {logsModalVehicle.state_logs?.map((log) => (
                <div key={log.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>
                      {STATUS_META[log.from_status]?.label} → {STATUS_META[log.to_status]?.label}
                    </span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px]">
                      {log.trigger}
                    </span>
                  </div>
                  {log.note && <p className="mt-1 text-slate-600">{log.note}</p>}
                  <p className="mt-1 text-[10px] text-slate-400">
                    {new Date(log.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm xe mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Thêm Xe Mới Vào Đội Xe</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateVehicle} className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <input
                required
                placeholder="Biển số (vd: 51K-123.45)"
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={newVehicle.license_plate}
                onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value })}
              />
              <input
                required
                placeholder="Hãng xe (vd: Toyota)"
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={newVehicle.brand}
                onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
              />
              <input
                required
                placeholder="Dòng xe (vd: Innova)"
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
              />
              <select
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={newVehicle.rental_type}
                onChange={(e) => setNewVehicle({ ...newVehicle, rental_type: e.target.value })}
              >
                <option value="SELF_DRIVE">Tự lái</option>
                <option value="WITH_DRIVER">Có tài xế</option>
              </select>
              <input
                type="number"
                required
                placeholder="Giá theo ngày"
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={newVehicle.daily_rate}
                onChange={(e) => setNewVehicle({ ...newVehicle, daily_rate: e.target.value })}
              />
              <input
                type="number"
                required
                placeholder="Giá theo tháng"
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={newVehicle.monthly_rate}
                onChange={(e) => setNewVehicle({ ...newVehicle, monthly_rate: e.target.value })}
              />
              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#00236f] px-5 py-2 font-semibold text-white hover:bg-[#1e3a8a]"
                >
                  Lưu xe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
