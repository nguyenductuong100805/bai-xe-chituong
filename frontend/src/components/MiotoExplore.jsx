import { useMemo, useState } from "react";
import {
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { RENTAL_TYPE_LABEL, STATUS_META, formatVND } from "../utils/format";

export default function MiotoExplore({ vehicles, onViewDetail, onBook }) {
  const [filters, setFilters] = useState({
    rental_type: "",
    city: "",
    seats: "",
    transmission: "",
    fuel_type: "",
    no_collateral: false,
    delivery_available: false,
    keyword: "",
    sort_by: "rating_desc",
  });

  const filtered = useMemo(() => {
    const list = vehicles.filter((v) => {
      if (filters.rental_type && v.rental_type !== filters.rental_type) return false;
      if (filters.city && v.location_city !== filters.city) return false;
      if (filters.seats && v.seats !== Number(filters.seats)) return false;
      if (filters.transmission && v.transmission !== filters.transmission) return false;
      if (filters.fuel_type && v.fuel_type !== filters.fuel_type) return false;
      if (filters.no_collateral && !v.no_collateral) return false;
      if (filters.delivery_available && !v.delivery_available) return false;
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const hay = `${v.brand} ${v.model} ${v.license_plate} ${v.location_district}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (filters.sort_by === "price_asc") return a.daily_rate - b.daily_rate;
      if (filters.sort_by === "price_desc") return b.daily_rate - a.daily_rate;
      if (filters.sort_by === "trips_desc") return b.trips_count - a.trips_count;
      return b.rating - a.rating;
    });
  }, [vehicles, filters]);

  return (
    <div className="space-y-5">
      {/* Mioto Hero Search Bar */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white shadow-md">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight">
            Mioto Clone — Thuê Xe Tự Lái & Có Tài Xế
          </h2>
          <p className="mt-1 text-sm text-emerald-50">
            Tìm kiếm xe theo khu vực, miễn thế chấp, giao xe tận nơi, bảo hiểm chuyến đi & kiểm soát trạng thái State Machine thời gian thực.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl bg-white p-3 text-slate-800 shadow-lg md:grid-cols-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <select
              className="w-full bg-transparent text-sm font-medium focus:outline-none"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            >
              <option value="">Tất cả khu vực</option>
              <option value="TP.HCM">TP. Hồ Chí Minh</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <Users className="h-4 w-4 text-emerald-600" />
            <select
              className="w-full bg-transparent text-sm font-medium focus:outline-none"
              value={filters.rental_type}
              onChange={(e) => setFilters({ ...filters, rental_type: e.target.value })}
            >
              <option value="">Tự lái & Có tài xế</option>
              <option value="SELF_DRIVE">Xe tự lái</option>
              <option value="WITH_DRIVER">Xe có tài xế</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              placeholder="Tìm hãng xe, dòng xe, quận..."
              className="w-full text-sm focus:outline-none"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <select
              className="w-full bg-transparent text-sm font-medium focus:outline-none"
              value={filters.sort_by}
              onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
            >
              <option value="rating_desc">Đánh giá cao nhất</option>
              <option value="trips_desc">Nhiều chuyến nhất</option>
              <option value="price_asc">Giá thấp → cao</option>
              <option value="price_desc">Giá cao → thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Chips chuẩn Mioto */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <select
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium"
          value={filters.seats}
          onChange={(e) => setFilters({ ...filters, seats: e.target.value })}
        >
          <option value="">Tất cả số chỗ</option>
          <option value="5">5 chỗ</option>
          <option value="7">7 chỗ</option>
          <option value="16">16 chỗ</option>
        </select>

        <select
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium"
          value={filters.transmission}
          onChange={(e) => setFilters({ ...filters, transmission: e.target.value })}
        >
          <option value="">Truyền động</option>
          <option value="Số tự động">Số tự động</option>
          <option value="Số sàn">Số sàn</option>
        </select>

        <select
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium"
          value={filters.fuel_type}
          onChange={(e) => setFilters({ ...filters, fuel_type: e.target.value })}
        >
          <option value="">Nhiên liệu</option>
          <option value="Xăng">Xăng</option>
          <option value="Dầu">Dầu</option>
          <option value="Điện">Điện</option>
        </select>

        <button
          onClick={() => setFilters({ ...filters, no_collateral: !filters.no_collateral })}
          className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            filters.no_collateral
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Miễn thế chấp
        </button>

        <button
          onClick={() => setFilters({ ...filters, delivery_available: !filters.delivery_available })}
          className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            filters.delivery_available
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Truck className="h-3.5 w-3.5" /> Giao xe tận nơi
        </button>

        <span className="ml-auto text-xs font-medium text-slate-500">
          Tìm thấy <strong>{filtered.length}</strong> xe
        </span>
      </div>

      {/* Grid Cards chuẩn Mioto */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => {
          const meta = STATUS_META[v.status];
          return (
            <div
              key={v.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                onClick={() => onViewDetail(v.id)}
                className="relative h-48 cursor-pointer overflow-hidden bg-slate-100"
              >
                <img
                  src={
                    v.image_url ||
                    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80"
                  }
                  alt={v.model}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <span
                  className={`absolute right-3 top-3 rounded-full border px-2.5 py-0.5 text-[11px] font-bold shadow-sm ${meta.badge}`}
                >
                  {meta.label}
                </span>
                <div className="absolute bottom-2.5 left-2.5 flex flex-wrap gap-1.5">
                  {v.no_collateral && (
                    <span className="rounded-lg bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Miễn thế chấp
                    </span>
                  )}
                  {v.delivery_available && (
                    <span className="rounded-lg bg-slate-900/75 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Giao tận nơi
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-600">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5">{v.transmission}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5">{v.fuel_type}</span>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700">
                      {RENTAL_TYPE_LABEL[v.rental_type]}
                    </span>
                  </div>

                  <h3
                    onClick={() => onViewDetail(v.id)}
                    className="mt-2 cursor-pointer text-base font-bold text-slate-900 hover:text-emerald-700"
                  >
                    {v.brand} {v.model} {v.year}
                  </h3>

                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {v.location_district}, {v.location_city}
                  </p>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="flex items-center gap-0.5 font-bold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400" /> {v.rating}
                      </span>
                      <span>• {v.trips_count} chuyến</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-emerald-600">
                        {formatVND(v.daily_rate)}
                      </span>
                      <span className="text-[11px] text-slate-500">/ngày</span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => onViewDetail(v.id)}
                      className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Chi tiết
                    </button>
                    <button
                      disabled={v.status !== "AVAILABLE"}
                      onClick={() => onBook(v)}
                      className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      {v.status === "AVAILABLE" ? "Đặt xe ngay" : meta.label}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
