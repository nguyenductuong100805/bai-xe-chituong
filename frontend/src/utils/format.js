export const formatVND = (amount) => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

export const STATUS_META = {
  AVAILABLE: {
    label: "Rảnh",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  RENTED: {
    label: "Đang thuê",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
  },
  MAINTENANCE: {
    label: "Bảo trì",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
};

export const RENTAL_TYPE_LABEL = {
  SELF_DRIVE: "Tự lái",
  WITH_DRIVER: "Có tài xế",
};
