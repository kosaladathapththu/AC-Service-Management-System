import { useEffect, useState } from "react";
import { addService, getAllData } from "../api/googleSheetApi";
import CustomerSearchSelect, {
  getFilteredCustomers,
} from "../components/CustomerSearchSelect";

function AddService() {
  const today = new Date().toISOString().split("T")[0];

  const [customers, setCustomers] = useState([]);
  const [acUnits, setAcUnits] = useState([]);
  const [filteredACUnits, setFilteredACUnits] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");

  const [formData, setFormData] = useState({
    Customer_ID: "",
    AC_ID: "",
    Service_Date: today,
    Service_Year: "Year 1",
    Service_No: "1",
    Service_Type: "Free",
    Service_Category: "Normal",
    Technician_Name: "",
    Technician_Type: "In-house",
    Technician_Payment: "",
    Service_Status: "Pending",
    Payment_Required: "No",
    Notes: "",
  });

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoadingData(true);
      setError("");
      const customersData = await getAllData("customers");
      const acUnitsData = await getAllData("acUnits");
      setCustomers(customersData);
      setAcUnits(acUnitsData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingData(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "Customer_ID") {
      selectCustomerById(value);
      return;
    }

    if (name === "Service_Type") {
      setFormData((prev) => ({
        ...prev,
        Service_Type: value,
        Payment_Required: value === "Paid" ? "Yes" : "No",
      }));
      return;
    }

    if (name === "Technician_Type" && value !== "Outsourced") {
      setFormData((prev) => ({
        ...prev,
        Technician_Type: value,
        Technician_Payment: "",
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");
      const result = await addService(formData);
      setSuccessMessage(`Service added successfully. Service ID: ${result.serviceId}`);
      setFormData({
        Customer_ID: "",
        AC_ID: "",
        Service_Date: today,
        Service_Year: "Year 1",
        Service_No: "1",
        Service_Type: "Free",
        Service_Category: "Normal",
        Technician_Name: "",
        Technician_Type: "In-house",
        Technician_Payment: "",
        Service_Status: "Pending",
        Payment_Required: "No",
        Notes: "",
      });
      setFilteredACUnits([]);
      setCustomerSearch("");
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  function getCustomerName(customer) {
    return customer.Customer_Name || customer.name || "Unnamed Customer";
  }

  function getCustomerId(customer) {
    return customer.Customer_ID || customer.customer_ID || customer.id || "";
  }

  function selectCustomerById(customerId) {
    const selectedCustomer = customers.find(
      (customer) => normalizeValue(getCustomerId(customer)) === normalizeValue(customerId)
    );

    selectCustomer(selectedCustomer, customerId);
  }

  function selectCustomer(customer, customerId = getCustomerId(customer || {})) {
    const customerACUnits = acUnits.filter(
      (unit) => normalizeValue(unit.Customer_ID) === normalizeValue(customerId)
    );

    setFilteredACUnits(customerACUnits);
    setFormData((prev) => ({ ...prev, Customer_ID: customerId, AC_ID: "" }));

    if (customer) {
      setCustomerSearch(`${customerId} - ${getCustomerName(customer)}`);
    }
  }

  if (loadingData) return <p>Loading form data...</p>;

  const selectedCustomer = customers.find(
    (c) => normalizeValue(getCustomerId(c)) === normalizeValue(formData.Customer_ID)
  );
  const selectedAC = filteredACUnits.find(
    (u) => String(u.AC_ID) === String(formData.AC_ID)
  );
  const filteredCustomers = getFilteredCustomers(
    customers,
    customerSearch,
    getCustomerId,
    getCustomerName
  );
  const customerOptions = getCustomerOptions(filteredCustomers, selectedCustomer);

  return (
    <div className="add-form-page">
      <div className="page-header">
        <h2>Add Service</h2>
        <p>Select a customer and AC unit, then fill in the service details.</p>
      </div>

      {successMessage && <p className="success-text">{successMessage}</p>}
      {error && <p className="error-text">Error: {error}</p>}

      <form onSubmit={handleSubmit}>

        {/* ── Section 1: Link ── */}
        <div className="add-form-section">
          <div className="add-form-section-title">
            <span className="add-form-section-num">1</span>
            Customer &amp; AC Unit
          </div>

          <div className="add-form-grid">
            <div className="form-group full-width">
              <label>Search Customer</label>
              <CustomerSearchSelect
                customers={customers}
                query={customerSearch}
                onQueryChange={setCustomerSearch}
                onSelectCustomer={selectCustomer}
                getCustomerId={getCustomerId}
                getCustomerName={getCustomerName}
                disabled={loadingData}
              />
            </div>

            <div className="form-group">
              <label>Customer <span className="required">*</span></label>
              <select name="Customer_ID" value={formData.Customer_ID} onChange={handleChange} required>
                <option value="">Select customer</option>
                {customerOptions.map((customer, index) => {
                  const cid = getCustomerId(customer);
                  return (
                    <option key={cid || index} value={cid}>
                      {cid} — {getCustomerName(customer)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label>AC Unit <span className="required">*</span></label>
              <select name="AC_ID" value={formData.AC_ID} onChange={handleChange} required disabled={!formData.Customer_ID}>
                <option value="">
                  {formData.Customer_ID ? "Select AC unit" : "Select customer first"}
                </option>
                {filteredACUnits.map((unit, index) => (
                  <option key={unit.AC_ID || index} value={unit.AC_ID}>
                    {unit.AC_ID} — {unit.AC_Model || "Unknown Model"}
                  </option>
                ))}
              </select>
              {formData.Customer_ID && filteredACUnits.length === 0 && (
                <span className="form-hint">No AC units found for this customer.</span>
              )}
            </div>

            <div className="form-group">
              <label>Service Date <span className="required">*</span></label>
              <input type="date" name="Service_Date" value={formData.Service_Date} onChange={handleChange} required />
            </div>
          </div>

          {/* Selection summary */}
          {(selectedCustomer || selectedAC) && (
            <div className="add-form-summary">
              {selectedCustomer && (
                <div className="add-form-summary-item">
                  <span className="add-form-summary-label">Customer</span>
                  <span className="add-form-summary-value">
                    {getCustomerName(selectedCustomer)}
                    {selectedCustomer.Phone && <span className="add-form-summary-sub"> · {selectedCustomer.Phone}</span>}
                  </span>
                </div>
              )}
              {selectedAC && (
                <div className="add-form-summary-item">
                  <span className="add-form-summary-label">AC Unit</span>
                  <span className="add-form-summary-value">
                    {selectedAC.AC_Model || "—"}
                    {selectedAC.Serial_Number && <span className="add-form-summary-sub"> · S/N: {selectedAC.Serial_Number}</span>}
                    {selectedAC.Warranty_Status && (
                      <span className={`status-badge ${getWarrantyClass(selectedAC.Warranty_Status)}`} style={{ marginLeft: "8px" }}>
                        {selectedAC.Warranty_Status}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Section 2: Service Details ── */}
        <div className="add-form-section">
          <div className="add-form-section-title">
            <span className="add-form-section-num">2</span>
            Service Details
          </div>

          <div className="add-form-grid">
            <div className="form-group">
              <label>Service Year</label>
              <select name="Service_Year" value={formData.Service_Year} onChange={handleChange}>
                <option value="Year 1">Year 1</option>
                <option value="Year 2">Year 2</option>
                <option value="Year 3">Year 3</option>
                <option value="Year 4">Year 4</option>
                <option value="Year 5">Year 5</option>
              </select>
            </div>

            <div className="form-group">
              <label>Service No</label>
              <select name="Service_No" value={formData.Service_No} onChange={handleChange}>
                <option value="1">Service 1</option>
                <option value="2">Service 2</option>
                <option value="3">Service 3</option>
                <option value="4">Service 4</option>
              </select>
            </div>

            <div className="form-group">
              <label>Service Type</label>
              <select name="Service_Type" value={formData.Service_Type} onChange={handleChange}>
                <option value="Free">Free</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div className="form-group">
              <label>Service Category</label>
              <select name="Service_Category" value={formData.Service_Category} onChange={handleChange}>
                <option value="Normal">Normal</option>
                <option value="High-pressure">High-pressure</option>
              </select>
            </div>

            <div className="form-group">
              <label>Technician Name</label>
              <input type="text" name="Technician_Name" value={formData.Technician_Name} onChange={handleChange} placeholder="e.g. Amal" />
            </div>

            <div className="form-group">
              <label>Technician Type</label>
              <select
                name="Technician_Type"
                value={formData.Technician_Type}
                onChange={handleChange}
              >
                <option value="In-house">In-house</option>
                <option value="Outsourced">Outsourced</option>
              </select>
              <span className="form-hint">
                In-house technicians do not need a technician payment.
              </span>
            </div>

            <div className="form-group">
              <label>Technician Payment (LKR)</label>
              <input
                type="number"
                name="Technician_Payment"
                value={formData.Technician_Payment}
                onChange={handleChange}
                min="0"
                placeholder="e.g. 2000"
                disabled={formData.Technician_Type !== "Outsourced"}
              />
              <span className="form-hint">
                Enter only when the service technician is outsourced.
              </span>
            </div>

            <div className="form-group">
              <label>Service Status</label>
              <select name="Service_Status" value={formData.Service_Status} onChange={handleChange}>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label>Payment Required</label>
              <select name="Payment_Required" value={formData.Payment_Required} onChange={handleChange}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              {formData.Service_Type === "Paid" && (
                <span className="form-hint">Auto-set to Yes for Paid services.</span>
              )}
            </div>

            <div className="form-group full-width">
              <label>Notes</label>
              <textarea name="Notes" value={formData.Notes} onChange={handleChange} rows="3" placeholder="Add any service notes..."></textarea>
            </div>
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="add-form-footer">
          <button type="submit" className="add-form-submit" disabled={saving}>
            {saving ? "Saving..." : "Save Service"}
          </button>
        </div>
      </form>
    </div>
  );
}

function getWarrantyClass(status) {
  if (!status) return "";
  const v = String(status).toLowerCase();
  if (v === "active") return "status-active";
  if (v === "expired") return "status-expired";
  if (v === "cancelled") return "status-cancelled";
  return "";
}

function getCustomerOptions(filteredCustomers, selectedCustomer) {
  if (!selectedCustomer) return filteredCustomers;

  const selectedId = normalizeValue(
    selectedCustomer.Customer_ID || selectedCustomer.customer_ID || selectedCustomer.id
  );
  const hasSelectedCustomer = filteredCustomers.some(
    (customer) =>
      normalizeValue(customer.Customer_ID || customer.customer_ID || customer.id) ===
      selectedId
  );

  return hasSelectedCustomer
    ? filteredCustomers
    : [selectedCustomer, ...filteredCustomers];
}

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

export default AddService;
