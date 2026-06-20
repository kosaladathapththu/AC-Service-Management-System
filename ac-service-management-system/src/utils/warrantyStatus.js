export function getEffectiveWarrantyStatus(unit) {
  const storedStatus = String(unit?.Warranty_Status || "Active").trim();

  if (storedStatus.toLowerCase() === "cancelled") return "Cancelled";
  if (isWarrantyEndDatePast(unit?.Warranty_End_Date)) return "Expired";
  if (storedStatus.toLowerCase() === "expired") return "Active";

  return storedStatus || "Active";
}

export function applyEffectiveWarrantyStatus(unit) {
  return { ...unit, Warranty_Status: getEffectiveWarrantyStatus(unit) };
}

function isWarrantyEndDatePast(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return endDate < today;
}
