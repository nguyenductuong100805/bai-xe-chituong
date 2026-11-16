import { useState } from "react";
import {
  Camera,
  Car,
  CheckCircle2,
  LogOut,
  PlusCircle,
  Save,
  Trash2,
  Upload,
  User,
  Video,
} from "lucide-react";
import { api } from "../api/client";
import { RENTAL_TYPE_LABEL, STATUS_META, formatVND } from "../utils/format";

const PHOTO_SLOTS = [
  "1. Mặt trước xe",
  "2. Mặt sau xe",
  "3. Thân bên trái",
  "4. Thân bên phải",
  "5. Khoang nội thất",
];

const VN_PLATE_REGEX = /^[0-9]{2}[A-Z]{1,2}-[0-9]{3,5}(\.[0-9]{2})?$/;

export function filterAndValidatePlate(raw) {
  const cleaned = raw.toUpperCase().replace(/\s+/g, "");
  const isValid = VN_PLATE_REGEX.test(cleaned);
  return { cleaned, isValid };
}

export default function DriverPortalView({
  auth,
  vehicles,
  onRefresh,
  onProfileUpdated,
  onLogout,
}) {
  const [tab, setTab] = useState("REGISTER_VEHICLE"); // REGISTER_VEHICLE | MY_VEHICLES | PROFILE
  const driver = auth.driver || {};

  const [profileForm, setProfileForm] = useState({
    full_name: driver.full_name || auth.full_name || "",
    date_of_birth: driver.date_of_birth || "",
    phone: driver.phone || "",
    email: driver.email || "",
    id_card: driver.id_card || "",
    address: driver.address || "",
    license_class: driver.license_class || "B2",
    license_image_url: driver.license_image_url || "",
  });
  const [profileMsg, setProfileMsg] = useState("");

  const [vehicleForm, setVehicleForm] = useState({
    brand: "",
    model: "",
    year: 2024,
    seats: 5,
    color: "Trắng",
    rental_type: "WITH_DRIVER",
    fuel_type: "Xăng",
    transmission: "Số tự động",
    license_plate: "",
    location_city: "TP.HCM",
    location_district: "Quận 1",
    vehicle_address: "",
    owner_name: driver.full_name || auth.full_name || "",
    daily_rate: 1000000,
    monthly_rate: 22000000,
    driver_daily_fee: 500000,
  });
  const [plateError, setPlateError] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [vehicleMsg, setVehicleMsg] = useState("");
  const [submittingVehicle, setSubmittingVehicle] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [vehiclePhotos, setVehiclePhotos] = useState([null, null, null, null, null]);
  const [walkaroundVideoUrl, setWalkaroundVideoUrl] = useState("");

  const myVehicles = vehicles.filter(
    (v) => v.driver_id === driver.id || v.driver_phone === driver.phone
  );

  const handleLicenseUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((prev) => ({ ...prev, license_image_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    const updated = await api.updateProfile(auth.user_id, {
      ...profileForm,
      date_of_birth: profileForm.date_of_birth || null,
    });
    onProfileUpdated(updated);
    setProfileMsg("Đã cập nhật hồ sơ tài xế & ảnh bằng lái!");
  };

  const handlePlateChange = (val) => {
    const upper = val.toUpperCase().replace(/[^0-9A-Z.-]/g, "");
    setVehicleForm((prev) => ({ ...prev, license_plate: upper }));
    if (upper.length > 0 && !VN_PLATE_REGEX.test(upper)) {
      setPlateError("Biển số phải đúng chuẩn Việt Nam (VD: 51H-886.99 hoặc 30A-12345)");
    } else {
      setPlateError("");
    }
  };

  const handlePhotoSlotUpload = async (slotIndex, file) => {
    if (!file) return;
    setMediaError("");
    setUploadingMedia(true);
    try {
      const { url } = await api.uploadVehicleMedia(file);
      setVehiclePhotos((prev) => {
        const next = [...prev];
        next[slotIndex] = url;
        return next;
      });
    } catch (err) {
      setMediaError(err.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;
    setMediaError("");
    setUploadingMedia(true);
    try {
      const { url } = await api.uploadVehicleMedia(file);
      setWalkaroundVideoUrl(url);
    } catch (err) {
      setMediaError(err.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRegisterVehicle = async (e) => {
    e.preventDefault();
    setVehicleMsg("");
    setMediaError("");
    const { cleaned, isValid } = filterAndValidatePlate(vehicleForm.license_plate);
    if (!isValid) {
      setPlateError("Biển số xe không hợp lệ! Vui lòng nhập đúng định dạng (VD: 51H-886.99).");
      return;
    }

    const uploadedPhotos = vehiclePhotos.filter(Boolean);
    if (uploadedPhotos.length < 5) {
      setMediaError(`Vui lòng tải lên đủ 5 tấm ảnh của xe (hiện tại mới có ${uploadedPhotos.length}/5 ảnh).`);
      return;
    }
    if (!walkaroundVideoUrl) {
      setMediaError("Vui lòng tải lên 1 video quay xung quanh chiếc xe.");
      return;
    }

    setSubmittingVehicle(true);
    try {
      await api.createVehicle({
        ...vehicleForm,
        license_plate: cleaned,
        year: Number(vehicleForm.year),
        seats: Number(vehicleForm.seats),
        daily_rate: Number(vehicleForm.daily_rate),
        monthly_rate: Number(vehicleForm.monthly_rate),
        driver_daily_fee: Number(vehicleForm.driver_daily_fee),
        driver_id: driver.id || null,
        driver_name: profileForm.full_name,
        driver_phone: profileForm.phone,
        image_url: uploadedPhotos[0],
        gallery_images: uploadedPhotos,
        walkaround_video_url: walkaroundVideoUrl,
      });
      setVehicleMsg("Đăng ký xe thành công! Xe đã sẵn sàng trên hệ thống Nhà Xe Chí Tường.");
      setVehicleForm((prev) => ({ ...prev, brand: "", model: "", license_plate: "", vehicle_address: "" }));
      setVehiclePhotos([null, null, null, null, null]);
      setWalkaroundVideoUrl("");
      onRefresh();
    } catch (err) {
      setPlateError(err.message);
    } finally {
      setSubmittingVehicle(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#faf8ff] text-[#131b2e]">
      <aside className="hidden w-64 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00236f] text-white">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#00236f]">Nhà Xe Chí Tường</div>
              <div className="text-[11px] text-slate-500">Cổng Tài Xế Đối Tác</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <button
            onClick={() => setTab("REGISTER_VEHICLE")}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold ${
              tab === "REGISTER_VEHICLE"
                ? "bg-[#00236f] text-white"
                : "text-[#444651] hover:bg-[#f2f3ff]"
            }`}
          >
            <PlusCircle className="h-4 w-4" /> Đăng ký xe mới
          </button>
          <button
            onClick={() => setTab("MY_VEHICLES")}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold ${
              tab === "MY_VEHICLES"
                ? "bg-[#00236f] text-white"
                : "text-[#444651] hover:bg-[#f2f3ff]"
            }`}
          >
            <Car className="h-4 w-4" /> Xe của tôi ({myVehicles.length})
          </button>
          <button
            onClick={() => setTab("PROFILE")}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold ${
              tab === "PROFILE"
                ? "bg-[#00236f] text-white"
                : "text-[#444651] hover:bg-[#f2f3ff]"
            }`}
          >
            <User className="h-4 w-4" /> Hồ sơ & Bằng lái
          </button>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <button
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-6 py-3.5">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setTab("REGISTER_VEHICLE")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                tab === "REGISTER_VEHICLE" ? "bg-[#00236f] text-white" : "bg-slate-100"
              }`}
            >
              Đăng ký xe
            </button>
            <button
              onClick={() => setTab("MY_VEHICLES")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                tab === "MY_VEHICLES" ? "bg-[#00236f] text-white" : "bg-slate-100"
              }`}
            >
              Xe của tôi
            </button>
            <button
              onClick={() => setTab("PROFILE")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                tab === "PROFILE" ? "bg-[#00236f] text-white" : "bg-slate-100"
              }`}
            >
              Hồ sơ
            </button>
          </div>

          <div className="text-sm font-bold text-[#131b2e]">
            Tài xế: {profileForm.full_name} (Hạng {profileForm.license_class})
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 lg:hidden"
          >
            <LogOut className="h-3.5 w-3.5" /> Đăng xuất
          </button>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
          {tab === "REGISTER_VEHICLE" && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-xl font-bold text-[#131b2e]">
                Đăng ký Xe Mới Vào Hệ Thống Nhà Xe Chí Tường
              </h2>
              <p className="text-xs text-slate-500">
                Biển số xe được kiểm tra định dạng tự động để tránh nhập sai quy chuẩn.
              </p>

              {vehicleMsg && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" /> {vehicleMsg}
                </div>
              )}

              <form onSubmit={handleRegisterVehicle} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Hãng xe *</label>
                  <input
                    required
                    placeholder="VD: Toyota, Mazda, Kia, VinFast..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={vehicleForm.brand}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Tên xe / Dòng xe *</label>
                  <input
                    required
                    placeholder="VD: Vios G, Carnival, VF8..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Biển số xe * (Chuẩn VN)
                  </label>
                  <input
                    required
                    placeholder="VD: 51H-886.99 hoặc 30A-12345"
                    className={`w-full rounded-xl border px-3 py-2 font-mono text-sm uppercase ${
                      plateError ? "border-red-400 bg-red-50/40" : "border-slate-200"
                    }`}
                    value={vehicleForm.license_plate}
                    onChange={(e) => handlePlateChange(e.target.value)}
                  />
                  {plateError && <p className="mt-1 text-[11px] font-medium text-red-600">{plateError}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Người đứng tên xe *</label>
                  <input
                    required
                    placeholder="Họ tên chủ sở hữu trên cà vẹt"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={vehicleForm.owner_name}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, owner_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Loại hình cho thuê</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={vehicleForm.rental_type}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, rental_type: e.target.value })}
                  >
                    <option value="WITH_DRIVER">Có tài xế</option>
                    <option value="SELF_DRIVE">Tự lái</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Số chỗ ngồi</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={vehicleForm.seats}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, seats: Number(e.target.value) })}
                  >
                    <option value={4}>4 chỗ</option>
                    <option value={5}>5 chỗ</option>
                    <option value={7}>7 chỗ</option>
                    <option value={16}>16 chỗ</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Nhiên liệu</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={vehicleForm.fuel_type}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, fuel_type: e.target.value })}
                  >
                    <option value="Xăng">Xăng</option>
                    <option value="Dầu">Dầu Diesel</option>
                    <option value="Điện">Điện (EV)</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Truyền động</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={vehicleForm.transmission}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, transmission: e.target.value })}
                  >
                    <option value="Số tự động">Số tự động</option>
                    <option value="Số sàn">Số sàn</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Thành phố</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={vehicleForm.location_city}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, location_city: e.target.value })}
                  >
                    <option value="TP.HCM">TP.HCM</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Quận / Huyện</label>
                  <input
                    required
                    placeholder="VD: Quận 7, Tân Bình, Cầu Giấy..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={vehicleForm.location_district}
                    onChange={(e) =>
                      setVehicleForm({ ...vehicleForm, location_district: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Địa chỉ bãi đậu / Giao nhận xe cụ thể *
                  </label>
                  <input
                    required
                    placeholder="Số nhà, tên đường, phường/xã..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={vehicleForm.vehicle_address}
                    onChange={(e) =>
                      setVehicleForm({ ...vehicleForm, vehicle_address: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Giá thuê / ngày (VNĐ)</label>
                  <input
                    type="number"
                    required
                    min="100000"
                    step="50000"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={vehicleForm.daily_rate}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, daily_rate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Giá thuê / tháng (VNĐ)</label>
                  <input
                    type="number"
                    required
                    min="1000000"
                    step="500000"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={vehicleForm.monthly_rate}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, monthly_rate: e.target.value })}
                  />
                </div>

                {/* Khu vực bắt buộc: 5 tấm ảnh xe & 1 video quay xung quanh xe */}
                <div className="sm:col-span-2 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-[#131b2e]">
                        <Camera className="h-4 w-4 text-[#00236f]" />
                        5 Tấm ảnh thực tế của xe * ({vehiclePhotos.filter(Boolean).length}/5)
                      </label>
                      {uploadingMedia && (
                        <span className="text-[11px] font-semibold text-blue-600">Đang tải file...</span>
                      )}
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {PHOTO_SLOTS.map((slotLabel, idx) => {
                        const url = vehiclePhotos[idx];
                        return (
                          <div
                            key={slotLabel}
                            className="flex flex-col items-center justify-between rounded-xl border border-dashed border-slate-300 bg-white p-2 text-center"
                          >
                            <span className="mb-1.5 text-[11px] font-semibold text-slate-600">
                              {slotLabel}
                            </span>
                            {url ? (
                              <div className="relative w-full">
                                <img
                                  src={url}
                                  alt={slotLabel}
                                  className="h-20 w-full rounded-lg object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVehiclePhotos((prev) => {
                                      const n = [...prev];
                                      n[idx] = null;
                                      return n;
                                    })
                                  }
                                  className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white shadow"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-slate-50 text-[11px] text-slate-500 hover:bg-slate-100">
                                <Upload className="mb-1 h-4 w-4 text-slate-400" />
                                Chọn ảnh
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handlePhotoSlotUpload(idx, e.target.files?.[0])}
                                />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#131b2e]">
                      <Video className="h-4 w-4 text-[#00236f]" />
                      1 Video quay xung quanh chiếc xe * (.mp4, .webm, .mov)
                    </label>
                    {walkaroundVideoUrl ? (
                      <div className="space-y-2">
                        <video
                          controls
                          src={walkaroundVideoUrl}
                          className="max-h-56 w-full rounded-xl border border-slate-200 bg-black"
                        />
                        <button
                          type="button"
                          onClick={() => setWalkaroundVideoUrl("")}
                          className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Xóa video để chọn lại
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-5 text-xs text-slate-500 hover:bg-slate-50">
                        <Video className="mb-1.5 h-6 w-6 text-slate-400" />
                        <span>Nhấn để chọn 1 video quay 360° xung quanh xe</span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => handleVideoUpload(e.target.files?.[0])}
                        />
                      </label>
                    )}
                  </div>

                  {mediaError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                      {mediaError}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingVehicle || !!plateError}
                    className="rounded-xl bg-[#00236f] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50"
                  >
                    {submittingVehicle ? "Đang lưu..." : "Đăng ký xe lên hệ thống"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === "MY_VEHICLES" && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-bold text-[#131b2e]">Danh sách xe bạn đã đăng ký</h2>
              {myVehicles.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Bạn chưa đăng ký xe nào.</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {myVehicles.map((v) => {
                    const meta = STATUS_META[v.status];
                    return (
                      <div key={v.id} className="rounded-xl border border-slate-200 p-4 text-xs">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {v.brand} {v.model} ({v.year})
                            </div>
                            <div className="font-mono font-semibold text-[#00236f]">
                              {v.license_plate} &bull; {RENTAL_TYPE_LABEL[v.rental_type]}
                            </div>
                          </div>
                          <span className={`rounded-full border px-2 py-0.5 font-semibold ${meta.badge}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-slate-600">
                          <div>Nhiên liệu: {v.fuel_type} &bull; {v.transmission}</div>
                          <div>Chủ xe: {v.owner_name || "—"}</div>
                          <div>Địa chỉ xe: {v.vehicle_address || `${v.location_district}, ${v.location_city}`}</div>
                          <div>Đơn giá: <strong>{formatVND(v.daily_rate)}/ngày</strong></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "PROFILE" && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-xl font-bold text-[#131b2e]">Hồ sơ Tài xế & Bằng lái</h2>
              {profileMsg && (
                <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
                  {profileMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Họ và tên *</label>
                  <input
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Ngày tháng năm sinh</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={profileForm.date_of_birth}
                    onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Số điện thoại *</label>
                  <input
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Số CCCD *</label>
                  <input
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={profileForm.id_card}
                    onChange={(e) => setProfileForm({ ...profileForm, id_card: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Hạng bằng lái</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={profileForm.license_class}
                    onChange={(e) => setProfileForm({ ...profileForm, license_class: e.target.value })}
                  >
                    <option value="B1">Hạng B1</option>
                    <option value="B2">Hạng B2</option>
                    <option value="C">Hạng C</option>
                    <option value="D">Hạng D</option>
                    <option value="E">Hạng E</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Địa chỉ liên hệ</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Upload className="h-3.5 w-3.5" /> Ảnh bằng lái xe (Upload ảnh)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLicenseUpload}
                    className="w-full rounded-xl border border-dashed border-slate-300 p-2 text-xs"
                  />
                  {profileForm.license_image_url && (
                    <img
                      src={profileForm.license_image_url}
                      alt="Ảnh bằng lái"
                      className="mt-2 h-32 rounded-xl border object-cover"
                    />
                  )}
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-[#00236f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e3a8a]"
                  >
                    <Save className="h-4 w-4" /> Lưu hồ sơ tài xế
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
