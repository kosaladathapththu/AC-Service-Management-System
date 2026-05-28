import { useEffect, useState } from "react";
import { addPayment, getAllData } from "../api/googleSheetApi";
import { cachePaymentEvidence } from "../utils/paymentEvidenceStore";

function AddPayment() {
  const today = new Date().toISOString().split("T")[0];

  const emptyForm = {
    Customer_ID: "",
    AC_ID: "",
    Payment_Year: "Year 2",
    Payment_Date: today,
    Amount: "",
    Payment_Type: "Annual Service",
    Payment_Status: "Paid",
    Due_Date: today,
    Annual_Service_Count: "3",
    Notes: "",
    Payment_Evidence_Method: "link", // 'link' or 'file'
    Payment_Evidence_Link: "",
    Payment_Evidence_File_Name: "",
    Payment_Evidence_File_Data: "",
    Payment_Evidence_File_Data_URL: "",
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

    if (name === "Payment_Type") {
      setFormData((previousData) => ({
        ...previousData,
        Payment_Type: value,
        Annual_Service_Count:
          value === "Annual Service" ? previousData.Annual_Service_Count || "3" : "",
      }));

      return;
    }

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  function handleFileChange(event) {
    const file = event.target.files && event.target.files[0];

    if (!file) {
      // clear file fields
      setFormData((prev) => ({
        ...prev,
        Payment_Evidence_File_Name: "",
        Payment_Evidence_File_Data: "",
      }));

      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || ""; // data:[mime];base64,xxxxx
      const base64 = (result.split(",")[1] || "");

      setFormData((prev) => ({
        ...prev,
        Payment_Evidence_File_Name: file.name,
        Payment_Evidence_File_Data: base64,
        Payment_Evidence_File_Data_URL: result,
      }));
    };

    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const result = await addPayment(formData);
      cachePaymentEvidence(result.paymentId || result.Payment_ID, formData);

      const annualMessage =
        formData.Payment_Type === "Annual Service" &&
        formData.Payment_Status === "Paid"
          ? ` ${formData.Annual_Service_Count} annual service(s) will be generated.`
          : "";

      setSuccessMessage(
        `Payment added successfully. Payment ID: ${result.paymentId}.${annualMessage}`
      );

      setFormData(emptyForm);
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

            {formData.Payment_Type === "Annual Service" && (
              <div className="form-group">
                <label>Annual Service Count</label>
                <select
                  name="Annual_Service_Count"
                  value={formData.Annual_Service_Count}
                  onChange={handleChange}
                >
                  <option value="1">1 Service</option>
                  <option value="2">2 Services</option>
                  <option value="3">3 Services</option>
                  <option value="4">4 Services</option>
                </select>
                <span className="form-hint">
                  Services generate only when annual payment is Paid.
                </span>
              </div>
            )}

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

        <div className="form-section">
          <h3>Payment Evidence</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Evidence Method</label>
              <select
                name="Payment_Evidence_Method"
                value={formData.Payment_Evidence_Method}
                onChange={handleChange}
              >
                <option value="link">Google Drive / Link</option>
                <option value="file">Upload File</option>
              </select>
            </div>

            {formData.Payment_Evidence_Method === "link" && (
              <div className="form-group full-width">
                <label>Evidence Link</label>
                <input
                  type="url"
                  name="Payment_Evidence_Link"
                  value={formData.Payment_Evidence_Link}
                  onChange={handleChange}
                  placeholder="https://drive.google.com/..."
                />
                <span className="form-hint">Paste a Google Drive share link or any file URL.</span>
                {formData.Payment_Evidence_Link && (
                  <div className="evidence-preview">
                    <label>Preview</label>
                    <div>
                      <a href={formData.Payment_Evidence_Link} target="_blank" rel="noreferrer">Open evidence link</a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {formData.Payment_Evidence_Method === "file" && (
              <div className="form-group full-width">
                <label>Upload File</label>
                <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
                {formData.Payment_Evidence_File_Name && (
                  <span className="form-hint">Selected: {formData.Payment_Evidence_File_Name}</span>
                )}
                <span className="form-hint">Files are encoded and sent with the payment record.</span>

                {formData.Payment_Evidence_File_Data_URL && (
                  <div className="evidence-preview">
                    <label>Preview</label>
                    <div>
                      {String(formData.Payment_Evidence_File_Data_URL).startsWith("data:image") ? (
                        <img
                          src={formData.Payment_Evidence_File_Data_URL}
                          alt={formData.Payment_Evidence_File_Name}
                          style={{ maxWidth: "240px", maxHeight: "160px", display: "block", marginTop: "6px" }}
                        />
                      ) : (
                        <a href={formData.Payment_Evidence_File_Data_URL} download={formData.Payment_Evidence_File_Name}>
                          Download {formData.Payment_Evidence_File_Name}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {formData.Payment_Type === "Annual Service" &&
          formData.Payment_Status === "Paid" && (
            <div className="annual-service-preview-card">
              <h3>Annual Service Schedule Preview</h3>
              <p>
                When this payment is saved, the system will auto-create{" "}
                <strong>{formData.Annual_Service_Count}</strong> paid annual
                service(s) for <strong>{formData.Payment_Year}</strong>.
              </p>
              <p className="annual-service-preview-note">
                Schedule pattern:{" "}
                {getServicePreviewText(formData.Annual_Service_Count)}
              </p>
            </div>
          )}

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Payment"}
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

export default AddPayment;
