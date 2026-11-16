import { useState } from "react";
import { Car, Compass, FileText, LogOut, Save, User } from "lucide-react";
import { api } from "../api/client";
import { RENTAL_TYPE_LABEL, formatDate, formatVND } from "../utils/format";
import BookingModal from "./BookingModal";
import MiotoExplore from "./MiotoExplore";
import VehicleDetailModal from "./VehicleDetailModal";

export default function CustomerPortalView({
  auth,
  vehicles,
  contracts,
  onRefresh,
  onProfileUpdated,
  onLogout,
}) {
  const [tab, setTab] = useState("EXPLORE"); // EXPLORE | CONTRACTS | PROFILE
  const [detailVehicleId, setDetailVehicleId] = useState(null);
  const [bookingTarget, setBookingTarget] = useState(null);

  const customer = auth.customer || {};
  const [profileForm, setProfileForm] = useState({
    full_name: customer.full_name || auth.full_name || "",
    date_of_birth: customer.date_of_birth || "",
    phone: customer.phone || "",
    email: customer.email || "",
    id_card: customer.id_card || "",
    driver_license: customer.driver_license || "",
    address: customer.address || "",
    emergency_contact: customer.emergency_contact || "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const myContracts = contracts.filter(
    (c) => c.customer_id === customer.id || c.customer?.phone === customer.phone
  );

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      const updated = await api.updateProfile(auth.user_id, {
        ...profileForm,
        date_of_birth: profileForm.date_of_birth || null,
      });
      onProfileUpdated(updated);
      setSaveMsg("Đã lưu hồ sơ khách hàng thành công!");
    } catch (err) {
      setSaveMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#faf8ff] text-[#131b2e]">
      {/* Sidebar Khách hàng */}
      <aside className="hidden w-64 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00236f] text-white">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#00236f]">Nhà Xe Chí Tường</div>
              <div className="text-[11px] text-slate-500">Cổng Khách Hàng</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <button
            onClick={() => setTab("EXPLORE")}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold ${
              tab === "EXPLORE"
                ? "bg-[#00236f] text-white"
                : "text-[#444651] hover:bg-[#f2f3ff]"
            }`}
          >
            <Compass className="h-4 w-4" /> Thuê xe (Tự lái / Có tài xế)
          </button>
          <button
            onClick={() => setTab("CONTRACTS")}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold ${
              tab === "CONTRACTS"
                ? "bg-[#00236f] text-white"
                : "text-[#444651] hover:bg-[#f2f3ff]"
            }`}
          >
            <FileText className="h-4 w-4" /> Hợp đồng của tôi ({myContracts.length})
          </button>
          <button
            onClick={() => setTab("PROFILE")}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold ${
              tab === "PROFILE"
                ? "bg-[#00236f] text-white"
                : "text-[#444651] hover:bg-[#f2f3ff]"
            }`}
          >
            <User className="h-4 w-4" /> Hồ sơ Khách hàng
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

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-6 py-3.5">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setTab("EXPLORE")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                tab === "EXPLORE" ? "bg-[#00236f] text-white" : "bg-slate-100"
              }`}
            >
              Thuê xe
            </button>
            <button
              onClick={() => setTab("CONTRACTS")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                tab === "CONTRACTS" ? "bg-[#00236f] text-white" : "bg-slate-100"
              }`}
            >
              Hợp đồng
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
            Xin chào, {profileForm.full_name}
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 lg:hidden"
          >
            <LogOut className="h-3.5 w-3.5" /> Đăng xuất
          </button>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
          {tab === "EXPLORE" && (
            <MiotoExplore
              vehicles={vehicles}
              onViewDetail={(id) => setDetailVehicleId(id)}
              onBook={(vehicle) =>
                setBookingTarget({
                  vehicle,
                  initialDate: new Date().toISOString().slice(0, 10),
                })
              }
            />
          )}

          {tab === "CONTRACTS" && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h2 className="text-lg font-bold text-[#131b2e]">Hợp đồng thuê xe của tôi</h2>
              {myContracts.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  Bạn chưa có hợp đồng thuê xe nào. Hãy chọn xe ở mục Thuê xe để đặt ngay.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Mã HĐ</th>
                        <th className="px-4 py-3">Xe</th>
                        <th className="px-4 py-3">Hình thức</th>
                        <th className="px-4 py-3">Thời gian</th>
                        <th className="px-4 py-3 text-right">Tổng tiền</th>
                        <th className="px-4 py-3 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {myContracts.map((c) => (
                        <tr key={c.id}>
                          <td className="px-4 py-3 font-mono font-bold text-[#00236f]">
                            {c.contract_code}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {c.vehicle?.brand} {c.vehicle?.model} ({c.vehicle?.license_plate})
                          </td>
                          <td className="px-4 py-3">{RENTAL_TYPE_LABEL[c.rental_type]}</td>
                          <td className="px-4 py-3">
                            {formatDate(c.start_date)} → {formatDate(c.expected_end_date)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            {formatVND(c.total_amount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`rounded-full px-2.5 py-0.5 font-semibold ${
                                c.status === "ACTIVE"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {c.status === "ACTIVE" ? "Đang thuê" : "Hoàn tất"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "PROFILE" && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <h2 className="text-xl font-bold text-[#131b2e]">Hồ sơ Khách hàng</h2>
              <p className="text-xs text-slate-500">
                Thông tin liên lạc đầy đủ phục vụ lập hợp đồng điện tử và xác minh nhận xe tại Nhà Xe Chí Tường.
              </p>

              {saveMsg && (
                <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
                  {saveMsg}
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
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Email liên hệ</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Số CCCD / CMND *</label>
                  <input
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={profileForm.id_card}
                    onChange={(e) => setProfileForm({ ...profileForm, id_card: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Số Giấy phép lái xe (GPLX)</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={profileForm.driver_license}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, driver_license: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Địa chỉ thường trú / Giao nhận xe</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Liên hệ khẩn cấp (Họ tên & SĐT người thân)</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={profileForm.emergency_contact}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, emergency_contact: e.target.value })
                    }
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-[#00236f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e3a8a]"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Đang lưu..." : "Lưu hồ sơ khách hàng"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {detailVehicleId && (
        <VehicleDetailModal
          vehicleId={detailVehicleId}
          onClose={() => setDetailVehicleId(null)}
          onBook={(vehicle) => {
            setDetailVehicleId(null);
            setBookingTarget({
              vehicle,
              initialDate: new Date().toISOString().slice(0, 10),
            });
          }}
        />
      )}

      {bookingTarget && (
        <BookingModal
          vehicle={bookingTarget.vehicle}
          initialDate={bookingTarget.initialDate}
          defaultCustomer={profileForm}
          isCustomerMode={true}
          onClose={() => setBookingTarget(null)}
          onSuccess={() => {
            setBookingTarget(null);
            onRefresh();
            setTab("CONTRACTS");
          }}
        />
      )}
    </div>
  );
}
