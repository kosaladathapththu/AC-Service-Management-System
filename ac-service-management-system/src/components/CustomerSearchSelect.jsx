function CustomerSearchSelect({
  customers,
  query,
  onQueryChange,
  onSelectCustomer,
  getCustomerId,
  getCustomerName,
  disabled = false,
  placeholder = "Search by customer ID, name, phone, email, or address",
}) {
  const filteredCustomers = customers.filter((customer) =>
    customerMatchesSearch(customer, query, getCustomerId, getCustomerName)
  );
  const hasQuery = String(query || "").trim() !== "";

  return (
    <div className="customer-search-select">
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />

      <span className="form-hint">
        {disabled
          ? "Loading customers..."
          : `${filteredCustomers.length} matching customer(s)`}
      </span>

      {hasQuery && (
        <div className="customer-search-results">
          {filteredCustomers.length === 0 ? (
            <p>No customer found for this search.</p>
          ) : (
            filteredCustomers.slice(0, 8).map((customer, index) => {
              const customerId = getCustomerId(customer);
              const customerName = getCustomerName(customer);

              return (
                <button
                  key={customerId || index}
                  type="button"
                  onClick={() => onSelectCustomer(customer, customerId)}
                >
                  <strong>{customerName}</strong>
                  <span>
                    {customerId || "-"} | {formatDisplayPhone(customer.Phone)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function getFilteredCustomers(
  customers,
  query,
  getCustomerId,
  getCustomerName
) {
  return customers.filter((customer) =>
    customerMatchesSearch(customer, query, getCustomerId, getCustomerName)
  );
}

function customerMatchesSearch(customer, query, getCustomerId, getCustomerName) {
  const cleanQuery = String(query || "").trim().toLowerCase();
  const queryDigits = String(query || "").replace(/\D/g, "");
  const cleanQueryPhone = normalizePhoneSearchQuery(query);
  const customerId = getCustomerId(customer);
  const customerName = getCustomerName(customer);

  if (!cleanQuery) return true;

  const textMatches = [
    customerId,
    customerName,
    `${customerId} - ${customerName}`,
    `${customerId} ${customerName}`,
    customer.Phone,
    formatDisplayPhone(customer.Phone),
    customer.Email,
    customer.Address,
  ].some((value) => String(value || "").toLowerCase().includes(cleanQuery));

  if (textMatches) return true;

  if (queryDigits && /^0+$/.test(queryDigits)) {
    return normalizePhone(customer.Phone) !== "";
  }

  return (
    cleanQueryPhone.length >= 1 &&
    normalizePhone(customer.Phone).includes(cleanQueryPhone)
  );
}

function normalizePhoneSearchQuery(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  let phone = digits;

  if (phone.startsWith("0094")) {
    phone = phone.slice(4);
  } else if (phone.startsWith("94")) {
    phone = phone.slice(2);
  }

  return phone.replace(/^0+/, "");
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  let phone = digits;

  if (phone.startsWith("0094") && phone.length > 9) {
    phone = phone.slice(4);
  } else if (phone.startsWith("94") && phone.length > 9) {
    phone = phone.slice(2);
  } else if (phone.startsWith("0") && phone.length > 9) {
    phone = phone.replace(/^0+/, "");
  }

  return phone.length > 9 ? phone.slice(-9) : phone;
}

function formatDisplayPhone(value) {
  const phone = normalizePhone(value);

  if (!phone) return "No phone";

  return phone.length === 9 ? `0${phone}` : phone;
}

export default CustomerSearchSelect;
