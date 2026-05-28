import { formatCustomerDisplay, getRecordCustomerName } from "./customerDisplay";

export function recordMatchesSearch(record, customers, query, fieldKeys) {
  const cleanQuery = String(query || "").trim().toLowerCase();
  if (!cleanQuery) return true;

  const customerName = getRecordCustomerName(record, customers);
  const searchableValues = [
    formatCustomerDisplay(record.Customer_ID, customerName),
    ...fieldKeys.map((key) => record[key]),
  ];

  return searchableValues.some((value) =>
    String(value || "").toLowerCase().includes(cleanQuery)
  );
}
