import { useEffect, useState } from "react";
import { addComplaint, getAllData } from "../api/googleSheetApi";
import CustomerSearchSelect, {
  getFilteredCustomers,
} from "../components/CustomerSearchSelect";

function AddComplaint() {
  const today = new Date().toISOString().split("T")[0];

  const [customers, setCustomers] = useState([]);
  const [acUnits, setAcUnits] = useState([]);
  const [filteredACUnits, setFilteredACUnits] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");

  const [formData, setFormData] = useState({
    Customer_ID: "",
    AC_ID: "",
    Complaint_Date: today,
    Issue_Description: "",
    Technician_Name: "",
    Action_Taken: "",
    Cost_Type: "Free",
    Cost_Amount: "",
    Complaint_Status: "Open",
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

    if (name === "Cost_Type") {
      setFormData((previousData) => ({
        ...previousData,
        Cost_Type: value,
        Cost_Amount: value === "Free" ? "" : previousData.Cost_Amount,
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

      const result = await addComplaint(formData);

      setSuccessMessage(
        `Complaint added successfully. Complaint ID: ${result.complaintId}`
      );

      setFormData({
        Customer_ID: "",
        AC_ID: "",
        Complaint_Date: today,
        Issue_Description: "",
        Technician_Name: "",
        Action_Taken: "",
        Cost_Type: "Free",
        Cost_Amount: "",
        Complaint_Status: "Open",
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
      (customer) =>
        normalizeValue(getCustomerId(customer)) === normalizeValue(customerId)
    );

    selectCustomer(selectedCustomer, customerId);
  }

  function selectCustomer(customer, customerId = getCustomerId(customer || {})) {
    const customerACUnits = acUnits.filter(
      (unit) => normalizeValue(unit.Customer_ID) === normalizeValue(customerId)
    );

    setFilteredACUnits(customerACUnits);

    setFormData((previousData) => ({
      ...previousData,
      Customer_ID: customerId,
      AC_ID: "",
    }));

    if (customer) {
      setCustomerSearch(`${customerId} - ${getCustomerName(customer)}`);
    }
  }

  if (loadingData) {
    return <p>Loading form data...</p>;
  }

  const filteredCustomers = getFilteredCustomers(
    customers,
    customerSearch,
    getCustomerId,
    getCustomerName
  );
  const selectedCustomer = customers.find(
    (customer) =>
      normalizeValue(getCustomerId(customer)) ===
      normalizeValue(formData.Customer_ID)
  );
  const customerOptions = getCustomerOptions(filteredCustomers, selectedCustomer);

  return (
  <div className="page-content add-complaint-page">
      <div className="page-header">
        <h2>Add Complaint</h2>
        <p>Add customer complaint and repair action details.</p>
      </div>

      {successMessage && <p className="success-text">{successMessage}</p>}
      {error && <p className="error-text">Error: {error}</p>}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Linked Customer & AC Unit</h3>

          <div className="form-grid">
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
              <label>Customer *</label>
              <select
                name="Customer_ID"
                value={formData.Customer_ID}
                onChange={handleChange}
                required
              >
                <option value="">Select customer</option>

                {customerOptions.map((customer, index) => {
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
              <label>Complaint Date *</label>
              <input
                type="date"
                name="Complaint_Date"
                value={formData.Complaint_Date}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Complaint Details</h3>

          <div className="form-grid">
            <div className="form-group full-width">
              <label>Issue Description *</label>
              <textarea
                name="Issue_Description"
                value={formData.Issue_Description}
                onChange={handleChange}
                rows="4"
                required
                placeholder="Example: AC is not cooling properly"
              ></textarea>
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
              <label>Cost Type</label>
              <select
                name="Cost_Type"
                value={formData.Cost_Type}
                onChange={handleChange}
              >
                <option value="Free">Free</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div className="form-group">
              <label>Cost Amount</label>
              <input
                type="number"
                name="Cost_Amount"
                value={formData.Cost_Amount}
                onChange={handleChange}
                min="0"
                disabled={formData.Cost_Type === "Free"}
                placeholder="e.g. 3500"
              />
            </div>

            <div className="form-group">
              <label>Complaint Status</label>
              <select
                name="Complaint_Status"
                value={formData.Complaint_Status}
                onChange={handleChange}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Action Taken</label>
              <textarea
                name="Action_Taken"
                value={formData.Action_Taken}
                onChange={handleChange}
                rows="3"
                placeholder="Example: Checked gas level and cleaned filter"
              ></textarea>
            </div>

            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                name="Notes"
                value={formData.Notes}
                onChange={handleChange}
                rows="3"
                placeholder="Add extra complaint notes..."
              ></textarea>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Complaint"}
          </button>
        </div>
      </form>
    </div>
  );
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

export default AddComplaint;
