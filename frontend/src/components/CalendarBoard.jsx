import { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { RENTAL_TYPE_LABEL, STATUS_META, formatVND } from "../utils/format";

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarBoard({ vehicles, contracts, onQuickBook, onSelectContract }) {
  const [viewMode, setViewMode] = useState("MONTH"); // MONTH | DAY
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => toISODate(new Date()));

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, idx) => {
      const d = new Date(year, month, idx + 1);
      return {
        dateStr: toISODate(d),
        dayNum: idx + 1,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      };
    });
  }, [currentMonth]);

  const findContractForVehicleOnDate = (vehicleId, dateStr) => {
    return contracts.find(
      (c) =>
        c.vehicle_id === vehicleId &&
        c.status !== "CANCELLED" &&
        c.start_date <= dateStr &&
        c.expected_end_date >= dateStr
    );
  };

  const shiftMonth = (delta) => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">
            Lịch Đặt Xe Trực Quan ({viewMode === "MONTH" ? "Theo Tháng" : "Theo Ngày"})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode("MONTH")}
              className={`rounded-lg px-3 py-1.5 transition ${
                viewMode === "MONTH" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
              }`}
            >
              Xem Theo Tháng
            </button>
            <button
              onClick={() => setViewMode("DAY")}
              className={`rounded-lg px-3 py-1.5 transition ${
                viewMode === "DAY" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
              }`}
            >
              Xem Theo Ngày
            </button>
          </div>

          {viewMode === "MONTH" ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => shiftMonth(-1)}
                className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[130px] text-center text-sm font-semibold text-slate-800">
                Tháng {currentMonth.getMonth() + 1}/{currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => shiftMonth(1)}
                className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <input
              type="date"
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300" /> Rảnh (Bấm để đặt xe)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-blue-500" /> Đang thuê (Bấm để xem/trả xe)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-600" /> Hợp đồng đã hoàn tất
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-400" /> Xe đang bảo trì
        </span>
      </div>

      {viewMode === "MONTH" ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="sticky left-0 z-10 min-w-[220px] border-r border-slate-200 bg-slate-50 px-4 py-2.5 font-semibold text-slate-700">
                  Xe / Hình thức
                </th>
                {daysInMonth.map((d) => (
                  <th
                    key={d.dateStr}
                    className={`min-w-[34px] border-r border-slate-100 px-1 py-2 text-center font-medium ${
                      d.isWeekend ? "bg-rose-50/60 text-rose-600" : "text-slate-600"
                    }`}
                  >
                    {d.dayNum}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.map((v) => {
                const meta = STATUS_META[v.status];
                return (
                  <tr key={v.id} className="hover:bg-slate-50/60">
                    <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-2.5">
                      <div className="font-semibold text-slate-900">
                        {v.brand} {v.model}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="font-mono font-medium text-slate-700">{v.license_plate}</span>
                        <span>•</span>
                        <span>{RENTAL_TYPE_LABEL[v.rental_type]}</span>
                        <span className={`ml-auto rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </div>
                    </td>
                    {daysInMonth.map((d) => {
                      const c = findContractForVehicleOnDate(v.id, d.dateStr);
                      if (c) {
                        const isDone = c.status === "COMPLETED";
                        return (
                          <td
                            key={d.dateStr}
                            onClick={() => onSelectContract(c)}
                            title={`${c.contract_code} — ${c.customer?.full_name || ""}`}
                            className={`cursor-pointer border-r border-slate-100 p-0.5 text-center`}
                          >
                            <div
                              className={`h-7 rounded ${
                                isDone
                                  ? "bg-emerald-600/85 hover:bg-emerald-700"
                                  : "bg-blue-500 hover:bg-blue-600"
                              }`}
                            />
                          </td>
                        );
                      }
                      if (v.status === "MAINTENANCE") {
                        return (
                          <td
                            key={d.dateStr}
                            title="Xe đang bảo trì"
                            className="border-r border-slate-100 bg-amber-50/70 p-0.5"
                          >
                            <div className="h-7 rounded bg-amber-300/60" />
                          </td>
                        );
                      }
                      return (
                        <td
                          key={d.dateStr}
                          onClick={() => v.status === "AVAILABLE" && onQuickBook(v, d.dateStr)}
                          title={
                            v.status === "AVAILABLE"
                              ? `Đặt xe ${v.license_plate} ngày ${d.dateStr}`
                              : "Xe đang bận"
                          }
                          className={`border-r border-slate-100 p-0.5 ${
                            v.status === "AVAILABLE"
                              ? "cursor-pointer hover:bg-emerald-100"
                              : "bg-slate-50"
                          }`}
                        >
                          <div className="h-7 rounded border border-transparent hover:border-emerald-300" />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => {
            const c = findContractForVehicleOnDate(v.id, selectedDay);
            const meta = STATUS_META[v.status];
            return (
              <div
                key={v.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {v.brand} {v.model}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {v.license_plate} • {RENTAL_TYPE_LABEL[v.rental_type]}
                      </p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}>
                      {meta.label}
                    </span>
                  </div>

                  {c ? (
                    <div className="mt-3 rounded-lg bg-blue-50 p-2.5 text-xs text-blue-900">
                      <div className="font-semibold">HĐ: {c.contract_code}</div>
                      <div>Khách: {c.customer?.full_name}</div>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-slate-600">
                      Giá ngày: <strong>{formatVND(v.daily_rate)}</strong> • Giá tháng:{" "}
                      <strong>{formatVND(v.monthly_rate)}</strong>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {c && c.status === "ACTIVE" ? (
                    <button
                      onClick={() => onSelectContract(c)}
                      className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Nhận xe & Chốt thanh toán
                    </button>
                  ) : v.status === "AVAILABLE" ? (
                    <button
                      onClick={() => onQuickBook(v, selectedDay)}
                      className="flex w-full items-center justify-center gap-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <Plus className="h-3.5 w-3.5" /> Đặt xe ngày {selectedDay}
                    </button>
                  ) : (
                    <div className="rounded-xl bg-slate-100 py-2 text-center text-xs font-medium text-slate-500">
                      Không khả dụng
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
