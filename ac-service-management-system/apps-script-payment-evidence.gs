/**
 * Permanent payment evidence storage for Google Apps Script.
 *
 * Use one real Payments sheet column:
 * Payment_Evidence
 *
 * The frontend can still send temporary upload fields. Apps Script converts
 * uploaded files into a Google Drive link, then stores only that link in the
 * Payment_Evidence cell.
 */

const PAYMENT_EVIDENCE_FOLDER_NAME = "AC Payment Evidence";

function savePaymentEvidenceToDrive(paymentData, paymentId) {
  const method = String(paymentData.Payment_Evidence_Method || "").toLowerCase();

  if (method === "link") {
    return (
      paymentData.Payment_Evidence ||
      paymentData.Payment_Evidence_Link ||
      paymentData.Payment_Evidence_Drive_Link ||
      ""
    );
  }

  const base64Data = paymentData.Payment_Evidence_File_Data;
  if (!base64Data) {
    return "";
  }

  const folder = getOrCreatePaymentEvidenceFolder();
  const fileName = buildEvidenceFileName(paymentData, paymentId);
  const mimeType =
    paymentData.Payment_Evidence_File_Mime_Type || "application/octet-stream";
  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    mimeType,
    fileName
  );
  const file = folder.createFile(blob);

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return `https://drive.google.com/file/d/${file.getId()}/view?usp=sharing`;
}

function applyPaymentEvidenceField(paymentData, paymentId) {
  const evidenceLink = savePaymentEvidenceToDrive(paymentData, paymentId);

  return {
    ...paymentData,
    Payment_Evidence: evidenceLink,
  };
}

function getOrCreatePaymentEvidenceFolder() {
  const folders = DriveApp.getFoldersByName(PAYMENT_EVIDENCE_FOLDER_NAME);

  if (folders.hasNext()) return folders.next();

  return DriveApp.createFolder(PAYMENT_EVIDENCE_FOLDER_NAME);
}

function buildEvidenceFileName(paymentData, paymentId) {
  const originalName = paymentData.Payment_Evidence_File_Name || "evidence";
  const extensionMatch = String(originalName).match(/\.[^.]+$/);
  const extension = extensionMatch ? extensionMatch[0] : "";
  const cleanPaymentId = String(paymentId || "payment").replace(/[^\w-]/g, "_");
  const cleanCustomerId = String(paymentData.Customer_ID || "customer").replace(
    /[^\w-]/g,
    "_"
  );
  const timestamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyyMMdd_HHmmss"
  );

  return `${cleanPaymentId}_${cleanCustomerId}_${timestamp}${extension}`;
}

/**
 * Replace your current addPayment(data) function with this version.
 * Your Payments sheet only needs this extra header:
 * Payment_Evidence
 */
function addPayment(data) {
  if (!data) {
    throw new Error("Payment data is required");
  }

  if (!data.Customer_ID) {
    throw new Error("Customer ID is required");
  }

  if (!data.AC_ID) {
    throw new Error("AC ID is required");
  }

  const paymentSheet = getSheetByType("payments");

  const paymentId = generateNextId("payments", "Payment_ID", "PAY");
  const finalPaymentData = applyPaymentEvidenceField(data, paymentId);

  const paymentRowData = {
    Payment_ID: paymentId,
    Customer_ID: finalPaymentData.Customer_ID || "",
    AC_ID: finalPaymentData.AC_ID || "",
    Payment_Year: finalPaymentData.Payment_Year || "",
    Payment_Date: finalPaymentData.Payment_Date || "",
    Amount: finalPaymentData.Amount || "",
    Payment_Type: finalPaymentData.Payment_Type || "Annual Service",
    Payment_Status: finalPaymentData.Payment_Status || "Pending",
    Due_Date: finalPaymentData.Due_Date || "",
    Annual_Service_Count: finalPaymentData.Annual_Service_Count || "3",
    Service_Generated: "",
    Notes: finalPaymentData.Notes || "",
    Reminder_Status: "",
    Reminder_Sent_Date: "",
    Payment_Evidence: finalPaymentData.Payment_Evidence || "",
  };

  appendObjectToSheet(paymentSheet, paymentRowData);

  if (
    normalize(paymentRowData.Payment_Type) === "annual service" &&
    normalize(paymentRowData.Payment_Status) === "paid"
  ) {
    generateAnnualPaidServices(paymentRowData);
    markPaymentServicesGenerated(paymentId);
    updateACWarrantyStatus(paymentRowData.AC_ID, "Active");
  }

  return {
    paymentId: paymentId,
    payment: paymentRowData,
    paymentEvidenceLink: paymentRowData.Payment_Evidence,
  };
}
