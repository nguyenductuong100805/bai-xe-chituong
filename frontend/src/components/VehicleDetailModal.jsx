import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Fuel,
  Gauge,
  MapPin,
  MessageSquarePlus,
  Settings2,
  ShieldCheck,
  Star,
  Truck,
  Users,
  X,
} from "lucide-react";
import { api } from "../api/client";
import { RENTAL_TYPE_LABEL, STATUS_META, formatVND } from "../utils/format";

export default function VehicleDetailModal({ vehicleId, onClose, onBook }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({
    author_name: "",
    rating: 5,
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await api.getVehicleDetail(vehicleId);
      setDetail(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [vehicleId]);

  const handleAddReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.addVehicleReview(vehicleId, reviewForm);
      setReviewForm({ author_name: "", rating: 5, comment: "" });
      await loadDetail();
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
        <div className="rounded-2xl bg-white px-8 py-6 text-sm font-medium text-slate-600">
          Đang tải thông tin xe...
        </div>
      </div>
    );
  }

  const meta = STATUS_META[detail.status];
  const featureList = (detail.features || "").split(",").map((f) => f.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-extrabold text-slate-900">
                {detail.brand} {detail.model} {detail.year}
              </h3>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}>
                {meta.label}
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-400" /> {detail.rating}
              </span>
              <span>• {detail.trips_count} chuyến</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {detail.location_district}, {detail.location_city}
              </span>
              <span className="font-mono font-semibold text-slate-700">{detail.license_plate}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          {/* Cột trái: Ảnh + Thông số + Tiện nghi + Đánh giá */}
          <div className="space-y-6 lg:col-span-2">
            <div className="overflow-hidden rounded-2xl bg-slate-100">
              <img
                src={
                  detail.image_url ||
                  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80"
                }
                alt={detail.model}
                className="h-64 w-full object-cover"
              />
            </div>

            {detail.gallery_images?.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-bold text-slate-900">
                  Bộ ảnh thực tế xe ({detail.gallery_images.length} ảnh)
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {detail.gallery_images.map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt={`Ảnh ${idx + 1}`}
                      className="h-16 w-full rounded-lg border object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {detail.walkaround_video_url && (
              <div>
                <h4 className="mb-2 text-sm font-bold text-slate-900">
                  Video quay xung quanh xe
                </h4>
                <video
                  controls
                  src={detail.walkaround_video_url}
                  className="max-h-64 w-full rounded-xl border bg-black"
                />
              </div>
            )}

            {/* Đặc điểm kỹ thuật chuẩn Mioto */}
            <div>
              <h4 className="mb-3 text-sm font-bold text-slate-900">Đặc điểm xe</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <Settings2 className="h-4 w-4 text-emerald-600" />
                  <p className="mt-1 text-[11px] text-slate-500">Truyền động</p>
                  <p className="text-xs font-bold text-slate-800">{detail.transmission}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <p className="mt-1 text-[11px] text-slate-500">Số ghế</p>
                  <p className="text-xs font-bold text-slate-800">{detail.seats} chỗ</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <Fuel className="h-4 w-4 text-emerald-600" />
                  <p className="mt-1 text-[11px] text-slate-500">Nhiên liệu</p>
                  <p className="text-xs font-bold text-slate-800">{detail.fuel_type}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <Gauge className="h-4 w-4 text-emerald-600" />
                  <p className="mt-1 text-[11px] text-slate-500">Tiêu hao</p>
                  <p className="text-xs font-bold text-slate-800">{detail.fuel_consumption}</p>
                </div>
              </div>
            </div>

            {/* Tiện nghi */}
            <div>
              <h4 className="mb-2.5 text-sm font-bold text-slate-900">Các tiện nghi trên xe</h4>
              <div className="flex flex-wrap gap-2">
                {featureList.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Phụ phí có thể phát sinh (chuẩn Mioto) */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <h4 className="mb-2 text-sm font-bold text-slate-900">Phụ phí có thể phát sinh</h4>
              <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <div>
                  • Phí vượt giới hạn ({detail.daily_km_limit} km/ngày):{" "}
                  <strong className="text-slate-900">{formatVND(detail.extra_km_fee)}/km</strong>
                </div>
                <div>
                  • Phí quá giờ:{" "}
                  <strong className="text-slate-900">{formatVND(detail.late_hour_fee)}/giờ</strong>
                </div>
                <div>
                  • Phí nhiên liệu thiếu:{" "}
                  <strong className="text-slate-900">150.000 ₫ / 10% bình</strong>
                </div>
                <div>
                  • Giao xe tận nơi:{" "}
                  <strong className="text-slate-900">
                    Miễn phí {detail.delivery_free_km}km đầu, sau đó {formatVND(detail.delivery_fee_per_km)}/km
                  </strong>
                </div>
              </div>
            </div>

            {/* Đánh giá khách hàng */}
            <div>
              <h4 className="mb-3 text-sm font-bold text-slate-900">
                Đánh giá từ khách thuê ({detail.reviews?.length || 0})
              </h4>
              <div className="space-y-3">
                {detail.reviews?.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{r.author_name}</span>
                      <span className="flex items-center gap-0.5 font-semibold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400" /> {r.rating}.0
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600">{r.comment}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddReview} className="mt-4 space-y-2 rounded-xl border border-slate-200 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <MessageSquarePlus className="h-4 w-4 text-emerald-600" /> Thêm đánh giá chuyến đi
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    required
                    placeholder="Tên của bạn"
                    className="col-span-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
                    value={reviewForm.author_name}
                    onChange={(e) => setReviewForm({ ...reviewForm, author_name: e.target.value })}
                  />
                  <select
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                  >
                    <option value={5}>5 ★ Tuyệt vời</option>
                    <option value={4}>4 ★ Rất tốt</option>
                    <option value={3}>3 ★ Bình thường</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    required
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                  >
                    Gửi
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Cột phải: Bảng giá & Chính sách Mioto */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {RENTAL_TYPE_LABEL[detail.rental_type]}
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  {formatVND(detail.daily_rate)}
                </span>
                <span className="text-xs text-slate-500">/ ngày</span>
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Gói tháng: <strong className="text-slate-900">{formatVND(detail.monthly_rate)}</strong>
              </div>

              <div className="mt-4 space-y-2 border-t border-emerald-200/70 pt-3 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Bảo hiểm chuyến đi: {formatVND(detail.insurance_daily_fee)}/ngày</span>
                </div>
                {detail.no_collateral && (
                  <div className="flex items-center gap-2 font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Hỗ trợ Miễn thế chấp (CCCD gắn chip)
                  </div>
                )}
                {detail.delivery_available && (
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-600" />
                    <span>Giao xe tận nơi (Miễn phí {detail.delivery_free_km}km đầu)</span>
                  </div>
                )}
              </div>

              <button
                disabled={detail.status !== "AVAILABLE"}
                onClick={() => onBook(detail)}
                className="mt-5 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {detail.status === "AVAILABLE" ? "CHỌN THUÊ XE NÀY" : `Xe đang ${meta.label}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
