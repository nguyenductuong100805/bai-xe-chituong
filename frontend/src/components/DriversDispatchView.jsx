import { CheckCircle2, Clock, Navigation, ShieldCheck, Star, Users } from "lucide-react";
import { formatDate, formatVND } from "../utils/format";

export default function DriversDispatchView({ vehicles, contracts, onCheckoutContract }) {
  const driverVehicles = vehicles.filter((v) => v.rental_type === "WITH_DRIVER");
  const activeDriverContracts = contracts.filter(
    (c) => c.rental_type === "WITH_DRIVER" && c.status === "ACTIVE"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Phân hệ điều vận chuyên trách & Đội ngũ nhân sự
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#131b2e]">
            Điều phối & Quản lý Tài xế
          </h2>
          <p className="text-sm text-[#444651]">
            Theo dõi lịch trình xe có tài xế theo thời gian thực, trạng thái ca làm việc và hiệu suất phục vụ.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Tổng xe có tài xế</span>
            <Users className="h-4 w-4 text-[#00236f]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#131b2e]">
            {driverVehicles.length}
          </div>
          <p className="mt-1 text-xs text-emerald-600">100% đã xác thực bằng lái & hồ sơ</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Đang trong chuyến</span>
            <Navigation className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[#131b2e]">
            {activeDriverContracts.length}
          </div>
          <p className="mt-1 text-xs text-slate-500">Đang phục vụ khách hàng</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Sẵn sàng nhận cuốc</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">
            {driverVehicles.filter((v) => v.status === "AVAILABLE").length}
          </div>
          <p className="mt-1 text-xs text-slate-500">Đang trực tại bãi & trạm trung chuyển</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#00236f] to-[#1e3a8a] p-4 text-white shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-[#90a8ff]">
            <span>Hài lòng dịch vụ</span>
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold">4.92 / 5.0</div>
          <p className="mt-1 text-xs text-[#dce1ff]">98% phản hồi khách hài lòng 5 sao</p>
        </div>
      </div>

      {/* Bảng Điều phối & Quy chuẩn an toàn */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2">
          <h3 className="flex items-center gap-2 text-base font-bold text-[#131b2e]">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Bảng Điều phối Chuyến xe Trực tiếp
          </h3>
          <p className="text-xs text-slate-500">
            Các hợp đồng thuê xe kèm tài xế đang hoạt động trên hệ thống
          </p>

          <div className="mt-4 space-y-3">
            {activeDriverContracts.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500">
                Hiện không có chuyến xe có tài xế nào đang chạy.
              </div>
            ) : (
              activeDriverContracts.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-200/80 bg-[#f2f3ff]/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      <Clock className="h-3 w-3" /> Đang thực hiện &bull; {c.contract_code}
                    </span>
                    <button
                      onClick={() => onCheckoutContract(c)}
                      className="rounded-lg bg-[#00236f] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1e3a8a]"
                    >
                      Kết thúc chuyến & Thanh toán
                    </button>
                  </div>
                  <div className="mt-2 text-sm font-bold text-[#131b2e]">
                    {c.delivery_address || "Phục vụ theo lịch trình hợp đồng"}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
                    <span>
                      Xe: <strong>{c.vehicle?.brand} {c.vehicle?.model} ({c.vehicle?.license_plate})</strong>
                    </span>
                    <span>• Tài xế: <strong>{c.vehicle?.driver_name || "Điều phối"}</strong></span>
                    <span>• Khách: <strong>{c.customer?.full_name}</strong></span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    Thời gian: {formatDate(c.start_date)} → {formatDate(c.expected_end_date)} &bull; Phụ phí tài xế:{" "}
                    {formatVND(c.driver_fee)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <h3 className="flex items-center gap-2 text-base font-bold text-[#131b2e]">
            <ShieldCheck className="h-5 w-5 text-[#00236f]" /> Quy chuẩn An toàn & Nhật ký
          </h3>
          <div className="mt-4 space-y-3 text-xs">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
              <div className="font-bold text-emerald-800">Kiểm tra trước xuất bến</div>
              <p className="mt-1 text-slate-600">
                100% tài xế kiểm tra giấy phép lái xe, nồng độ cồn và tình trạng kỹ thuật xe trước khi nhận chìa khóa.
              </p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5">
              <div className="font-bold text-[#00236f]">Giới hạn giờ lái liên tục</div>
              <p className="mt-1 text-slate-600">
                Tuân thủ quy định tối đa 4 giờ lái liên tục, tự động cảnh báo nghỉ ngơi hoặc đổi tài xế chặng dài.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Danh bạ tài xế */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-[#131b2e]">
            Danh bạ & Hồ sơ Năng lực Tài xế
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Tài xế</th>
                <th className="px-4 py-3">Số điện thoại</th>
                <th className="px-4 py-3">Xe phụ trách</th>
                <th className="px-4 py-3">Phí tài xế / ngày</th>
                <th className="px-4 py-3">Đánh giá</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driverVehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {v.driver_name || "Tài xế dự phòng"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {v.driver_phone || "0909xxxxxx"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">
                      {v.brand} {v.model}
                    </div>
                    <div className="font-mono text-xs text-slate-500">{v.license_plate}</div>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#00236f]">
                    {formatVND(v.driver_daily_fee)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-amber-500">
                    ★ {v.rating} ({v.trips_count} chuyến)
                  </td>
                  <td className="px-4 py-3">
                    {v.status === "RENTED" ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Đang trên chuyến
                      </span>
                    ) : v.status === "AVAILABLE" ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Sẵn sàng nhận cuốc
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        Xe đang bảo trì
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
