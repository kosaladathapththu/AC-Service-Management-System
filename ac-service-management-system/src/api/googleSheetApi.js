import {
  sortCustomerProfileDescending,
  sortDashboardDataDescending,
  sortRecordsDescending,
} from "../utils/recordSort";
import { APPS_SCRIPT_PROJECT } from "../config/sourceSheets";

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

  return sortRecordsDescending(type, result.data);
}

export async function getCustomerProfile(customerId) {
  const response = await fetch(
    `${API_URL}?action=getCustomerProfile&customerId=${customerId}`
  );

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to load customer profile");
  }

  return sortCustomerProfileDescending(result.data);
}

export async function addSale(saleData) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "addSale",
      data: saleData,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to add sale");
  }

  return result.data;
}

export async function addInstallation(installationData) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "addInstallation",
      data: installationData,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to add installation");
  }

  return result.data;
}

export async function addService(serviceData) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "addService",
      data: serviceData,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to add service");
  }

  return result.data;
}

export async function addPayment(paymentData) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "addPayment",
      data: paymentData,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to add payment");
  }

  return result.data;
}

export async function addComplaint(complaintData) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "addComplaint",
      data: complaintData,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to add complaint");
  }

  return result.data;
}

export async function updateRecord(type, idColumn, id, updatedData) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "updateRecord",
      data: {
        type,
        idColumn,
        id,
        updatedData,
      },
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to update record");
  }

  return result.data;
}

export async function sendManualReminder(type, id) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "sendManualReminder",
      data: {
        type,
        id,
      },
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to send reminder");
  }

  return result.data;
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
      data: { sourceSheets },
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Company sheet sync failed.");
  }

  return result.data;
}
