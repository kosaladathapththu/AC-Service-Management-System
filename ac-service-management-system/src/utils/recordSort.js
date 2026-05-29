const TYPE_CONFIG = {
  customers: {
    idKeys: ["Customer_ID", "customer_ID", "Customer ID", "id"],
    dateKeys: ["Created_Date", "Created Date", "createdDate"],
  },
  acUnits: {
    idKeys: ["AC_ID", "ac_ID", "AC ID", "id"],
    dateKeys: ["Purchase_Date", "Purchase Date", "Warranty_Start_Date"],
  },
  installations: {
    idKeys: ["Installation_ID", "Installation ID", "id"],
    dateKeys: ["Installation_Date", "Installation Date"],
  },
  services: {
    idKeys: ["Service_ID", "Service ID", "id"],
    dateKeys: ["Service_Date", "Service Date"],
  },
  payments: {
    idKeys: ["Payment_ID", "Payment ID", "id"],
    dateKeys: ["Payment_Date", "Payment Date", "Due_Date", "Due Date"],
  },
  complaints: {
    idKeys: ["Complaint_ID", "Complaint ID", "id"],
    dateKeys: ["Complaint_Date", "Complaint Date"],
  },
};

const PROFILE_LIST_TYPES = {
  acUnits: "acUnits",
  installations: "installations",
  services: "services",
  payments: "payments",
  complaints: "complaints",
};

const DASHBOARD_LIST_TYPES = {
  servicesDueThisMonthList: "services",
  overdueServicesList: "services",
  pendingPaymentsList: "payments",
  overduePaymentsList: "payments",
  openComplaintsList: "complaints",
};

export function sortRecordsDescending(type, records) {
  if (!Array.isArray(records)) return records;

  const config = TYPE_CONFIG[type] || {};

  return [...records].sort((a, b) => compareRecordsDescending(a, b, config));
}

export function sortCustomerProfileDescending(profile) {
  if (!profile) return profile;

  return Object.entries(PROFILE_LIST_TYPES).reduce(
    (nextProfile, [key, type]) => ({
      ...nextProfile,
      [key]: sortRecordsDescending(type, nextProfile[key]),
    }),
    { ...profile }
  );
}

export function sortDashboardDataDescending(data) {
  if (!data) return data;

  return Object.entries(DASHBOARD_LIST_TYPES).reduce(
    (nextData, [key, type]) => ({
      ...nextData,
      [key]: sortRecordsDescending(type, nextData[key]),
    }),
    { ...data }
  );
}

function compareRecordsDescending(a, b, config) {
  const aIdScore = getNumericIdScore(a, config.idKeys || []);
  const bIdScore = getNumericIdScore(b, config.idKeys || []);

  if (aIdScore !== bIdScore) return bIdScore - aIdScore;

  const aDateScore = getDateScore(a, config.dateKeys || []);
  const bDateScore = getDateScore(b, config.dateKeys || []);

  return bDateScore - aDateScore;
}

function getNumericIdScore(record, keys) {
  const rawId = getFirstValue(record, keys);
  const match = String(rawId).match(/(\d+)(?!.*\d)/);

  return match ? Number(match[1]) : 0;
}

function getDateScore(record, keys) {
  for (const key of keys) {
    const value = record?.[key];
    const time = new Date(value).getTime();

    if (!Number.isNaN(time)) return time;
  }

  return 0;
}

function getFirstValue(record, keys) {
  for (const key of keys) {
    const value = record?.[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
}
