import { useEffect, useState } from "react";
import { addPayment, getAllData } from "../api/googleSheetApi";

function AddPayment() {
  const today = new Date().toISOString().split("T")[0];

  const [customers, setCustomers] = useState([]);
  const [acUnits, setAcUnits] = useState([]);
  const [filteredACUnits, setFilteredACUnits] = useState([]);

  const [formData, setFormData] = useState({
    Customer_ID: "",
    AC_ID: "",
    Payment_Year: "Year 2",
    Payment_Date: today,
    Amount: "",
    Payment_Type: "Annual Service",
    Payment_Status: "Paid",
    Due_Date: today,
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

    if (name === "Payment_Status") {
      setFormData((previousData) => ({
        ...previousData,
        Payment_Status: value,
        Payment_Date: value === "Pending" ? "" : today,
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

      const result = await addPayment(formData);

      setSuccessMessage(
        `Payment added successfully. Payment ID: ${result.paymentId}`
      );

      setFormData({
        Customer_ID: "",
        AC_ID: "",
        Payment_Year: "Year 2",
        Payment_Date: today,
        Amount: "",
        Payment_Type: "Annual Service",
        Payment_Status: "Paid",
        Due_Date: today,
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
  <div className="page-content add-payment-page">
      <div className="page-header">
        <h2>Add Payment</h2>
        <p>Add annual service, repair, or installation payment details.</p>
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
              <label>Payment Year</label>
              <select
                name="Payment_Year"
                value={formData.Payment_Year}
                onChange={handleChange}
              >
                <option value="">Not applicable</option>
                <option value="Year 1">Year 1</option>
                <option value="Year 2">Year 2</option>
                <option value="Year 3">Year 3</option>
                <option value="Year 4">Year 4</option>
                <option value="Year 5">Year 5</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Payment Details</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Payment Type</label>
              <select
                name="Payment_Type"
                value={formData.Payment_Type}
                onChange={handleChange}
              >
                <option value="Annual Service">Annual Service</option>
                <option value="Repair">Repair</option>
                <option value="Installation">Installation</option>
              </select>
            </div>

            <div className="form-group">
              <label>Amount *</label>
              <input
                type="number"
                name="Amount"
                value={formData.Amount}
                onChange={handleChange}
                min="0"
                required
                placeholder="e.g. 12000"
              />
            </div>

            <div className="form-group">
              <label>Payment Status</label>
              <select
                name="Payment_Status"
                value={formData.Payment_Status}
                onChange={handleChange}
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div className="form-group">
              <label>Payment Date</label>
              <input
                type="date"
                name="Payment_Date"
                value={formData.Payment_Date}
                onChange={handleChange}
                disabled={formData.Payment_Status === "Pending"}
              />
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                name="Due_Date"
                value={formData.Due_Date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                name="Notes"
                value={formData.Notes}
                onChange={handleChange}
                rows="4"
                placeholder="Add payment notes..."
              ></textarea>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddPayment;