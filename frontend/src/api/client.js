const API_BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Có lỗi xảy ra khi gọi API");
  }
  return data;
}

export const api = {
  login: (payload) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  registerCustomer: (payload) =>
    request("/auth/register/customer", { method: "POST", body: JSON.stringify(payload) }),
  registerDriver: (payload) =>
    request("/auth/register/driver", { method: "POST", body: JSON.stringify(payload) }),
  getProfile: (userId) => request(`/auth/profile/${userId}`),
  updateProfile: (userId, payload) =>
    request(`/auth/profile/${userId}`, { method: "PUT", body: JSON.stringify(payload) }),
  getCustomers: () => request("/auth/customers"),
  getDrivers: () => request("/auth/drivers"),
  getDashboard: () => request("/contracts/dashboard"),
  getPromos: () => request("/contracts/promos"),
  getVehicles: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== false) {
        qs.set(k, String(v));
      }
    });
    const q = qs.toString();
    return request(`/vehicles${q ? `?${q}` : ""}`);
  },
  getVehicleDetail: (id) => request(`/vehicles/${id}`),
  createVehicle: (payload) =>
    request("/vehicles", { method: "POST", body: JSON.stringify(payload) }),
  uploadVehicleMedia: (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await request("/vehicles/upload-media", {
            method: "POST",
            body: JSON.stringify({
              filename: file.name,
              content_base64: reader.result,
            }),
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Không thể đọc file tải lên"));
      reader.readAsDataURL(file);
    }),
  addVehicleReview: (id, payload) =>
    request(`/vehicles/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendToMaintenance: (id, payload) =>
    request(`/vehicles/${id}/maintenance`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  finishMaintenance: (id, payload) =>
    request(`/vehicles/${id}/finish-maintenance`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getContracts: (status) =>
    request(`/contracts${status ? `?status=${status}` : ""}`),
  getCalendarContracts: (startDate, endDate) =>
    request(`/contracts/calendar?start_date=${startDate}&end_date=${endDate}`),
  createContract: (payload) =>
    request("/contracts", { method: "POST", body: JSON.stringify(payload) }),
  previewReturn: (contractId, payload) =>
    request(`/contracts/${contractId}/preview-return`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  returnVehicle: (contractId, payload) =>
    request(`/contracts/${contractId}/return`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
