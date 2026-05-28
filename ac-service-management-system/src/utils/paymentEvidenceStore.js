const STORAGE_KEY = "ac_payment_evidence_cache";

export function cachePaymentEvidence(paymentId, paymentData) {
  if (!paymentId || !hasPaymentEvidence(paymentData)) return;

  const existing = readEvidenceCache();
  existing[String(paymentId)] = pickEvidenceFields(paymentData);
  writeEvidenceCache(existing);
}

export function mergePaymentEvidenceCache(payments) {
  if (!Array.isArray(payments)) return payments;

  const cache = readEvidenceCache();

  return payments.map((payment) => {
    const paymentId = payment.Payment_ID || payment.paymentId || payment.id;
    const cachedEvidence = cache[String(paymentId || "")];

    if (!cachedEvidence) return payment;

    return {
      ...cachedEvidence,
      ...payment,
      Payment_Evidence_Method:
        payment.Payment_Evidence_Method || cachedEvidence.Payment_Evidence_Method,
      Payment_Evidence_Link:
        payment.Payment_Evidence_Link || cachedEvidence.Payment_Evidence_Link,
      Payment_Evidence_File_Name:
        payment.Payment_Evidence_File_Name || cachedEvidence.Payment_Evidence_File_Name,
      Payment_Evidence_File_Data:
        payment.Payment_Evidence_File_Data || cachedEvidence.Payment_Evidence_File_Data,
      Payment_Evidence_File_Data_URL:
        payment.Payment_Evidence_File_Data_URL || cachedEvidence.Payment_Evidence_File_Data_URL,
    };
  });
}

export function mergePaymentEvidenceCacheIntoProfile(profile) {
  if (!profile || !Array.isArray(profile.payments)) return profile;

  return {
    ...profile,
    payments: mergePaymentEvidenceCache(profile.payments),
  };
}

function hasPaymentEvidence(paymentData) {
  return Boolean(
    paymentData.Payment_Evidence_Link ||
      paymentData.Payment_Evidence_File_Name ||
      paymentData.Payment_Evidence_File_Data ||
      paymentData.Payment_Evidence_File_Data_URL
  );
}

function pickEvidenceFields(paymentData) {
  return {
    Payment_Evidence_Method: paymentData.Payment_Evidence_Method || "",
    Payment_Evidence_Link: paymentData.Payment_Evidence_Link || "",
    Payment_Evidence_File_Name: paymentData.Payment_Evidence_File_Name || "",
    Payment_Evidence_File_Data: paymentData.Payment_Evidence_File_Data || "",
    Payment_Evidence_File_Data_URL: paymentData.Payment_Evidence_File_Data_URL || "",
  };
}

function readEvidenceCache() {
  try {
    const storage = getLocalStorage();
    if (!storage) return {};

    return JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeEvidenceCache(cache) {
  try {
    const storage = getLocalStorage();
    if (!storage) return;

    storage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Google Sheets should be the long-term store. Local cache is best effort.
  }
}

function getLocalStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}
