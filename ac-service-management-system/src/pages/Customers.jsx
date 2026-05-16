import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllData, updateRecord } from "../api/googleSheetApi";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({
    Customer_Name: "",
    Phone: "",
    Email: "",
    Address: "",
    Google_Map_Link: "",
    Created_Date: "",
    Notes: "",
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllData("customers");
      setCustomers(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(customer) {
    setEditingCustomer(customer);

    setEditFormData({
      Customer_Name: customer.Customer_Name || "",
      Phone: customer.Phone || "",
      Email: customer.Email || "",
      Address: customer.Address || "",
      Google_Map_Link:
        customer.Google_Map_Link || customer.Google_Map_Li || "",
      Created_Date: formatDateForInput(customer.Created_Date),
      Notes: customer.Notes || "",
    });
  }

  function closeEditModal() {
    setEditingCustomer(null);

    setEditFormData({
      Customer_Name: "",
      Phone: "",
      Email: "",
      Address: "",
      Google_Map_Link: "",
      Created_Date: "",
      Notes: "",
    });
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleUpdateCustomer(event) {
    event.preventDefault();

    if (!editingCustomer) return;

    const customerId = getValue(editingCustomer, [
      "Customer_ID",
      "customer_ID",
      "Customer ID",
      "id",
    ]);

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await updateRecord("customers", "Customer_ID", customerId, editFormData);

      setSuccessMessage("Customer updated successfully.");
      closeEditModal();
      await loadCustomers();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  function getValue(row, keys) {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
        return row[key];
      }
    }

    return "-";
  }

  if (loading) return <p>Loading customers...</p>;
  if (error) return <p className="error-text">Error: {error}</p>;

  return (
    <div>
      <div className="page-header">
        <h2>Customers</h2>
        <p>Manage all customer records.</p>
      </div>

      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>Google Map</th>
              <th>Created Date</th>
              <th>Notes</th>
              <th>Profile</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer, index) => {
              const customerId = getValue(customer, [
                "Customer_ID",
                "customer_ID",
                "Customer ID",
                "id",
              ]);

              const customerName = getValue(customer, [
                "Customer_Name",
                "Customer Name",
                "name",
              ]);

              const phone = getValue(customer, ["Phone", "phone"]);
              const email = getValue(customer, ["Email", "email"]);
              const address = getValue(customer, ["Address", "address"]);

              const googleMapLink = getValue(customer, [
                "Google_Map_Link",
                "Google_Map_Li",
                "Google Map Link",
                "googleMapLink",
              ]);

              const createdDate = getValue(customer, [
                "Created_Date",
                "Created Date",
                "createdDate",
              ]);

              const notes = getValue(customer, ["Notes", "notes"]);

              return (
                <tr key={customerId !== "-" ? customerId : index}>
                  <td>{customerId}</td>
                  <td>{customerName}</td>
                  <td>{phone}</td>
                  <td>{email}</td>
                  <td>{address}</td>
                  <td>
                    {googleMapLink !== "-" ? (
                      <a
                        href={googleMapLink}
                        target="_blank"
                        rel="noreferrer"
                        className="view-link"
                      >
                        Open
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{formatDate(createdDate)}</td>
                  <td>{notes}</td>
                  <td>
                    {customerId !== "-" ? (
                      <Link
                        className="view-link"
                        to={`/customers/${customerId}`}
                      >
                        View
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => openEditModal(customer)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {customers.length === 0 && <p>No customers found.</p>}
      </div>

      {editingCustomer && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Customer</h3>
              <button className="close-btn" onClick={closeEditModal}>
                ×
              </button>
            </div>

            <p className="modal-subtitle">
              Customer ID:{" "}
              <strong>
                {getValue(editingCustomer, [
                  "Customer_ID",
                  "customer_ID",
                  "Customer ID",
                  "id",
                ])}
              </strong>
            </p>

            <form onSubmit={handleUpdateCustomer}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    name="Customer_Name"
                    value={editFormData.Customer_Name}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="Phone"
                    value={editFormData.Phone}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="Email"
                    value={editFormData.Email}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Created Date</label>
                  <input
                    type="date"
                    name="Created_Date"
                    value={editFormData.Created_Date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    name="Address"
                    value={editFormData.Address}
                    onChange={handleEditChange}
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group full-width">
                  <label>Google Map Link</label>
                  <input
                    type="text"
                    name="Google_Map_Link"
                    value={editFormData.Google_Map_Link}
                    onChange={handleEditChange}
                    placeholder="Paste Google Map link here"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    name="Notes"
                    value={editFormData.Notes}
                    onChange={handleEditChange}
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>

                <button type="submit" disabled={saving}>
                  {saving ? "Updating..." : "Update Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value || value === "-") return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-GB");
}

function formatDateForInput(value) {
  if (!value || value === "-") return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
}

export default Customers;