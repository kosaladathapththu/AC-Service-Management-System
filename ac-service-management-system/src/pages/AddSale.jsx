import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  addSale,
  checkDuplicateCustomer,
  getAllData,
} from "../api/googleSheetApi";
import CustomerSearchSelect, {
  getFilteredCustomers,
} from "../components/CustomerSearchSelect";

function AddSale() {
  const today = new Date().toISOString().split("T")[0];

  const emptyForm = {
    Customer_ID: "",
    Customer_Name: "",
    Phone: "",
    Email: "",
    Address: "",
    Google_Map_Link: "",
    Created_Date: today,
    Notes: "",

    AC_Model: "",
    Serial_Number: "",
    Quantity: "1",
    Price: "",
    Purchase_Date: today,
    Sales_Channel: "Showroom",
    Warranty_Start_Date: today,
    Warranty_End_Date: "",
    Warranty_Status: "Active",
  };

  const [saleMode, setSaleMode] = useState("new");
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [customerSearch, setCustomerSearch] = useState("");

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateFound, setDuplicateFound] = useState(null);
  const [duplicateCheckStatus, setDuplicateCheckStatus] = useState("idle");
  const latestPhoneRef = useRef("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoadingCustomers(true);
      const data = await getAllData("customers");
      setCustomers(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingCustomers(false);
    }
  }

  function handleModeChange(mode) {
    setSaleMode(mode);
    setSuccessMessage("");
    setError("");
    setDuplicateFound(null);
    setDuplicateCheckStatus("idle");
    latestPhoneRef.current = "";
    setCustomerSearch("");

    setFormData((prev) => ({
      ...emptyForm,
      AC_Model: prev.AC_Model,
      Serial_Number: prev.Serial_Number,
      Quantity: prev.Quantity || "1",
      Price: prev.Price,
      Purchase_Date: prev.Purchase_Date || today,
      Sales_Channel: prev.Sales_Channel || "Showroom",
      Warranty_Start_Date: prev.Warranty_Start_Date || today,
      Warranty_End_Date: prev.Warranty_End_Date,
      Warranty_Status: prev.Warranty_Status || "Active",
    }));
  }

  function handleCustomerSelect(event) {
    const customerId = event.target.value;
    const selectedCustomer = customers.find(
      (customer) => String(customer.Customer_ID) === String(customerId)
    );

    selectExistingCustomer(selectedCustomer, customerId);
  }

  function selectExistingCustomer(selectedCustomer, customerId) {
    setFormData((prev) => ({
      ...prev,
      Customer_ID: customerId || selectedCustomer?.Customer_ID || "",
      Customer_Name: selectedCustomer?.Customer_Name || "",
      Phone: selectedCustomer?.Phone || "",
      Email: selectedCustomer?.Email || "",
      Address: selectedCustomer?.Address || "",
      Google_Map_Link:
        selectedCustomer?.Google_Map_Link ||
        selectedCustomer?.Google_Map_Li ||
        "",
      Created_Date: selectedCustomer?.Created_Date || today,
      Notes: selectedCustomer?.Notes || "",
    }));
    latestPhoneRef.current = selectedCustomer?.Phone || "";
    if (selectedCustomer) {
      setCustomerSearch(
        `${selectedCustomer.Customer_ID} - ${selectedCustomer.Customer_Name || ""}`
      );
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "Phone" && saleMode === "new") {
      latestPhoneRef.current = value;
      checkForDuplicate(value);
    }
  }

  async function checkForDuplicate(phone) {
    const cleanPhone = normalizePhone(phone);

    if (cleanPhone.length < 7) {
      setDuplicateFound(null);
      setDuplicateCheckStatus("idle");
      setError("");
      return;
    }

    try {
      setCheckingDuplicate(true);
      setDuplicateCheckStatus("checking");
      setError("");
      const foundCustomer = findCustomerByPhone(customers, phone);

      if (!isLatestPhone(phone, latestPhoneRef.current)) return;

      if (foundCustomer) {
        setDuplicateFound(foundCustomer);
        setDuplicateCheckStatus("existing");
        setError(getDuplicateCustomerMessage(foundCustomer));
      } else {
        const apiDuplicate = await checkDuplicateCustomer(phone);
        const duplicateCustomer = normalizeDuplicateCustomer(apiDuplicate);

        if (!isLatestPhone(phone, latestPhoneRef.current)) return;

        setDuplicateFound(duplicateCustomer);
        setDuplicateCheckStatus(duplicateCustomer ? "existing" : "new");
        setError(
          duplicateCustomer ? getDuplicateCustomerMessage(duplicateCustomer) : ""
        );
      }
    } catch (err) {
      const foundCustomer = findCustomerByPhone(customers, phone);
      if (!isLatestPhone(phone, latestPhoneRef.current)) return;

      setDuplicateFound(foundCustomer);
      setDuplicateCheckStatus(foundCustomer ? "existing" : "idle");
      setError(foundCustomer ? getDuplicateCustomerMessage(foundCustomer) : "");
    } finally {
      if (isLatestPhone(phone, latestPhoneRef.current)) {
        setCheckingDuplicate(false);
      }
    }
  }

  function handleUseDuplicateCustomer() {
    if (!duplicateFound) return;

    setSaleMode("existing");
    setFormData((prev) => ({
      ...prev,
      Customer_ID: duplicateFound.Customer_ID,
      Customer_Name: duplicateFound.Customer_Name || "",
      Phone: duplicateFound.Phone || "",
      Email: duplicateFound.Email || "",
      Address: duplicateFound.Address || "",
      Google_Map_Link:
        duplicateFound.Google_Map_Link ||
        duplicateFound.Google_Map_Li ||
        "",
      Created_Date: duplicateFound.Created_Date || today,
      Notes: duplicateFound.Notes || "",
    }));
    setDuplicateFound(null);
    setDuplicateCheckStatus("idle");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        ...formData,
      };

      if (saleMode === "new") {
        const existingCustomer =
          duplicateFound || (await findDuplicateCustomer(payload.Phone));

        if (existingCustomer) {
          setDuplicateFound(existingCustomer);
          throw new Error(getDuplicateCustomerMessage(existingCustomer));
        }

        payload.Customer_ID = "";
      }

      if (saleMode === "existing" && !payload.Customer_ID) {
        throw new Error("Please select an existing customer.");
      }

      const result = await addSale(payload);

      setSuccessMessage(
        `Sale recorded successfully — Customer ID: ${result.customerId} · AC ID: ${result.acId}`
      );

      setFormData(emptyForm);
      setSaleMode("new");
      await loadCustomers();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFormData(emptyForm);
    setSaleMode("new");
    setCustomerSearch("");
    setSuccessMessage("");
    setError("");
    setDuplicateFound(null);
    setDuplicateCheckStatus("idle");
    latestPhoneRef.current = "";
  }

  async function findDuplicateCustomer(phone) {
    const foundCustomer = findCustomerByPhone(customers, phone);

    if (foundCustomer) return foundCustomer;

    const apiDuplicate = await checkDuplicateCustomer(phone);
    return normalizeDuplicateCustomer(apiDuplicate);
  }

  const filteredCustomers = getFilteredCustomers(
    customers,
    customerSearch,
    getCustomerIdForSearch,
    getCustomerNameForSearch
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/" className="back-link">
            ← Back to Dashboard
          </Link>
          <h2>Add New Sale</h2>
          <p>
            Register a new customer sale or add another AC unit to an existing
            customer.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">✕</span>
          {error}
        </div>
      )}

      {duplicateFound && (
        <div className="alert alert-warning">
          <div className="alert-content">
            <div className="alert-header">
              <span className="alert-icon">⚠️</span>
              <strong>Customer Already Exists</strong>
            </div>
            <p>
              A customer with phone number <strong>{formData.Phone}</strong>{" "}
              already exists in the system. Use the existing customer record
              instead of creating a duplicate.
            </p>
            <div className="duplicate-customer-info">
              <p>
                <strong>
                  {duplicateFound.Customer_ID} - {duplicateFound.Customer_Name}
                </strong>
              </p>
              <p>{duplicateFound.Phone}</p>
              <p className="text-gray">{duplicateFound.Address || "Address not provided"}</p>
            </div>
            <div className="duplicate-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleUseDuplicateCustomer}
              >
                Use This Customer
              </button>
            </div>
          </div>
        </div>
      )}

      <form className="sale-form" onSubmit={handleSubmit}>
        <div className="sale-mode-card">
          <div>
            <h3>Sale Type</h3>
            <p>Select whether this AC is for a new customer or existing customer.</p>
          </div>

          <div className="sale-mode-actions">
            <button
              type="button"
              className={
                saleMode === "new" ? "sale-mode-btn active" : "sale-mode-btn"
              }
              onClick={() => handleModeChange("new")}
            >
              New Customer
            </button>

            <button
              type="button"
              className={
                saleMode === "existing"
                  ? "sale-mode-btn active"
                  : "sale-mode-btn"
              }
              onClick={() => handleModeChange("existing")}
            >
              Existing Customer
            </button>
          </div>
        </div>

        {saleMode === "existing" && (
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">👥</div>
              <div>
                <h3>Select Existing Customer</h3>
                <p>This AC will be added under the selected customer profile.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Search Customer</label>
                <CustomerSearchSelect
                  customers={customers}
                  query={customerSearch}
                  onQueryChange={setCustomerSearch}
                  onSelectCustomer={selectExistingCustomer}
                  getCustomerId={getCustomerIdForSearch}
                  getCustomerName={getCustomerNameForSearch}
                  disabled={loadingCustomers}
                />
              </div>

              <div className="form-group full-width">
                <label>
                  Customer <span className="required">*</span>
                </label>

                <select
                  name="Customer_ID"
                  value={formData.Customer_ID}
                  onChange={handleCustomerSelect}
                  required
                  disabled={loadingCustomers}
                >
                  <option value="">
                    {loadingCustomers
                      ? "Loading customers..."
                      : "Select customer"}
                  </option>

                  {filteredCustomers.map((customer) => {
                    const customerId = getCustomerIdForSearch(customer);

                    return (
                    <option
                      key={customerId}
                      value={customerId}
                    >
                      {customerId} - {getCustomerNameForSearch(customer)} -{" "}
                      {customer.Phone || "No phone"}
                    </option>
                    );
                  })}
                </select>
              </div>

              {formData.Customer_ID && (
                <div className="selected-customer-box full-width">
                  <p>
                    <strong>Name:</strong> {formData.Customer_Name || "—"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {formData.Phone || "—"}
                  </p>
                  <p>
                    <strong>Address:</strong> {formData.Address || "—"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {saleMode === "new" && (
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">👤</div>
              <div>
                <h3>Customer Details</h3>
                <p>Basic contact and location information.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  Customer Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="Customer_Name"
                  value={formData.Customer_Name}
                  onChange={handleChange}
                  placeholder="e.g. Kasun Perera"
                  required={saleMode === "new"}
                />
              </div>

              <div className="form-group">
                <label>
                  Phone <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="Phone"
                  value={formData.Phone}
                  onChange={handleChange}
                  placeholder="e.g. 077 123 4567"
                  required={saleMode === "new"}
                />
                <PhoneCheckHint status={duplicateCheckStatus} />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleChange}
                  placeholder="e.g. customer@email.com"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="Address"
                  value={formData.Address}
                  onChange={handleChange}
                  placeholder="e.g. No. 12, Galle Road, Colombo"
                />
              </div>

              <div className="form-group">
                <label>Google Map Link</label>
                <input
                  type="text"
                  name="Google_Map_Link"
                  value={formData.Google_Map_Link}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="form-group">
                <label>Created Date</label>
                <input
                  type="date"
                  name="Created_Date"
                  value={formData.Created_Date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}

        <div className="form-card">
          <div className="form-card-header">
            <div className="form-card-icon">❄️</div>
            <div>
              <h3>AC Unit &amp; Sale Details</h3>
              <p>Model, pricing, warranty, and sales channel information.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>
                AC Model <span className="required">*</span>
              </label>
              <input
                type="text"
                name="AC_Model"
                value={formData.AC_Model}
                onChange={handleChange}
                placeholder="e.g. Samsung WindFree 18000 BTU"
                required
              />
            </div>

            <div className="form-group">
              <label>Serial Number</label>
              <input
                type="text"
                name="Serial_Number"
                value={formData.Serial_Number}
                onChange={handleChange}
                placeholder="e.g. SN-2024-00123"
              />
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                name="Quantity"
                value={formData.Quantity}
                onChange={handleChange}
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Price (LKR)</label>
              <input
                type="number"
                name="Price"
                value={formData.Price}
                onChange={handleChange}
                placeholder="e.g. 185000"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Purchase Date</label>
              <input
                type="date"
                name="Purchase_Date"
                value={formData.Purchase_Date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Sales Channel</label>
              <select
                name="Sales_Channel"
                value={formData.Sales_Channel}
                onChange={handleChange}
              >
                <option value="Showroom">Showroom</option>
                <option value="Online">Online</option>
              </select>
            </div>

            <div className="form-group">
              <label>Warranty Start Date</label>
              <input
                type="date"
                name="Warranty_Start_Date"
                value={formData.Warranty_Start_Date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Warranty End Date</label>
              <input
                type="date"
                name="Warranty_End_Date"
                value={formData.Warranty_End_Date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Warranty Status</label>
              <select
                name="Warranty_Status"
                value={formData.Warranty_Status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={loading}
          >
            Clear Form
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || checkingDuplicate || Boolean(duplicateFound)}
          >
            {loading ? (
              <>
                <span className="spinner" /> Saving...
              </>
            ) : saleMode === "existing" ? (
              "Add AC to Customer"
            ) : (
              "Save Sale"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function findCustomerByPhone(customers, phone) {
  const cleanPhone = normalizePhone(phone);

  if (!cleanPhone) return null;

  return (
    customers.find(
      (customer) => normalizePhone(customer.Phone) === cleanPhone
    ) || null
  );
}

function PhoneCheckHint({ status }) {
  if (status === "checking") {
    return (
      <span className="form-hint">
        Searching phone number to check existing customer...
      </span>
    );
  }

  if (status === "existing") {
    return (
      <span className="form-hint form-hint-error">
        Existing customer found for this phone number.
      </span>
    );
  }

  if (status === "new") {
    return (
      <span className="form-hint form-hint-success">
        No existing customer found. This looks like a new customer.
      </span>
    );
  }

  return null;
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

function isLatestPhone(phone, latestPhone) {
  return normalizePhone(phone) === normalizePhone(latestPhone);
}

function normalizeDuplicateCustomer(value) {
  if (!value) return null;

  if (value.exists === false) return null;

  const customer = value.customer || value;

  if (!customer.Customer_ID && !customer.Customer_Name && !customer.Phone) {
    return null;
  }

  return customer;
}

function getDuplicateCustomerMessage(customer) {
  return `Customer already exists with this phone number. Use existing customer ${customer.Customer_ID} instead.`;
}

function getCustomerIdForSearch(customer) {
  return customer.Customer_ID || customer.customer_ID || customer.id || "";
}

function getCustomerNameForSearch(customer) {
  return customer.Customer_Name || customer.name || "Unnamed Customer";
}

export default AddSale;
