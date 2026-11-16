import { useState } from "react";
import { Car, ShieldCheck, Upload, User, Users } from "lucide-react";
import { api } from "../api/client";

const ROLES = [
  { id: "ADMIN", label: "Quản trị viên (Admin)", icon: ShieldCheck },
  { id: "CUSTOMER", label: "Khách hàng", icon: User },
  { id: "DRIVER", label: "Tài xế đối tác", icon: Users },
];

export default function AuthPage({ onLoginSuccess }) {
  const [role, setRole] = useState("ADMIN");
  const [mode, setMode] = useState("LOGIN"); // LOGIN | REGISTER
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  const [customerReg, setCustomerReg] = useState({
    username: "",
    password: "",
    full_name: "",
    date_of_birth: "",
    phone: "",
    email: "",
    id_card: "",
    driver_license: "",
    address: "",
    emergency_contact: "",
  });

  const [driverReg, setDriverReg] = useState({
    username: "",
    password: "",
    full_name: "",
    date_of_birth: "",
    phone: "",
    email: "",
    id_card: "",
    address: "",
    license_class: "B2",
    license_image_url: "",
  });

  const handleSelectRole = (nextRole) => {
    setRole(nextRole);
    setError("");
    if (nextRole === "ADMIN") {
      setMode("LOGIN");
    }
  };

  const handleLicenseImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDriverReg((prev) => ({ ...prev, license_image_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let res;
      if (mode === "LOGIN" || role === "ADMIN") {
        res = await api.login({
          username: loginForm.username,
          password: loginForm.password,
          role,
        });
      } else if (role === "CUSTOMER") {
        res = await api.registerCustomer({
          ...customerReg,
          date_of_birth: customerReg.date_of_birth || null,
        });
      } else {
        res = await api.registerDriver({
          ...driverReg,
          date_of_birth: driverReg.date_of_birth || null,
        });
      }
      onLoginSuccess(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf8ff] p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl">
        {/* Header Brand */}
        <div className="bg-gradient-to-r from-[#00236f] to-[#1e3a8a] px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <Car className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Nhà Xe Chí Tường</h1>
              <p className="text-xs text-[#dce1ff]">
                Hệ thống Quản lý & Đặt xe Ô tô Tự lái & Có Tài xế
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Role Selector */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Chọn vai trò đăng nhập
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const active = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRole(r.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-bold transition ${
                      active
                        ? "border-[#00236f] bg-[#f2f3ff] text-[#00236f]"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-center">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle Login / Register cho Khách hàng & Tài xế */}
          {role !== "ADMIN" && (
            <div className="mb-5 flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode("LOGIN");
                  setError("");
                }}
                className={`flex-1 rounded-lg py-2 transition ${
                  mode === "LOGIN" ? "bg-white text-[#00236f] shadow-xs" : "text-slate-600"
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("REGISTER");
                  setError("");
                }}
                className={`flex-1 rounded-lg py-2 transition ${
                  mode === "REGISTER" ? "bg-white text-[#00236f] shadow-xs" : "text-slate-600"
                }`}
              >
                Đăng ký tài khoản mới
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "LOGIN" || role === "ADMIN" ? (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Tên đăng nhập {role === "ADMIN" ? "(Admin)" : ""}
                  </label>
                  <input
                    required
                    placeholder={role === "ADMIN" ? "Nhập tên đăng nhập Admin" : "Nhập tên đăng nhập"}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#00236f] focus:outline-none"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Mật khẩu
                  </label>
                  <input
                    required
                    type="password"
                    placeholder="Nhập mật khẩu"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#00236f] focus:outline-none"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>
              </>
            ) : role === "CUSTOMER" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  required
                  placeholder="Tên đăng nhập *"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={customerReg.username}
                  onChange={(e) => setCustomerReg({ ...customerReg, username: e.target.value })}
                />
                <input
                  required
                  type="password"
                  placeholder="Mật khẩu *"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={customerReg.password}
                  onChange={(e) => setCustomerReg({ ...customerReg, password: e.target.value })}
                />
                <input
                  required
                  placeholder="Họ và tên *"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={customerReg.full_name}
                  onChange={(e) => setCustomerReg({ ...customerReg, full_name: e.target.value })}
                />
                <input
                  type="date"
                  title="Ngày tháng năm sinh"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={customerReg.date_of_birth}
                  onChange={(e) => setCustomerReg({ ...customerReg, date_of_birth: e.target.value })}
                />
                <input
                  required
                  placeholder="Số điện thoại *"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={customerReg.phone}
                  onChange={(e) => setCustomerReg({ ...customerReg, phone: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email liên hệ"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={customerReg.email}
                  onChange={(e) => setCustomerReg({ ...customerReg, email: e.target.value })}
                />
                <input
                  required
                  placeholder="Số CCCD / CMND *"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={customerReg.id_card}
                  onChange={(e) => setCustomerReg({ ...customerReg, id_card: e.target.value })}
                />
                <input
                  placeholder="Số GPLX (nếu thuê tự lái)"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={customerReg.driver_license}
                  onChange={(e) => setCustomerReg({ ...customerReg, driver_license: e.target.value })}
                />
                <input
                  placeholder="Địa chỉ thường trú"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
                  value={customerReg.address}
                  onChange={(e) => setCustomerReg({ ...customerReg, address: e.target.value })}
                />
                <input
                  placeholder="Người liên hệ khẩn cấp (Tên + SĐT)"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
                  value={customerReg.emergency_contact}
                  onChange={(e) =>
                    setCustomerReg({ ...customerReg, emergency_contact: e.target.value })
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  required
                  placeholder="Tên đăng nhập *"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={driverReg.username}
                  onChange={(e) => setDriverReg({ ...driverReg, username: e.target.value })}
                />
                <input
                  required
                  type="password"
                  placeholder="Mật khẩu *"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={driverReg.password}
                  onChange={(e) => setDriverReg({ ...driverReg, password: e.target.value })}
                />
                <input
                  required
                  placeholder="Họ và tên tài xế *"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={driverReg.full_name}
                  onChange={(e) => setDriverReg({ ...driverReg, full_name: e.target.value })}
                />
                <input
                  type="date"
                  title="Ngày tháng năm sinh"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={driverReg.date_of_birth}
                  onChange={(e) => setDriverReg({ ...driverReg, date_of_birth: e.target.value })}
                />
                <input
                  required
                  placeholder="Số điện thoại *"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={driverReg.phone}
                  onChange={(e) => setDriverReg({ ...driverReg, phone: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email liên hệ"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={driverReg.email}
                  onChange={(e) => setDriverReg({ ...driverReg, email: e.target.value })}
                />
                <input
                  required
                  placeholder="Số CCCD *"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={driverReg.id_card}
                  onChange={(e) => setDriverReg({ ...driverReg, id_card: e.target.value })}
                />
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={driverReg.license_class}
                  onChange={(e) => setDriverReg({ ...driverReg, license_class: e.target.value })}
                >
                  <option value="B1">Bằng lái hạng B1</option>
                  <option value="B2">Bằng lái hạng B2</option>
                  <option value="C">Bằng lái hạng C</option>
                  <option value="D">Bằng lái hạng D</option>
                  <option value="E">Bằng lái hạng E</option>
                </select>
                <input
                  placeholder="Địa chỉ liên hệ"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
                  value={driverReg.address}
                  onChange={(e) => setDriverReg({ ...driverReg, address: e.target.value })}
                />
                <div className="sm:col-span-2">
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Upload className="h-3.5 w-3.5" /> Ảnh bằng lái xe (Upload ảnh)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLicenseImageUpload}
                    className="w-full rounded-xl border border-dashed border-slate-300 p-2 text-xs"
                  />
                  {driverReg.license_image_url && (
                    <img
                      src={driverReg.license_image_url}
                      alt="Preview bằng lái"
                      className="mt-2 h-24 rounded-lg border object-cover"
                    />
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#00236f] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#1e3a8a] disabled:opacity-50"
            >
              {loading
                ? "Đang xử lý..."
                : mode === "LOGIN" || role === "ADMIN"
                ? "Đăng nhập vào Nhà Xe Chí Tường"
                : "Hoàn tất đăng ký & Vào hệ thống"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
