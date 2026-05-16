import { useEffect, useState } from "react";
import { getAllData, updateRecord } from "../api/googleSheetApi";

function Installations() {
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingInstallation, setEditingInstallation] = useState(null);
  const [editFormData, setEditFormData] = useState({
    Installation_Date: "",
    Installation_Type: "In-house",
    Technician_Name: "",
    Outsource_Payment: "",
    Installation_Status: "Pending",
    Notes: "",
  });

  useEffect(() => {
    loadInstallations();
  }, []);

  async function loadInstallations() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllData("installations");
      setInstallations(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(installation) {
    setEditingInstallation(installation);

    setEditFormData({
      Installation_Date: formatDateForInput(installation.Installation_Date),
      Installation_Type: installation.Installation_Type || "In-house",
      Technician_Name: installation.Technician_Name || "",
      Outsource_Payment: installation.Outsource_Payment || "",
      Installation_Status: installation.Installation_Status || "Pending",
      Notes: installation.Notes || "",
    });
  }

  function closeEditModal() {
    setEditingInstallation(null);

    setEditFormData({
      Installation_Date: "",
      Installation_Type: "In-house",
      Technician_Name: "",
      Outsource_Payment: "",
      Installation_Status: "Pending",
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

  async function handleUpdateInstallation(event) {
    event.preventDefault();

    if (!editingInstallation) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await updateRecord(
        "installations",
        "Installation_ID",
        editingInstallation.Installation_ID,
        editFormData
      );

      setSuccessMessage("Installation updated successfully.");
      closeEditModal();
      await loadInstallations();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading installations...</p>;
  if (error) return <p className="error-text">Error: {error}</p>;

  return (
    <div>
      <div className="page-header">
        <h2>Installations</h2>
        <p>Manage AC installation records.</p>
      </div>

      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Installation ID</th>
              <th>Customer ID</th>
              <th>AC ID</th>
              <th>Installation Date</th>
              <th>Installation Type</th>
              <th>Technician Name</th>
              <th>Outsource Payment</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {installations.map((installation, index) => (
              <tr key={installation.Installation_ID || index}>
                <td>{installation.Installation_ID || "-"}</td>
                <td>{installation.Customer_ID || "-"}</td>
                <td>{installation.AC_ID || "-"}</td>
                <td>{formatDate(installation.Installation_Date)}</td>
                <td>
                  <span
                    className={`status-badge ${getInstallationTypeClass(
                      installation.Installation_Type
                    )}`}
                  >
                    {installation.Installation_Type || "-"}
                  </span>
                </td>
                <td>{installation.Technician_Name || "-"}</td>
                <td>{formatPrice(installation.Outsource_Payment)}</td>
                <td>
                  <span
                    className={`status-badge ${getInstallationStatusClass(
                      installation.Installation_Status
                    )}`}
                  >
                    {installation.Installation_Status || "-"}
                  </span>
                </td>
                <td>{installation.Notes || "-"}</td>
                <td>
                  <button
                    className="edit-btn"
                    onClick={() => openEditModal(installation)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {installations.length === 0 && <p>No installation records found.</p>}
      </div>

      {editingInstallation && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Installation</h3>
              <button className="close-btn" onClick={closeEditModal}>
                ×
              </button>
            </div>

            <p className="modal-subtitle">
              Installation ID:{" "}
              <strong>{editingInstallation.Installation_ID}</strong>
            </p>

            <form onSubmit={handleUpdateInstallation}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Installation Date</label>
                  <input
                    type="date"
                    name="Installation_Date"
                    value={editFormData.Installation_Date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Installation Type</label>
                  <select
                    name="Installation_Type"
                    value={editFormData.Installation_Type}
                    onChange={handleEditChange}
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
                    value={editFormData.Technician_Name}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Outsource Payment</label>
                  <input
                    type="number"
                    name="Outsource_Payment"
                    value={editFormData.Outsource_Payment}
                    onChange={handleEditChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Installation Status</label>
                  <select
                    name="Installation_Status"
                    value={editFormData.Installation_Status}
                    onChange={handleEditChange}
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
                  {saving ? "Updating..." : "Update Installation"}
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

function formatPrice(value) {
  if (!value) return "-";

  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return String(value);

  return `Rs. ${numberValue.toLocaleString("en-LK")}`;
}

function getInstallationStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "completed") return "status-active";
  if (value === "pending") return "status-expired";
  if (value === "cancelled") return "status-cancelled";

  return "";
}

function getInstallationTypeClass(type) {
  if (!type) return "";

  const value = String(type).toLowerCase();

  if (value === "in-house") return "status-active";
  if (value === "outsourced") return "status-expired";

  return "";
}

export default Installations;