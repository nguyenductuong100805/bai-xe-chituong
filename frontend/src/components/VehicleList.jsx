import { useState } from "react";
import { History, Plus, ShieldCheck, Wrench, X } from "lucide-react";
import { api } from "../api/client";
import { RENTAL_TYPE_LABEL, STATUS_META, formatVND } from "../utils/format";

export default function VehicleList({ vehicles, onRefresh, onBookVehicle }) {
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
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

  const filtered = vehicles.filter((v) => {
    if (filterType && v.rental_type !== filterType) return false;
    if (filterStatus && v.status !== filterStatus) return false;
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
    <div className="space-y-4">
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Tất cả hình thức</option>
            <option value="SELF_DRIVE">Xe tự lái</option>
            <option value="WITH_DRIVER">Xe có tài xế</option>
          </select>
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="AVAILABLE">Rảnh</option>
            <option value="RENTED">Đang thuê</option>
            <option value="MAINTENANCE">Bảo trì</option>
          </select>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Thêm xe mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => {
          const meta = STATUS_META[v.status];
          return (
            <div
              key={v.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {v.brand} {v.model} ({v.year})
                    </h3>
                    <p className="mt-0.5 font-mono text-xs font-semibold text-slate-500">
                      {v.license_plate} • {v.seats} chỗ • {v.color}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                    {RENTAL_TYPE_LABEL[v.rental_type]}
                  </span>
                  {v.driver_name && (
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">
                      Tài xế: {v.driver_name}
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Giá theo ngày:</span>
                    <strong className="text-slate-900">{formatVND(v.daily_rate)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Giá theo tháng:</span>
                    <strong className="text-slate-900">{formatVND(v.monthly_rate)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Odo hiện tại:</span>
                    <span>{v.current_odometer.toLocaleString()} km</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {v.status === "AVAILABLE" && (
                  <>
                    <button
                      onClick={() => onBookVehicle(v)}
                      className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Cho thuê ngay
                    </button>
                    <button
                      onClick={() => handleSendMaintenance(v)}
                      className="flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                    >
                      <Wrench className="h-3.5 w-3.5" /> Bảo trì
                    </button>
                  </>
                )}

                {v.status === "MAINTENANCE" && (
                  <button
                    onClick={() => handleFinishMaintenance(v)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <ShieldCheck className="h-4 w-4" /> Hoàn tất bảo trì → Rảnh
                  </button>
                )}

                {v.status === "RENTED" && (
                  <span className="flex-1 rounded-xl bg-blue-50 py-2 text-center text-xs font-medium text-blue-700">
                    Đang thực hiện hợp đồng
                  </span>
                )}

                <button
                  onClick={() => handleViewLogs(v)}
                  title="Lịch sử State Machine"
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                >
                  <History className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal xem lịch sử State Machine */}
      {logsModalVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">
                Lịch sử State Machine — {logsModalVehicle.license_plate}
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

      {/* Modal thêm xe mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Thêm Xe Mới Vào Danh Mục</h3>
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
              {newVehicle.rental_type === "WITH_DRIVER" && (
                <>
                  <input
                    placeholder="Tên tài xế"
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={newVehicle.driver_name}
                    onChange={(e) => setNewVehicle({ ...newVehicle, driver_name: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Phí tài xế / ngày"
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={newVehicle.driver_daily_fee}
                    onChange={(e) => setNewVehicle({ ...newVehicle, driver_daily_fee: e.target.value })}
                  />
                </>
              )}
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
                  className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
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
