import { CheckCircle2, Clock } from "lucide-react";
import { RENTAL_TYPE_LABEL, formatDate, formatVND } from "../utils/format";

export default function ContractList({ contracts, onReturnCheckout }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3">Mã HĐ</th>
              <th className="px-4 py-3">Xe & Hình thức</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3 text-right">Cơ bản / Cọc</th>
              <th className="px-4 py-3 text-right">Phí phát sinh</th>
              <th className="px-4 py-3 text-right">Tổng tiền</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contracts.map((c) => {
              const isActive = c.status === "ACTIVE";
              return (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">
                    {c.contract_code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">
                      {c.vehicle?.brand} {c.vehicle?.model}
                    </div>
                    <div className="text-xs text-slate-500">
                      {c.vehicle?.license_plate} • {RENTAL_TYPE_LABEL[c.rental_type]}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{c.customer?.full_name}</div>
                    <div className="text-xs text-slate-500">{c.customer?.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div>{formatDate(c.start_date)} → {formatDate(c.expected_end_date)}</div>
                    {c.actual_return_date && (
                      <div className="text-emerald-700">Trả: {formatDate(c.actual_return_date)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <div className="font-medium text-slate-800">
                      {formatVND(c.base_rental_fee + c.driver_fee)}
                    </div>
                    <div className="text-slate-500">Cọc: {formatVND(c.deposit_amount)}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-medium text-rose-600">
                    {c.total_extra_fee > 0 ? `+ ${formatVND(c.total_extra_fee)}` : "0 ₫"}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatVND(c.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                        <Clock className="h-3 w-3" /> Đang thuê
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Hoàn tất
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isActive ? (
                      <button
                        onClick={() => onReturnCheckout(c)}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Nhận xe & Thanh toán
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Đã quyết toán</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
