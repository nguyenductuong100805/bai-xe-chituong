import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Download,
  Navigation,
  RefreshCw,
  Wallet,
  Zap,
} from "lucide-react";
import { RENTAL_TYPE_LABEL, formatDate, formatVND } from "../utils/format";

export default function DashboardView({
  dashboard,
  vehicles,
  contracts,
  onRefresh,
  onOpenNewBooking,
  onCheckoutContract,
  onNavigate,
}) {
  const totalVehicles = dashboard?.total_vehicles || vehicles.length || 0;
  const availableCount = dashboard?.vehicle_status_counts?.AVAILABLE || 0;
  const rentedCount = dashboard?.vehicle_status_counts?.RENTED || 0;
  const maintCount = dashboard?.vehicle_status_counts?.MAINTENANCE || 0;
  const utilizationPct = totalVehicles > 0 ? Math.round((rentedCount / totalVehicles) * 100) : 0;

  const selfDriveCount = vehicles.filter((v) => v.rental_type === "SELF_DRIVE").length;
  const withDriverCount = vehicles.filter((v) => v.rental_type === "WITH_DRIVER").length;

  // Nhóm công suất theo số chỗ (5 chỗ / 7 chỗ / 16 chỗ)
  const segmentStats = [
    {
      label: "Sedan / CUV 4-5 chỗ (Vios, CX-5, VF8)",
      items: vehicles.filter((v) => v.seats <= 5),
    },
    {
      label: "SUV / MPV Gia đình 7 chỗ (SantaFe, Carnival)",
      items: vehicles.filter((v) => v.seats === 7),
    },
    {
      label: "Limousine / Thương mại 16 chỗ (Transit)",
      items: vehicles.filter((v) => v.seats > 7),
    },
  ];

  // Nhóm theo thành phố / trạm bãi
  const cityGroups = ["TP.HCM", "Hà Nội", "Đà Nẵng"].map((city) => {
    const list = vehicles.filter((v) => v.location_city === city);
    const avail = list.filter((v) => v.status === "AVAILABLE").length;
    return { city, total: list.length, avail };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Trực tiếp thời gian thực • State Machine & ORM Active
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#131b2e]">
            Tổng quan Vận hành Đội xe
          </h2>
          <p className="text-sm text-[#444651]">
            Giám sát trạng thái {totalVehicles} đầu xe, tiến độ điều phối tài xế và dòng tiền hợp đồng toàn chi nhánh.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới dữ liệu
          </button>
          <button
            onClick={() => onNavigate("CONTRACTS")}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" /> Xem báo cáo HĐ
          </button>
          <button
            onClick={onOpenNewBooking}
            className="flex items-center gap-1.5 rounded-xl bg-[#00236f] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1e3a8a]"
          >
            <Zap className="h-3.5 w-3.5" /> Phân công / Tạo đơn nhanh
          </button>
        </div>
      </div>

      {/* 5 KPI Cards chuẩn AutoFleet Pro */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tổng số phương tiện
            </span>
            <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Car className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[#131b2e]">{totalVehicles}</span>
            <span className="text-xs font-medium text-slate-500">xe</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {selfDriveCount} Tự lái | {withDriverCount} Có tài xế
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Xe đang lăn bánh
            </span>
            <span className="rounded-lg bg-cyan-50 p-2 text-[#00687a]">
              <Navigation className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[#131b2e]">{rentedCount}</span>
            <span className="text-xs font-medium text-slate-500">/ {totalVehicles}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500">Tỷ lệ lấp đầy</span>
            <span className="rounded-full bg-[#acedff] px-2 py-0.5 text-[11px] font-bold text-[#004e5c]">
              {utilizationPct}% khai thác
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Xe sẵn sàng tại bãi
            </span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-emerald-700">{availableCount}</span>
            <span className="text-xs font-medium text-slate-500">xe rảnh</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">Sẵn sàng nhận hợp đồng mới</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Cần xử lý & Bảo trì
            </span>
            <span className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-rose-600">
              {String(maintCount).padStart(2, "0")}
            </span>
            <span className="text-xs font-medium text-slate-500">xe bảo dưỡng</span>
          </div>
          <p className="mt-3 text-xs font-medium text-rose-600">
            Khóa xuất bến bởi State Machine
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#00236f] to-[#1e3a8a] p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#90a8ff]">
              Doanh thu đã chốt
            </span>
            <span className="rounded-lg bg-white/10 p-2 text-white">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-extrabold">
            {formatVND(dashboard?.total_revenue || 0)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#dce1ff]">
            <span>{dashboard?.completed_contracts || 0} HĐ hoàn tất</span>
            <span>Phí PS: {formatVND(dashboard?.total_extra_fees || 0)}</span>
          </div>
        </div>
      </div>

      {/* Công suất khai thác & Phân bổ trạm bãi */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#131b2e]">
                Công suất khai thác theo Phân khúc Xe
              </h3>
              <p className="text-xs text-slate-500">
                Tỷ trọng xe đang lăn bánh thực tế trên tổng quy mô từng dòng xe
              </p>
            </div>
            <button
              onClick={() => onNavigate("CALENDAR")}
              className="text-xs font-semibold text-[#00236f] hover:underline"
            >
              Xem lịch tháng →
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {segmentStats.map((seg) => {
              const total = seg.items.length;
              const rented = seg.items.filter((v) => v.status === "RENTED").length;
              const pct = total > 0 ? Math.round((rented / total) * 100) : 0;
              return (
                <div key={seg.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{seg.label}</span>
                    <span className="font-bold text-[#00236f]">
                      {rented} / {total} xe ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#eaedff]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00236f] to-[#00687a] transition-all"
                      style={{ width: `${Math.max(pct, total > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <h3 className="text-base font-bold text-[#131b2e]">Phân bổ xe theo Khu vực</h3>
          <p className="text-xs text-slate-500">Sức chứa & lượng xe sẵn sàng nhận khách</p>

          <div className="mt-4 space-y-3">
            {cityGroups.map((g) => (
              <div
                key={g.city}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-[#f2f3ff]/70 p-3.5"
              >
                <div>
                  <div className="text-sm font-bold text-[#131b2e]">Chi nhánh {g.city}</div>
                  <div className="text-xs text-slate-500">Tổng đội xe: {g.total} xe</div>
                </div>
                <span
                  className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                    g.avail > 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {g.avail} xe trống
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bảng Lịch Bàn giao & Tiếp nhận Xe */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#131b2e]">
              Lịch Bàn giao & Tiếp nhận Xe Gần Đây
            </h3>
            <p className="text-xs text-slate-500">
              Theo dõi lịch hẹn khách nhận xe và xe trả về bãi theo hợp đồng thực tế
            </p>
          </div>
          <button
            onClick={() => onNavigate("CONTRACTS")}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#00236f] hover:bg-slate-50"
          >
            Xem tất cả ({contracts.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã đơn & Hợp đồng</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Phương tiện & Biển số</th>
                <th className="px-4 py-3">Hình thức</th>
                <th className="px-4 py-3">Thời hạn thuê</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.slice(0, 6).map((c) => {
                const isActive = c.status === "ACTIVE";
                return (
                  <tr key={c.id} className="hover:bg-[#f2f3ff]/50">
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
                      <div className="font-mono text-xs text-slate-500">
                        {c.vehicle?.license_plate}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                          c.rental_type === "WITH_DRIVER"
                            ? "bg-[#acedff] text-[#004e5c]"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {RENTAL_TYPE_LABEL[c.rental_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatDate(c.start_date)} → {formatDate(c.expected_end_date)}
                    </td>
                    <td className="px-4 py-3">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Đang thực hiện
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Đã hoàn tất
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isActive ? (
                        <button
                          onClick={() => onCheckoutContract(c)}
                          className="rounded-xl bg-[#00236f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1e3a8a]"
                        >
                          Nghiệm thu & Trả xe
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">
                          {formatVND(c.total_amount)}
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
    </div>
  );
}
