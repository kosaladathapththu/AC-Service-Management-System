export function hasAnnualServicePaymentForYear(
  payments,
  paymentData,
  excludePaymentId = ""
) {
  if (String(paymentData.Payment_Type || "").toLowerCase() !== "annual service") {
    return false;
  }

  const customerId = normalize(paymentData.Customer_ID);
  const acId = normalize(paymentData.AC_ID);
  const year = normalize(paymentData.Payment_Year);
  const excludedId = normalize(excludePaymentId);

  if (!customerId || !acId || !year) return false;

  return payments.some((payment) => {
    const paymentId = normalize(payment.Payment_ID);

    if (excludedId && paymentId === excludedId) return false;

    return (
      normalize(payment.Payment_Type) === "annual service" &&
      normalize(payment.Customer_ID) === customerId &&
      normalize(payment.AC_ID) === acId &&
      normalize(payment.Payment_Year) === year
    );
  });
}

export function getPurchasedAnnualServiceYears(payments, customerId, acId) {
  const cleanCustomerId = normalize(customerId);
  const cleanAcId = normalize(acId);

  if (!cleanCustomerId || !cleanAcId) return [];

  return payments
    .filter(
      (payment) =>
        normalize(payment.Payment_Type) === "annual service" &&
        normalize(payment.Customer_ID) === cleanCustomerId &&
        normalize(payment.AC_ID) === cleanAcId &&
        normalize(payment.Payment_Year)
    )
    .map((payment) => payment.Payment_Year);
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}
