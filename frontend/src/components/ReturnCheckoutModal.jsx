import { useEffect, useState } from "react";
import { Calculator, CheckCircle2, X } from "lucide-react";
import { api } from "../api/client";
import { formatDate, formatVND } from "../utils/format";

export default function ReturnCheckoutModal({ contract, onClose, onSuccess }) {
  const [form, setForm] = useState({
    actual_return_date: contract.expected_end_date,
    return_odometer: contract.handover_odometer + 200,
    return_fuel_percent: contract.handover_fuel_percent,
    late_hours: 0,
    damage_fee: 0,
    cleaning_fee: 0,
    need_maintenance: false,
    maintenance_description: "",
    return_notes: "Đã kiểm tra xe khi nhận lại",
  });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const loadPreview = async () => {
      try {
        const res = await api.previewReturn(contract.id, {
          ...form,
          return_odometer: Number(form.return_odometer),
          return_fuel_percent: Number(form.return_fuel_percent),
          late_hours: Number(form.late_hours),
          damage_fee: Number(form.damage_fee),
          cleaning_fee: Number(form.cleaning_fee),
        });
        if (active) {
          setPreview(res);
          setError("");
        }
      } catch (err) {
        if (active) setError(err.message);
      }
    };
    loadPreview();
    return () => {
      active = false;
    };
  }, [contract.id, form]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.returnVehicle(contract.id, {
        ...form,
        return_odometer: Number(form.return_odometer),
        return_fuel_percent: Number(form.return_fuel_percent),
        late_hours: Number(form.late_hours),
        damage_fee: Number(form.damage_fee),
        cleaning_fee: Number(form.cleaning_fee),
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Nhận Xe & Chốt Thanh Toán Nhanh
              </h3>
              <p className="text-xs text-slate-500">
                Hợp đồng {contract.contract_code} • {contract.vehicle?.brand}{" "}
                {contract.vehicle?.model} ({contract.vehicle?.license_plate})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleCheckout} className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <div>
              Khách hàng: <strong className="text-slate-900">{contract.customer?.full_name}</strong>
            </div>
            <div>
              Thời gian dự kiến:{" "}
              <strong className="text-slate-900">
                {formatDate(contract.start_date)} → {formatDate(contract.expected_end_date)}
              </strong>
            </div>
            <div>
              Odo lúc giao: <strong className="text-slate-900">{contract.handover_odometer.toLocaleString()} km</strong>
            </div>
            <div>
              Xăng lúc giao: <strong className="text-slate-900">{contract.handover_fuel_percent}%</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Ngày trả thực tế</label>
              <input
                type="date"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.actual_return_date}
                onChange={(e) => setForm({ ...form, actual_return_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Số km khi trả (Odo)</label>
              <input
                type="number"
                min={contract.handover_odometer}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.return_odometer}
                onChange={(e) => setForm({ ...form, return_odometer: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Mức nhiên liệu khi trả (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.return_fuel_percent}
                onChange={(e) => setForm({ ...form, return_fuel_percent: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Số giờ trễ thêm</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.late_hours}
                onChange={(e) => setForm({ ...form, late_hours: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Phí hư hỏng / Vệ sinh (VNĐ)</label>
              <input
                type="number"
                min="0"
                step="50000"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.damage_fee}
                onChange={(e) => setForm({ ...form, damage_fee: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Ghi chú nhận xe</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.return_notes}
                onChange={(e) => setForm({ ...form, return_notes: e.target.value })}
              />
            </div>
          </div>

          {/* Chuyển trạng thái State Machine sau khi trả */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-amber-600"
                checked={form.need_maintenance}
                onChange={(e) => setForm({ ...form, need_maintenance: e.target.checked })}
              />
              Xe cần bảo trì / sửa chữa ngay sau khi trả (Chuyển State Machine: Đang thuê → Bảo trì)
            </label>
            {form.need_maintenance && (
              <input
                required
                placeholder="Mô tả hạng mục cần bảo trì..."
                className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm"
                value={form.maintenance_description}
                onChange={(e) => setForm({ ...form, maintenance_description: e.target.value })}
              />
            )}
          </div>

          {/* Bảng tính phí phát sinh tự động */}
          {preview && (
            <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Tiền thuê cơ bản + Tài xế:</span>
                <span>{formatVND(contract.base_rental_fee + contract.driver_fee)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>
                  Vượt định mức km ({preview.driven_km} / {preview.allowed_km} km → dư {preview.extra_km} km):
                </span>
                <span className={preview.extra_km_charge > 0 ? "font-semibold text-rose-600" : ""}>
                  {formatVND(preview.extra_km_charge)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí trễ ngày / quá giờ:</span>
                <span className={preview.late_fee_charge > 0 ? "font-semibold text-rose-600" : ""}>
                  {formatVND(preview.late_fee_charge)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí bù nhiên liệu:</span>
                <span className={preview.fuel_fee_charge > 0 ? "font-semibold text-rose-600" : ""}>
                  {formatVND(preview.fuel_fee_charge)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí hư hỏng / vệ sinh:</span>
                <span>{formatVND(preview.damage_fee_charge)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-800">
                <span>Tổng giá trị hợp đồng:</span>
                <span>{formatVND(preview.total_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Đã đặt cọc trước:</span>
                <span>- {formatVND(preview.deposit_amount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-bold text-emerald-700">
                <span>Số tiền cần thu (hoặc hoàn lại) khi trả xe:</span>
                <span>{formatVND(preview.amount_due_on_return)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={submitting || !!error}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? "Đang chốt..." : "Xác nhận trả xe & Thanh toán"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
