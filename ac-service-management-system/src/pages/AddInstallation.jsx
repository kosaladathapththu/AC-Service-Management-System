import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addInstallation, getAllData } from "../api/googleSheetApi";
import CustomerSearchSelect, {
  getFilteredCustomers,
} from "../components/CustomerSearchSelect";

function AddInstallation() {
  const today = new Date().toISOString().split("T")[0];

  const emptyForm = {
    Customer_ID: "",
    AC_ID: "",
    Installation_Date: today,
    Installation_Type: "In-house",
    Technician_Name: "",
    Outsource_Payment: "",
    Installation_Status: "Pending",
    Free_Service_Count: "3",
    Notes: "",
  };

  const [customers, setCustomers] = useState([]);
  const [acUnits, setAcUnits] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [filteredACUnits, setFilteredACUnits] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");

  const [formData, setFormData] = useState(emptyForm);

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

      const [customersData, acUnitsData, installationsData] = await Promise.all([
        getAllData("customers"),
        getAllData("acUnits"),
        getAllData("installations"),
      ]);

      setCustomers(customersData);
      setAcUnits(acUnitsData);
      setInstallations(installationsData);
    } catch (err) {
      setError(err.message);
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

    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      if (isACUnitAlreadyInInstallation(formData.AC_ID, installations)) {
        setError("This AC unit already has an installation record. Select another AC unit.");
        return;
      }

      const result = await addInstallation(formData);
      setInstallations((previousInstallations) => [
        ...previousInstallations,
        {
          ...formData,
          Installation_ID: result.installationId || result.Installation_ID,
        },
      ]);

      const completedMessage =
        formData.Installation_Status === "Completed"
          ? ` ${formData.Free_Service_Count} free service(s) auto-generated.`
          : "";

      setSuccessMessage(
        `Installation recorded successfully — Installation ID: ${result.installationId}.${completedMessage}`
      );

      setFormData(emptyForm);
      setFilteredACUnits([]);
      setCustomerSearch("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setFormData(emptyForm);
    setFilteredACUnits([]);
    setCustomerSearch("");
    setSuccessMessage("");
    setError("");
  }

  function getCustomerName(customer) {
    return customer.Customer_Name || customer.name || "Unnamed Customer";
  }

  function getCustomerId(customer) {
    return customer.Customer_ID || customer.customer_ID || customer.id || "";
  }

  function selectCustomerById(customerId) {
    const selectedCustomer = customersWithUninstalledACUnits.find(
      (customer) =>
        normalizeValue(getCustomerId(customer)) === normalizeValue(customerId)
    );

    selectCustomer(selectedCustomer, customerId);
  }

  function selectCustomer(customer, customerId = getCustomerId(customer || {})) {
    const customerACUnits = getUninstalledACUnits(acUnits, installations).filter(
      (unit) => normalizeValue(unit.Customer_ID) === normalizeValue(customerId)
    );

    setFilteredACUnits(customerACUnits);
    setFormData((prev) => ({ ...prev, Customer_ID: customerId, AC_ID: "" }));

    if (customer) {
      setCustomerSearch(`${customerId} - ${getCustomerName(customer)}`);
    }
  }

  const uninstalledACUnits = getUninstalledACUnits(acUnits, installations);
  const customersWithUninstalledACUnits = customers.filter((customer) => {
    const customerId = getCustomerId(customer);

    return uninstalledACUnits.some(
      (unit) => normalizeValue(unit.Customer_ID) === normalizeValue(customerId)
    );
  });
  const filteredCustomersWithUninstalledACUnits = getFilteredCustomers(
    customersWithUninstalledACUnits,
    customerSearch,
    getCustomerId,
    getCustomerName
  );
  const selectedCustomer = customersWithUninstalledACUnits.find(
    (customer) =>
      normalizeValue(getCustomerId(customer)) ===
      normalizeValue(formData.Customer_ID)
  );
  const customerOptions = getCustomerOptions(
    filteredCustomersWithUninstalledACUnits,
    selectedCustomer
  );

  if (loadingData) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading form data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/" className="back-link">
            ← Back to Dashboard
          </Link>
          <h2>Add Installation</h2>
          <p>
            Select a customer and AC unit, then fill in the installation details.
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

      <form className="sale-form" onSubmit={handleSubmit}>
        <div className="form-card">
          <div className="form-card-header">
            <div className="form-card-icon">🔗</div>
            <div>
              <h3>Customer &amp; AC Unit</h3>
              <p>Link this installation to an existing customer and their AC unit.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group full-width">
              <label>Search Customer</label>
              <CustomerSearchSelect
                customers={customersWithUninstalledACUnits}
                query={customerSearch}
                onQueryChange={setCustomerSearch}
                onSelectCustomer={selectCustomer}
                getCustomerId={getCustomerId}
                getCustomerName={getCustomerName}
                disabled={loadingData}
              />
            </div>

            <div className="form-group">
              <label>
                Customer <span className="required">*</span>
              </label>
              <select
                name="Customer_ID"
                value={formData.Customer_ID}
                onChange={handleChange}
                required
              >
                <option value="">— Select a customer —</option>
                {customerOptions.map((customer, index) => {
                  const id = getCustomerId(customer);

                  return (
                    <option key={id || index} value={id}>
                      {id} — {getCustomerName(customer)}
                    </option>
                  );
                })}
              </select>
              {customersWithUninstalledACUnits.length === 0 && (
                <span className="form-hint">
                  All available AC units already have installation records.
                </span>
              )}
            </div>

            <div className="form-group">
              <label>
                AC Unit <span className="required">*</span>
              </label>
              <select
                name="AC_ID"
                value={formData.AC_ID}
                onChange={handleChange}
                required
                disabled={!formData.Customer_ID}
              >
                <option value="">
                  {formData.Customer_ID
                    ? "— Select an AC unit —"
                    : "— Select a customer first —"}
                </option>

                {filteredACUnits.map((unit, index) => (
                  <option key={unit.AC_ID || index} value={unit.AC_ID}>
                    {unit.AC_ID} — {unit.AC_Model || "Unknown Model"}
                  </option>
                ))}
              </select>

              {formData.Customer_ID && filteredACUnits.length === 0 && (
                <span className="form-hint">
                  No uninstalled AC units found for this customer.
                </span>
              )}
            </div>

            <div className="form-group">
              <label>
                Installation Date <span className="required">*</span>
              </label>
              <input
                type="date"
                name="Installation_Date"
                value={formData.Installation_Date}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card-header">
            <div className="form-card-icon">🔧</div>
            <div>
              <h3>Installation Details</h3>
              <p>Technician, type, status, free services, and notes.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Installation Type</label>
              <select
                name="Installation_Type"
                value={formData.Installation_Type}
                onChange={handleChange}
              >
                <option value="In-house">In-house</option>
                <option value="Outsourced">Outsourced</option>
              </select>
            </div>

            <div className="form-group">
              <label>Technician Name</label>
              <input
                type="text"
                name="Technician_Name"
                value={formData.Technician_Name}
                onChange={handleChange}
                placeholder="e.g. Amal Perera"
              />
            </div>

            <div className="form-group">
              <label>Outsource Payment (LKR)</label>
              <input
                type="number"
                name="Outsource_Payment"
                value={formData.Outsource_Payment}
                onChange={handleChange}
                min="0"
                placeholder="e.g. 5000"
              />
              <span className="form-hint">
                Leave blank if in-house installation.
              </span>
            </div>

            <div className="form-group">
              <label>Installation Status</label>
              <select
                name="Installation_Status"
                value={formData.Installation_Status}
                onChange={handleChange}
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label>Free Service Count</label>
              <select
                name="Free_Service_Count"
                value={formData.Free_Service_Count}
                onChange={handleChange}
              >
                <option value="1">1 Free Service</option>
                <option value="2">2 Free Services</option>
                <option value="3">3 Free Services</option>
                <option value="4">4 Free Services</option>
              </select>
              <span className="form-hint">
                Services are generated only when status is Completed.
              </span>
            </div>

            <div className="form-group form-group-full">
              <label>Notes</label>
              <textarea
                name="Notes"
                value={formData.Notes}
                onChange={handleChange}
                rows="4"
                placeholder="Add any installation notes, special requirements, or remarks..."
              />
            </div>
          </div>
        </div>

        {formData.Installation_Status === "Completed" && (
          <div className="free-service-preview-card">
            <h3>Auto Service Schedule Preview</h3>
            <p>
              When this installation is saved, the system will auto-create{" "}
              <strong>{formData.Free_Service_Count}</strong> Year 1 free
              service(s).
            </p>
            <p className="free-service-preview-note">
              Schedule pattern: {getServicePreviewText(formData.Free_Service_Count)}
            </p>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={saving}
          >
            Clear Form
          </button>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner" /> Saving...
              </>
            ) : (
              "Save Installation"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function getServicePreviewText(count) {
  if (String(count) === "1") return "+12 months";
  if (String(count) === "2") return "+6 months, +12 months";
  if (String(count) === "3") return "+4 months, +8 months, +12 months";
  if (String(count) === "4") return "+3 months, +6 months, +9 months, +12 months";

  return "+4 months, +8 months, +12 months";
}

function getUninstalledACUnits(acUnits, installations) {
  return acUnits.filter(
    (unit) => !isACUnitAlreadyInInstallation(unit.AC_ID, installations)
  );
}

function isACUnitAlreadyInInstallation(acId, installations) {
  const cleanAcId = normalizeValue(acId);
  if (!cleanAcId) return false;

  return installations.some((installation) => {
    const installationStatus = normalizeValue(installation.Installation_Status);

    return (
      normalizeValue(installation.AC_ID) === cleanAcId &&
      installationStatus !== "cancelled"
    );
  });
}

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
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

export default AddInstallation;
