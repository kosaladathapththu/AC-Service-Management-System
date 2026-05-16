const API_URL = "https://script.google.com/macros/s/AKfycbwWbe_nB0VaBJw3A23vjbXaDNHUrBeSqcyKnnhOe26UAarOq6Ga-HtOv2Qfwj1fPZYV/exec";

export async function getDashboardData() {
  const response = await fetch(`${API_URL}?action=getDashboard`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to load dashboard data");
  }

  return result.data;
}

export async function getAllData(type) {
  const response = await fetch(`${API_URL}?action=getAll&type=${type}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to load data");
  }

  return result.data;
}

export async function getCustomerProfile(customerId) {
  const response = await fetch(
    `${API_URL}?action=getCustomerProfile&customerId=${customerId}`
  );

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to load customer profile");
  }

  return result.data;
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