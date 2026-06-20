import {
  sortCustomerProfileDescending,
  sortDashboardDataDescending,
  sortRecordsDescending,
} from "../utils/recordSort";
import { APPS_SCRIPT_PROJECT } from "../config/sourceSheets";
import { applyEffectiveWarrantyStatus } from "../utils/warrantyStatus";

const API_URL =
  import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
  APPS_SCRIPT_PROJECT.webAppUrl;

export async function getDashboardData() {
  const response = await fetch(`${API_URL}?action=getDashboard`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to load dashboard data");
  }

  return sortDashboardDataDescending(result.data);
}

export async function getAllData(type) {
  const response = await fetch(`${API_URL}?action=getAll&type=${type}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to load data");
  }

  const records =
    type === "acUnits"
      ? result.data.map(applyEffectiveWarrantyStatus)
      : result.data;

  return sortRecordsDescending(type, records);
}

export async function getCustomerProfile(customerId) {
  const response = await fetch(
    `${API_URL}?action=getCustomerProfile&customerId=${customerId}`
  );

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to load customer profile");
  }

  return sortCustomerProfileDescending({
    ...result.data,
    acUnits: (result.data?.acUnits || []).map(applyEffectiveWarrantyStatus),
  });
}

async function postApi(action, data) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action,
      data,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || `Failed to ${action}`);
  }

  return result.data;
}

export async function addSale(saleData) {
  return postApi("addSale", saleData);
}

export async function addInstallation(installationData) {
  return postApi("addInstallation", installationData);
}

export async function addService(serviceData) {
  return postApi("addService", serviceData);
}

export async function addPayment(paymentData) {
  return postApi("addPayment", paymentData);
}

export async function addComplaint(complaintData) {
  return postApi("addComplaint", complaintData);
}

export async function saveCustomerLocation(locationData) {
  return postApi("saveCustomerLocation", locationData);
}

export async function assignACUnitLocation(acId, customerId, locationId) {
  return postApi("assignACUnitLocation", {
    AC_ID: acId,
    Customer_ID: customerId,
    Location_ID: locationId,
  });
}

export async function updateRecord(type, idColumn, id, updatedData) {
  return postApi("updateRecord", {
    type,
    idColumn,
    id,
    updatedData,
  });
}

export async function sendManualReminder(type, id) {
  return postApi("sendManualReminder", {
    type,
    id,
  });
}

export async function checkDuplicateCustomer(phone) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "checkDuplicateCustomer",
      data: {
        phone,
      },
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to check for duplicates");
  }

  return result.data;
}

export async function syncCompanySheet(sourceSheets = []) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "syncCompanySheet",
      data: {
        sourceSheets,
        selectedSourceKeys: sourceSheets.map((sheet) => sheet.key),
      },
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Company sheet sync failed.");
  }

  return result.data;
}
