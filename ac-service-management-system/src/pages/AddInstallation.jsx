import { useEffect, useState } from "react";
import { addInstallation, getAllData } from "../api/googleSheetApi";

function AddInstallation() {
  const today = new Date().toISOString().split("T")[0];

  const [customers, setCustomers] = useState([]);
  const [acUnits, setAcUnits] = useState([]);
  const [filteredACUnits, setFilteredACUnits] = useState([]);

  const [formData, setFormData] = useState({
    Customer_ID: "",
    AC_ID: "",
    Installation_Date: today,
    Installation_Type: "In-house",
    Technician_Name: "",
    Outsource_Payment: "",
    Installation_Status: "Pending",
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
      const customerACUnits = acUnits.filter(
        (unit) => String(unit.Customer_ID).trim() === String(value).trim()
      );

      setFilteredACUnits(customerACUnits);

      setFormData((previousData) => ({
        ...previousData,
        Customer_ID: value,
        AC_ID: "",
      }));

      return;
    }

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const result = await addInstallation(formData);

      setSuccessMessage(
        `Installation added successfully. Installation ID: ${result.installationId}`
      );

      setFormData({
        Customer_ID: "",
        AC_ID: "",
        Installation_Date: today,
        Installation_Type: "In-house",
        Technician_Name: "",
        Outsource_Payment: "",
        Installation_Status: "Pending",
        Notes: "",
      });

      setFilteredACUnits([]);
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

  if (loadingData) {
    return <p>Loading form data...</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Add Installation</h2>
        <p>Select customer and AC unit, then add installation details.</p>
      </div>

      {successMessage && <p className="success-text">{successMessage}</p>}
      {error && <p className="error-text">Error: {error}</p>}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Linked Customer & AC Unit</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Customer *</label>
              <select
                name="Customer_ID"
                value={formData.Customer_ID}
                onChange={handleChange}
                required
              >
                <option value="">Select customer</option>

                {customers.map((customer, index) => {
                  const customerId = getCustomerId(customer);

                  return (
                    <option key={customerId || index} value={customerId}>
                      {customerId} - {getCustomerName(customer)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label>AC Unit *</label>
              <select
                name="AC_ID"
                value={formData.AC_ID}
                onChange={handleChange}
                required
                disabled={!formData.Customer_ID}
              >
                <option value="">
                  {formData.Customer_ID
                    ? "Select AC unit"
                    : "Select customer first"}
                </option>

                {filteredACUnits.map((unit, index) => (
                  <option key={unit.AC_ID || index} value={unit.AC_ID}>
                    {unit.AC_ID} - {unit.AC_Model || "Unknown Model"}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Installation Date *</label>
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

        <div className="form-section">
          <h3>Installation Details</h3>

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
                placeholder="e.g. Amal"
              />
            </div>

            <div className="form-group">
              <label>Outsource Payment</label>
              <input
                type="number"
                name="Outsource_Payment"
                value={formData.Outsource_Payment}
                onChange={handleChange}
                min="0"
                placeholder="e.g. 5000"
              />
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

            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                name="Notes"
                value={formData.Notes}
                onChange={handleChange}
                rows="4"
                placeholder="Add installation notes..."
              ></textarea>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Installation"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddInstallation;