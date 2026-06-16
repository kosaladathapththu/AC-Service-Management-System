import { addService, getAllData } from "../api/googleSheetApi";

export async function ensureAnnualPaymentServices(payment) {
  if (!isPaidAnnualPayment(payment)) return [];

  const existingServices = await getAllData("services");
  const serviceRows = buildAnnualServiceRows(payment);
  const missingRows = serviceRows.filter(
    (row) => !annualServiceExists(existingServices, row)
  );

  const createdServices = [];

  for (const row of missingRows) {
    const result = await addService(row);
    createdServices.push(result);
  }

  return createdServices;
}

function isPaidAnnualPayment(payment) {
  return (
    normalize(payment.Payment_Type) === "annual service" &&
    normalize(payment.Payment_Status) === "paid" &&
    Boolean(payment.Customer_ID) &&
    Boolean(payment.AC_ID) &&
    Boolean(payment.Payment_Year)
  );
}

function buildAnnualServiceRows(payment) {
  const count = getAnnualServiceCount(payment.Annual_Service_Count);
  const dueDate = parseDate(payment.Due_Date || payment.Payment_Date);

  if (!dueDate) return [];

  return getServiceMonthsByCount(count).map((monthsToAdd, index) => ({
    Customer_ID: payment.Customer_ID,
    AC_ID: payment.AC_ID,
    Service_Date: formatDateForInput(addMonthsToDate(dueDate, monthsToAdd)),
    Service_Year: payment.Payment_Year,
    Service_No: String(index + 1),
    Service_Type: "Paid",
    Service_Category: "Normal",
    Technician_Name: "",
    Technician_Type: "In-house",
    Technician_Payment: "",
    Service_Status: "Pending",
    Service_Completed_Date: "",
    Payment_Required: "No",
    Notes: "Auto-created from paid annual service payment.",
  }));
}

function annualServiceExists(services, serviceRow) {
  return services.some(
    (service) =>
      normalize(service.Customer_ID) === normalize(serviceRow.Customer_ID) &&
      normalize(service.AC_ID) === normalize(serviceRow.AC_ID) &&
      normalize(service.Service_Year) === normalize(serviceRow.Service_Year) &&
      normalize(service.Service_No) === normalize(serviceRow.Service_No) &&
      normalize(service.Service_Type) === "paid"
  );
}

function getAnnualServiceCount(value) {
  const count = Number(value || 3);

  return [1, 2, 3, 4].includes(count) ? count : 3;
}

function getServiceMonthsByCount(serviceCount) {
  if (serviceCount === 1) return [12];
  if (serviceCount === 2) return [6, 12];
  if (serviceCount === 3) return [4, 8, 12];
  if (serviceCount === 4) return [3, 6, 9, 12];

  return [4, 8, 12];
}

function addMonthsToDate(dateValue, monthsToAdd) {
  const date = new Date(dateValue);
  const day = date.getDate();
  const newDate = new Date(date);

  newDate.setMonth(newDate.getMonth() + monthsToAdd);

  if (newDate.getDate() !== day) {
    newDate.setDate(0);
  }

  return newDate;
}

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatDateForInput(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}
