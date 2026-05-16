import { useEffect, useState } from "react";
import { getAllData, updateRecord } from "../api/googleSheetApi";

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingService, setEditingService] = useState(null);
  const [editFormData, setEditFormData] = useState({
    Service_Date: "",
    Service_Year: "",
    Service_No: "",
    Service_Type: "Free",
    Service_Category: "Normal",
    Technician_Name: "",
    Service_Status: "Pending",
    Payment_Required: "No",
    Notes: "",
  });

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllData("services");
      setServices(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(service) {
    setEditingService(service);

    setEditFormData({
      Service_Date: formatDateForInput(service.Service_Date),
      Service_Year: service.Service_Year || "",
      Service_No: service.Service_No || "",
      Service_Type: service.Service_Type || "Free",
      Service_Category: service.Service_Category || "Normal",
      Technician_Name: service.Technician_Name || "",
      Service_Status: service.Service_Status || "Pending",
      Payment_Required: service.Payment_Required || "No",
      Notes: service.Notes || "",
    });
  }

  function closeEditModal() {
    setEditingService(null);

    setEditFormData({
      Service_Date: "",
      Service_Year: "",
      Service_No: "",
      Service_Type: "Free",
      Service_Category: "Normal",
      Technician_Name: "",
      Service_Status: "Pending",
      Payment_Required: "No",
      Notes: "",
    });
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    if (name === "Service_Type") {
      setEditFormData((previousData) => ({
        ...previousData,
        Service_Type: value,
        Payment_Required: value === "Paid" ? "Yes" : "No",
      }));

      return;
    }

    setEditFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleUpdateService(event) {
    event.preventDefault();

    if (!editingService) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await updateRecord(
        "services",
        "Service_ID",
        editingService.Service_ID,
        editFormData
      );

      setSuccessMessage("Service updated successfully.");
      closeEditModal();
      await loadServices();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading services...</p>;
  if (error) return <p className="error-text">Error: {error}</p>;

  return (
  <div className="services-page">
      <div className="page-header">
        <h2>Services</h2>
        <p>Manage free and paid AC service schedules.</p>
      </div>

      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Service ID</th>
              <th>Customer ID</th>
              <th>AC ID</th>
              <th>Service Date</th>
              <th>Service Year</th>
              <th>Service No</th>
              <th>Service Type</th>
              <th>Category</th>
              <th>Technician</th>
              <th>Status</th>
              <th>Payment Required</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {services.map((service, index) => (
              <tr key={service.Service_ID || index}>
                <td>{service.Service_ID || "-"}</td>
                <td>{service.Customer_ID || "-"}</td>
                <td>{service.AC_ID || "-"}</td>
                <td>{formatDate(service.Service_Date)}</td>
                <td>{service.Service_Year || "-"}</td>
                <td>{service.Service_No || "-"}</td>

                <td>
                  <span
                    className={`status-badge ${getServiceTypeClass(
                      service.Service_Type
                    )}`}
                  >
                    {service.Service_Type || "-"}
                  </span>
                </td>

                <td>{service.Service_Category || "-"}</td>
                <td>{service.Technician_Name || "-"}</td>

                <td>
                  <span
                    className={`status-badge ${getServiceStatusClass(
                      service.Service_Status
                    )}`}
                  >
                    {service.Service_Status || "-"}
                  </span>
                </td>

                <td>{service.Payment_Required || "-"}</td>
                <td>{service.Notes || "-"}</td>

                <td>
                  <button
                    className="edit-btn"
                    onClick={() => openEditModal(service)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {services.length === 0 && <p>No service records found.</p>}
      </div>

      {editingService && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Service</h3>
              <button className="close-btn" onClick={closeEditModal}>
                ×
              </button>
            </div>

            <p className="modal-subtitle">
              Service ID: <strong>{editingService.Service_ID}</strong>
            </p>

            <form onSubmit={handleUpdateService}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Service Date</label>
                  <input
                    type="date"
                    name="Service_Date"
                    value={editFormData.Service_Date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Service Year</label>
                  <select
                    name="Service_Year"
                    value={editFormData.Service_Year}
                    onChange={handleEditChange}
                  >
                    <option value="">Select year</option>
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
                    value={editFormData.Service_No}
                    onChange={handleEditChange}
                  >
                    <option value="">Select service no</option>
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
                    value={editFormData.Service_Type}
                    onChange={handleEditChange}
                  >
                    <option value="Free">Free</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Service Category</label>
                  <select
                    name="Service_Category"
                    value={editFormData.Service_Category}
                    onChange={handleEditChange}
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
                    value={editFormData.Technician_Name}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Service Status</label>
                  <select
                    name="Service_Status"
                    value={editFormData.Service_Status}
                    onChange={handleEditChange}
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
                    value={editFormData.Payment_Required}
                    onChange={handleEditChange}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
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
                  {saving ? "Updating..." : "Update Service"}
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
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-GB");
}

function formatDateForInput(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
}

function getServiceStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "completed") return "status-active";
  if (value === "pending") return "status-expired";
  if (value === "rescheduled") return "status-info";
  if (value === "cancelled") return "status-cancelled";

  return "";
}

function getServiceTypeClass(type) {
  if (!type) return "";

  const value = String(type).toLowerCase();

  if (value === "free") return "status-active";
  if (value === "paid") return "status-info";

  return "";
}

export default Services;