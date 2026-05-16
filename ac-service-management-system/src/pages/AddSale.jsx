import { useState } from "react";
import { addSale } from "../api/googleSheetApi";


function AddSale() {
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    Customer_Name: "",
    Phone: "",
    Email: "",
    Address: "",
    Google_Map_Li: "",
    Created_Date: today,
    AC_Model: "",
    Serial_Number: "",
    Quantity: "1",
    Price: "",
    Purchase_Date: today,
    Sales_Channel: "Showroom",
    Warranty_Start_Date: today,
    Warranty_End_Date: "",
    Warranty_Status: "Active",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const result = await addSale(formData);
      setSuccessMessage(
        `Sale recorded successfully — Customer ID: ${result.customerId} · AC ID: ${result.acId}`
      );
      setFormData({
        Customer_Name: "",
        Phone: "",
        Email: "",
        Address: "",
        Google_Map_Li: "",
        Created_Date: today,
        AC_Model: "",
        Serial_Number: "",
        Quantity: "1",
        Price: "",
        Purchase_Date: today,
        Sales_Channel: "Showroom",
        Warranty_Start_Date: today,
        Warranty_End_Date: "",
        Warranty_Status: "Active",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFormData({
      Customer_Name: "",
      Phone: "",
      Email: "",
      Address: "",
      Google_Map_Li: "",
      Created_Date: today,
      AC_Model: "",
      Serial_Number: "",
      Quantity: "1",
      Price: "",
      Purchase_Date: today,
      Sales_Channel: "Showroom",
      Warranty_Start_Date: today,
      Warranty_End_Date: "",
      Warranty_Status: "Active",
    });
    setSuccessMessage("");
    setError("");
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>Add New Sale</h2>
          <p>Register a new customer and the AC unit sold to them.</p>
        </div>
      </div>

      {/* Alerts */}
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

        {/* Section 1 — Customer Details */}
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
              <label>Customer Name <span className="required">*</span></label>
              <input
                type="text"
                name="Customer_Name"
                value={formData.Customer_Name}
                onChange={handleChange}
                placeholder="e.g. Kasun Perera"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone <span className="required">*</span></label>
              <input
                type="text"
                name="Phone"
                value={formData.Phone}
                onChange={handleChange}
                placeholder="e.g. 077 123 4567"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                placeholder="e.g. kasun@email.com"
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
                name="Google_Map_Li"
                value={formData.Google_Map_Li}
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

        {/* Section 2 — AC Unit & Sale Details */}
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
              <label>AC Model <span className="required">*</span></label>
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

        {/* Form Actions */}
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
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Saving...
              </>
            ) : (
              "Save Sale"
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

export default AddSale;