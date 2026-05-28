export function getRecordCustomerName(record, customers) {
  const existingName = getFirstValue(record, [
    "Customer_Name",
    "Customer Name",
    "customerName",
    "name",
  ]);

  if (existingName) return existingName;

  const recordCustomerId = String(record.Customer_ID || "").trim();
  if (!recordCustomerId) return "";

  const customer = customers.find((item) => {
    const customerId = getFirstValue(item, [
      "Customer_ID",
      "Customer ID",
      "customer_ID",
      "id",
    ]);

    return String(customerId).trim() === recordCustomerId;
  });

  return customer
    ? getFirstValue(customer, ["Customer_Name", "Customer Name", "name"])
    : "";
}

export function formatCustomerDisplay(customerId, customerName) {
  const id = customerId || "-";
  return customerName ? `${id} - ${customerName}` : id;
}

function getFirstValue(source, keys) {
  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}
