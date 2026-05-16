import { useEffect, useState } from "react";
import { addService, getAllData } from "../api/googleSheetApi";

function AddService() {
  const today = new Date().toISOString().split("T")[0];

  const [customers, setCustomers] = useState([]);
  const [acUnits, setAcUnits] = useState([]);
  const [filteredACUnits, setFilteredACUnits] = useState([]);

  const [formData, setFormData] = useState({
    Customer_ID: "",
    AC_ID: "",
    Service_Date: today,
    Service_Year: "Year 1",
    Service_No: "1",
    Service_Type: "Free",
    Service_Category: "Normal",
    Technician_Name: "",
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

    if (name === "Service_Type") {
      setFormData((previousData) => ({
        ...previousData,
        Service_Type: value,
        Payment_Required: value === "Paid" ? "Yes" : "No",
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

      const result = await addService(formData);

      setSuccessMessage(
        `Service added successfully. Service ID: ${result.serviceId}`
      );

      setFormData({
        Customer_ID: "",
        AC_ID: "",
        Service_Date: today,
        Service_Year: "Year 1",
        Service_No: "1",
        Service_Type: "Free",
        Service_Category: "Normal",
        Technician_Name: "",
        Service_Status: "Pending",
        Payment_Required: "No",
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
    <div className="page-content add-service-page">
      <div className="page-header">
        <h2>Add Service</h2>
        <p>Select customer and AC unit, then add service schedule details.</p>
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
              <label>Service Date *</label>
              <input
                type="date"
                name="Service_Date"
                value={formData.Service_Date}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Service Details</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Service Year</label>
              <select
                name="Service_Year"
                value={formData.Service_Year}
                onChange={handleChange}
              >
                <option value="Year 1">Year 1</option>
                <option value="Year 2">Year 2</option>
                <option value="Year 3">Year 3</option>
                <option value="Year 4">Year 4</option>
                <option value="Year 5">Year 5</option>
              </select>
            </div>

            <div className="form-group">
              <label>Service No</label>
              <select
                name="Service_No"
                value={formData.Service_No}
                onChange={handleChange}
              >
                <option value="1">Service 1</option>
                <option value="2">Service 2</option>
                <option value="3">Service 3</option>
                <option value="4">Service 4</option>
              </select>
            </div>

            <div className="form-group">
              <label>Service Type</label>
              <select
                name="Service_Type"
                value={formData.Service_Type}
                onChange={handleChange}
              >
                <option value="Free">Free</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div className="form-group">
              <label>Service Category</label>
              <select
                name="Service_Category"
                value={formData.Service_Category}
                onChange={handleChange}
              >
                <option value="Normal">Normal</option>
                <option value="High-pressure">High-pressure</option>
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
              <label>Service Status</label>
              <select
                name="Service_Status"
                value={formData.Service_Status}
                onChange={handleChange}
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label>Payment Required</label>
              <select
                name="Payment_Required"
                value={formData.Payment_Required}
                onChange={handleChange}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                name="Notes"
                value={formData.Notes}
                onChange={handleChange}
                rows="4"
                placeholder="Add service notes..."
              ></textarea>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Service"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddService;