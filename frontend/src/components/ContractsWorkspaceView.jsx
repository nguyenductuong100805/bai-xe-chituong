import { useEffect, useState } from "react";
import { CheckCircle2, Clock, FileText, Fuel, Gauge, Plus } from "lucide-react";
import { RENTAL_TYPE_LABEL, formatDate, formatVND } from "../utils/format";

export default function ContractsWorkspaceView({
  contracts,
  onReturnCheckout,
  onOpenNewBooking,
}) {
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const filtered = contracts.filter((c) => {
    if (filterType && c.rental_type !== filterType) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  useEffect(() => {
    if (!selectedId && filtered.length > 0) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selectedContract =
    contracts.find((c) => c.id === selectedId) || filtered[0] || null;

  const activeCount = contracts.filter((c) => c.status === "ACTIVE").length;
  const completedCount = contracts.filter((c) => c.status === "COMPLETED").length;
  const selfDriveCount = contracts.filter((c) => c.rental_type === "SELF_DRIVE").length;
  const withDriverCount = contracts.filter((c) => c.rental_type === "WITH_DRIVER").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Hệ thống quản trị hợp đồng điện tử & Giao nhận
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#131b2e]">
            Quản lý Đơn đặt & Hợp đồng thuê xe
          </h2>
          <p className="text-sm text-[#444651]">
            Tối ưu hóa quy trình lập hợp đồng, kiểm tra biên bản bàn giao kỹ thuật số và chốt phí phát sinh.
          </p>
        </div>
        <button
          onClick={onOpenNewBooking}
          className="flex items-center gap-1.5 rounded-xl bg-[#00236f] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1e3a8a]"
        >
          <Plus className="h-4 w-4" /> Tạo hợp đồng mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Tất cả đơn</div>
          <div className="mt-1 text-2xl font-extrabold text-[#131b2e]">{contracts.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Đang thực hiện</div>
          <div className="mt-1 text-2xl font-extrabold text-[#00236f]">{activeCount}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Đã hoàn tất</div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-700">{completedCount}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Tự lái / Có tài xế</div>
          <div className="mt-1 text-sm font-bold text-slate-800">
            {selfDriveCount} Tự lái &bull; {withDriverCount} Có tài xế
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterType("")}
          className={`rounded-xl px-3.5 py-2 text-xs font-semibold ${
            filterType === "" ? "bg-[#00236f] text-white" : "border border-slate-200 bg-white text-slate-700"
          }`}
        >
          Tất cả đơn
        </button>
        <button
          onClick={() => setFilterType("SELF_DRIVE")}
          className={`rounded-xl px-3.5 py-2 text-xs font-semibold ${
            filterType === "SELF_DRIVE"
              ? "bg-[#00236f] text-white"
              : "border border-slate-200 bg-white text-slate-700"
          }`}
        >
          Thuê tự lái ({selfDriveCount})
        </button>
        <button
          onClick={() => setFilterType("WITH_DRIVER")}
          className={`rounded-xl px-3.5 py-2 text-xs font-semibold ${
            filterType === "WITH_DRIVER"
              ? "bg-[#00236f] text-white"
              : "border border-slate-200 bg-white text-slate-700"
          }`}
        >
          Thuê có tài xế ({withDriverCount})
        </button>

        <select
          className="ml-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang thuê</option>
          <option value="COMPLETED">Đã hoàn tất</option>
        </select>
      </div>

      {/* 2-Column Workspace */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Danh sách Hợp đồng (8 cols) */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs lg:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#131b2e]">
              <FileText className="h-4 w-4 text-[#00236f]" /> Danh sách Hợp đồng ({filtered.length})
            </h3>
            <span className="text-xs text-slate-400">Chọn 1 dòng để xem biên bản</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Mã HĐ</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Phương tiện</th>
                  <th className="px-4 py-3">Lịch trình</th>
                  <th className="px-4 py-3 text-right">Tổng tiền</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => {
                  const isSelected = selectedContract?.id === c.id;
                  const isActive = c.status === "ACTIVE";
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`cursor-pointer transition ${
                        isSelected ? "bg-[#eaedff]/70" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-bold text-[#00236f]">
                        {c.contract_code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{c.customer?.full_name}</div>
                        <div className="text-xs text-slate-500">{c.customer?.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {c.vehicle?.brand} {c.vehicle?.model}
                        </div>
                        <div className="text-xs text-slate-500">
                          {c.vehicle?.license_plate} &bull; {RENTAL_TYPE_LABEL[c.rental_type]}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div>{formatDate(c.start_date)}</div>
                        <div>→ {formatDate(c.expected_end_date)}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        <div>{formatVND(c.total_amount)}</div>
                        {c.total_extra_fee > 0 && (
                          <div className="text-[11px] font-medium text-rose-600">
                            + {formatVND(c.total_extra_fee)} PS
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                            <Clock className="h-3 w-3" /> Đang thuê
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Hoàn tất
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Xem nhanh Biên bản Kỹ thuật số (4 cols) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-4">
          {selectedContract ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Biên bản kỹ thuật số
                  </div>
                  <h3 className="text-lg font-extrabold text-[#00236f]">
                    {selectedContract.contract_code}
                  </h3>
                </div>
                <span className="rounded-full bg-[#acedff] px-2.5 py-1 text-[11px] font-bold text-[#004e5c]">
                  {selectedContract.status === "ACTIVE" ? "Đang vận hành" : "Đã nghiệm thu"}
                </span>
              </div>

              {selectedContract.vehicle?.image_url && (
                <div className="overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={selectedContract.vehicle.image_url}
                    alt={selectedContract.vehicle.model}
                    className="h-36 w-full object-cover"
                  />
                </div>
              )}

              {/* Chỉ số ODO */}
              <div className="rounded-xl bg-[#f2f3ff] p-3.5">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#131b2e]">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="h-4 w-4 text-[#00236f]" /> Chỉ số ODO & Quãng đường
                  </span>
                  <span className="text-[11px] text-[#00687a]">
                    Định mức {selectedContract.vehicle?.daily_km_limit} km/ngày
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-white p-2.5">
                    <div className="text-slate-400">ODO Bàn giao</div>
                    <div className="mt-0.5 text-sm font-extrabold text-slate-900">
                      {selectedContract.handover_odometer.toLocaleString()} km
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-2.5">
                    <div className="text-slate-400">
                      {selectedContract.return_odometer ? "ODO Khi trả" : "ODO Hiện tại"}
                    </div>
                    <div className="mt-0.5 text-sm font-extrabold text-[#00236f]">
                      {(
                        selectedContract.return_odometer ??
                        selectedContract.vehicle?.current_odometer ??
                        0
                      ).toLocaleString()}{" "}
                      km
                    </div>
                  </div>
                </div>
              </div>

              {/* Mức nhiên liệu */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs">
                <div className="mb-2 flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Fuel className="h-4 w-4 text-[#00687a]" /> Mức nhiên liệu / Pin
                  </span>
                  <span>
                    Giao: {selectedContract.handover_fuel_percent}%
                    {selectedContract.return_fuel_percent !== null &&
                      ` → Trả: ${selectedContract.return_fuel_percent}%`}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#00687a]"
                    style={{
                      width: `${
                        selectedContract.return_fuel_percent ??
                        selectedContract.handover_fuel_percent
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Tóm tắt tài chính */}
              <div className="space-y-1.5 rounded-xl border border-slate-200 p-3.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tiền thuê + Tài xế:</span>
                  <span className="font-semibold">
                    {formatVND(selectedContract.base_rental_fee + selectedContract.driver_fee)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Bảo hiểm + Giao xe:</span>
                  <span className="font-semibold">
                    {formatVND(selectedContract.insurance_fee + selectedContract.delivery_fee)}
                  </span>
                </div>
                {selectedContract.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Giảm giá ({selectedContract.promo_code}):</span>
                    <span>- {formatVND(selectedContract.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Phí phát sinh:</span>
                  <span className="font-semibold text-rose-600">
                    {formatVND(selectedContract.total_extra_fee)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-[#00236f]">
                  <span>Tổng giá trị HĐ:</span>
                  <span>{formatVND(selectedContract.total_amount)}</span>
                </div>
              </div>

              {selectedContract.status === "ACTIVE" && (
                <button
                  onClick={() => onReturnCheckout(selectedContract)}
                  className="w-full rounded-xl bg-[#00236f] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#1e3a8a]"
                >
                  Nghiệm thu & Chốt thanh toán trả xe
                </button>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Chưa có hợp đồng nào được chọn
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
