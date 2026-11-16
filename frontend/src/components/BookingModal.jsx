import { useEffect, useMemo, useState } from "react";
import { Car, FileText, ShieldCheck, Tag, Truck, User, X } from "lucide-react";
import { api } from "../api/client";
import { formatVND } from "../utils/format";

export default function BookingModal({
  vehicle,
  initialDate,
  defaultCustomer,
  onClose,
  onSuccess,
}) {
  const todayStr = initialDate || new Date().toISOString().slice(0, 10);
  const [promos, setPromos] = useState([]);
  const [form, setForm] = useState({
    customer_name: defaultCustomer?.full_name || "",
    customer_phone: defaultCustomer?.phone || "",
    customer_id_card: defaultCustomer?.id_card || "",
    customer_driver_license: defaultCustomer?.driver_license || "",
    rental_type: vehicle.rental_type,
    pricing_mode: "DAILY",
    start_date: todayStr,
    expected_end_date: todayStr,
    include_insurance: true,
    delivery_address: "",
    delivery_distance_km: 0,
    promo_code: "",
    collateral_type: vehicle.no_collateral ? "NONE" : "MONEY",
    deposit_amount: vehicle.no_collateral ? 0 : 3000000,
    handover_odometer: vehicle.current_odometer,
    handover_fuel_percent: 100,
    handover_notes: "Xe sạch sẽ, đầy đủ giấy tờ",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPromos().then(setPromos).catch(() => {});
  }, []);

  const estimate = useMemo(() => {
    const s = new Date(form.start_date);
    const e = new Date(form.expected_end_date);
    const days = Math.max(1, Math.floor((e - s) / 86400000) + 1);
    const base =
      form.pricing_mode === "MONTHLY"
        ? vehicle.monthly_rate * Math.max(1, Math.ceil(days / 30))
        : vehicle.daily_rate * days;
    const driver =
      form.rental_type === "WITH_DRIVER"
        ? (vehicle.driver_daily_fee || 500000) * days
        : 0;
    const insurance = form.include_insurance ? (vehicle.insurance_daily_fee || 95000) * days : 0;

    const dist = Number(form.delivery_distance_km) || 0;
    const delivery =
      vehicle.delivery_available && dist > (vehicle.delivery_free_km || 5)
        ? (dist - (vehicle.delivery_free_km || 5)) * (vehicle.delivery_fee_per_km || 15000)
        : 0;

    const subtotal = base + driver + insurance + delivery;
    const matchedPromo = promos.find(
      (p) => p.code.toUpperCase() === form.promo_code.trim().toUpperCase()
    );
    let discount = 0;
    if (matchedPromo) {
      discount = subtotal * (matchedPromo.discount_percent / 100);
      if (matchedPromo.max_discount_amount > 0) {
        discount = Math.min(discount, matchedPromo.max_discount_amount);
      }
    }

    return {
      days,
      base,
      driver,
      insurance,
      delivery,
      discount,
      total: Math.max(0, subtotal - discount),
    };
  }, [form, vehicle, promos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createContract({
        vehicle_id: vehicle.id,
        ...form,
        delivery_distance_km: Number(form.delivery_distance_km),
        deposit_amount: Number(form.deposit_amount),
        handover_odometer: Number(form.handover_odometer),
        handover_fuel_percent: Number(form.handover_fuel_percent),
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
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Lập Hợp Đồng & Giao Xe (Chuẩn Mioto)
              </h3>
              <p className="text-xs text-slate-500">
                {vehicle.brand} {vehicle.model} — {vehicle.license_plate} ({vehicle.location_district})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Thông tin khách hàng */}
          <div>
            <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <User className="h-4 w-4 text-slate-500" /> Thông tin khách hàng
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Họ và tên khách hàng *"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              />
              <input
                required
                placeholder="Số điện thoại *"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              />
              <input
                required
                placeholder="Số CCCD gắn chip *"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                value={form.customer_id_card}
                onChange={(e) => setForm({ ...form, customer_id_card: e.target.value })}
              />
              <input
                placeholder="Số GPLX B1/B2 (nếu tự lái)"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                value={form.customer_driver_license}
                onChange={(e) => setForm({ ...form, customer_driver_license: e.target.value })}
              />
            </div>
          </div>

          {/* Chi tiết thuê & giao nhận */}
          <div>
            <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <Car className="h-4 w-4 text-slate-500" /> Hình thức thuê & Thời gian
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Hình thức</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.rental_type}
                  onChange={(e) => setForm({ ...form, rental_type: e.target.value })}
                >
                  <option value="SELF_DRIVE">Tự lái</option>
                  <option value="WITH_DRIVER">Có tài xế</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Gói tính giá</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.pricing_mode}
                  onChange={(e) => setForm({ ...form, pricing_mode: e.target.value })}
                >
                  <option value="DAILY">Theo ngày ({formatVND(vehicle.daily_rate)}/ngày)</option>
                  <option value="MONTHLY">Theo tháng ({formatVND(vehicle.monthly_rate)}/tháng)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Ngày nhận xe</label>
                <input
                  type="date"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Ngày trả dự kiến</label>
                <input
                  type="date"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.expected_end_date}
                  onChange={(e) => setForm({ ...form, expected_end_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Giao xe tận nơi & Bảo hiểm & Thế chấp (Mioto) */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                className="h-4 w-4 accent-emerald-600"
                checked={form.include_insurance}
                onChange={(e) => setForm({ ...form, include_insurance: e.target.checked })}
              />
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Bảo hiểm chuyến đi ({formatVND(vehicle.insurance_daily_fee || 95000)}/ngày)
            </label>

            {vehicle.delivery_available && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Truck className="h-3.5 w-3.5" /> Địa chỉ giao xe tận nơi (để trống nếu nhận tại bãi)
                  </label>
                  <input
                    placeholder="VD: Sân bay Tân Sơn Nhất, Quận Tân Bình"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.delivery_address}
                    onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Khoảng cách (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.delivery_distance_km}
                    onChange={(e) => setForm({ ...form, delivery_distance_km: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Thế chấp</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={form.collateral_type}
                  onChange={(e) => setForm({ ...form, collateral_type: e.target.value })}
                >
                  {vehicle.no_collateral && <option value="NONE">Miễn thế chấp</option>}
                  <option value="MONEY">Tiền mặt (15 triệu / cọc)</option>
                  <option value="MOTORBIKE">Xe máy + Cà vẹt gốc</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Tiền cọc giữ chỗ</label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={form.deposit_amount}
                  onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                  <Tag className="h-3.5 w-3.5" /> Mã giảm giá
                </label>
                <input
                  placeholder="MIOTO10 / VIP20"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm uppercase"
                  value={form.promo_code}
                  onChange={(e) => setForm({ ...form, promo_code: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Biên bản giao xe */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Odo lúc giao (km)</label>
              <input
                type="number"
                min="0"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.handover_odometer}
                onChange={(e) => setForm({ ...form, handover_odometer: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Nhiên liệu (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.handover_fuel_percent}
                onChange={(e) => setForm({ ...form, handover_fuel_percent: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Ghi chú giao xe</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.handover_notes}
                onChange={(e) => setForm({ ...form, handover_notes: e.target.value })}
              />
            </div>
          </div>

          {/* Tạm tính */}
          <div className="space-y-1 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Đơn giá thuê ({estimate.days} ngày):</span>
              <span className="font-medium">{formatVND(estimate.base)}</span>
            </div>
            {estimate.driver > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Phụ phí tài xế:</span>
                <span className="font-medium">{formatVND(estimate.driver)}</span>
              </div>
            )}
            {estimate.insurance > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Bảo hiểm chuyến đi:</span>
                <span className="font-medium">{formatVND(estimate.insurance)}</span>
              </div>
            )}
            {estimate.delivery > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Phí giao xe tận nơi:</span>
                <span className="font-medium">{formatVND(estimate.delivery)}</span>
              </div>
            )}
            {estimate.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Giảm giá ({form.promo_code.toUpperCase()}):</span>
                <span className="font-semibold">- {formatVND(estimate.discount)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-emerald-700">
              <span>Tổng cộng:</span>
              <span>{formatVND(estimate.total)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? "Đang xử lý..." : "Xác nhận đặt xe & Lập hợp đồng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
