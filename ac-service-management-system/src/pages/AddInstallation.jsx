import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addInstallation, getAllData } from "../api/googleSheetApi";

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
  const [filteredACUnits, setFilteredACUnits] = useState([]);

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

      const customersData = await getAllData("customers");
      const acUnitsData = await getAllData("acUnits");

      setCustomers(customersData);
      setAcUnits(acUnitsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "Customer_ID") {
      const customerACUnits = acUnits.filter(
        (unit) => String(unit.Customer_ID).trim() === String(value).trim()
      );

      setFilteredACUnits(customerACUnits);
      setFormData((prev) => ({ ...prev, Customer_ID: value, AC_ID: "" }));
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

      const result = await addInstallation(formData);

      const completedMessage =
        formData.Installation_Status === "Completed"
          ? ` ${formData.Free_Service_Count} free service(s) auto-generated.`
          : "";

      setSuccessMessage(
        `Installation recorded successfully — Installation ID: ${result.installationId}.${completedMessage}`
      );

      setFormData(emptyForm);
      setFilteredACUnits([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setFormData(emptyForm);
    setFilteredACUnits([]);
    setSuccessMessage("");
    setError("");
  }

  function getCustomerName(customer) {
    return customer.Customer_Name || customer.name || "Unnamed Customer";
  }

  function getCustomerId(customer) {
    return customer.Customer_ID || customer.customer_ID || customer.id || "";
  }

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
                {customers.map((customer, index) => {
                  const id = getCustomerId(customer);

                  return (
                    <option key={id || index} value={id}>
                      {id} — {getCustomerName(customer)}
                    </option>
                  );
                })}
              </select>
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
                  No AC units found for this customer.
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

export default AddInstallation;