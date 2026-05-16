import { useEffect, useState } from "react";
import { getAllData, updateRecord } from "../api/googleSheetApi";

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingComplaint, setEditingComplaint] = useState(null);
  const [editFormData, setEditFormData] = useState({
    Complaint_Date: "",
    Issue_Description: "",
    Technician_Name: "",
    Action_Taken: "",
    Cost_Type: "Free",
    Cost_Amount: "",
    Complaint_Status: "Open",
    Notes: "",
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  async function loadComplaints() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllData("complaints");
      setComplaints(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(complaint) {
    setEditingComplaint(complaint);

    setEditFormData({
      Complaint_Date: formatDateForInput(complaint.Complaint_Date),
      Issue_Description: complaint.Issue_Description || "",
      Technician_Name: complaint.Technician_Name || "",
      Action_Taken: complaint.Action_Taken || "",
      Cost_Type: complaint.Cost_Type || "Free",
      Cost_Amount: complaint.Cost_Amount || "",
      Complaint_Status: complaint.Complaint_Status || "Open",
      Notes: complaint.Notes || "",
    });
  }

  function closeEditModal() {
    setEditingComplaint(null);

    setEditFormData({
      Complaint_Date: "",
      Issue_Description: "",
      Technician_Name: "",
      Action_Taken: "",
      Cost_Type: "Free",
      Cost_Amount: "",
      Complaint_Status: "Open",
      Notes: "",
    });
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    if (name === "Cost_Type") {
      setEditFormData((previousData) => ({
        ...previousData,
        Cost_Type: value,
        Cost_Amount: value === "Free" ? "" : previousData.Cost_Amount,
      }));

      return;
    }

    setEditFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleUpdateComplaint(event) {
    event.preventDefault();

    if (!editingComplaint) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await updateRecord(
        "complaints",
        "Complaint_ID",
        editingComplaint.Complaint_ID,
        editFormData
      );

      setSuccessMessage("Complaint updated successfully.");
      closeEditModal();
      await loadComplaints();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading complaints...</p>;
  if (error) return <p className="error-text">Error: {error}</p>;

  return (
    <div>
      <div className="page-header">
        <h2>Complaints</h2>
        <p>Manage customer complaints and AC repair records.</p>
      </div>

      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th>Customer ID</th>
              <th>AC ID</th>
              <th>Complaint Date</th>
              <th>Issue Description</th>
              <th>Technician</th>
              <th>Action Taken</th>
              <th>Cost Type</th>
              <th>Cost Amount</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {complaints.map((complaint, index) => (
              <tr key={complaint.Complaint_ID || index}>
                <td>{complaint.Complaint_ID || "-"}</td>
                <td>{complaint.Customer_ID || "-"}</td>
                <td>{complaint.AC_ID || "-"}</td>
                <td>{formatDate(complaint.Complaint_Date)}</td>
                <td>{complaint.Issue_Description || "-"}</td>
                <td>{complaint.Technician_Name || "-"}</td>
                <td>{complaint.Action_Taken || "-"}</td>

                <td>
                  <span
                    className={`status-badge ${getCostTypeClass(
                      complaint.Cost_Type
                    )}`}
                  >
                    {complaint.Cost_Type || "-"}
                  </span>
                </td>

                <td>{formatPrice(complaint.Cost_Amount)}</td>

                <td>
                  <span
                    className={`status-badge ${getComplaintStatusClass(
                      complaint.Complaint_Status
                    )}`}
                  >
                    {complaint.Complaint_Status || "-"}
                  </span>
                </td>

                <td>{complaint.Notes || "-"}</td>

                <td>
                  <button
                    className="edit-btn"
                    onClick={() => openEditModal(complaint)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {complaints.length === 0 && <p>No complaint records found.</p>}
      </div>

      {editingComplaint && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Complaint</h3>
              <button className="close-btn" onClick={closeEditModal}>
                ×
              </button>
            </div>

            <p className="modal-subtitle">
              Complaint ID: <strong>{editingComplaint.Complaint_ID}</strong>
            </p>

            <form onSubmit={handleUpdateComplaint}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Complaint Date</label>
                  <input
                    type="date"
                    name="Complaint_Date"
                    value={editFormData.Complaint_Date}
                    onChange={handleEditChange}
                  />
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
                  <label>Cost Type</label>
                  <select
                    name="Cost_Type"
                    value={editFormData.Cost_Type}
                    onChange={handleEditChange}
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
                    value={editFormData.Cost_Amount}
                    onChange={handleEditChange}
                    min="0"
                    disabled={editFormData.Cost_Type === "Free"}
                  />
                </div>

                <div className="form-group">
                  <label>Complaint Status</label>
                  <select
                    name="Complaint_Status"
                    value={editFormData.Complaint_Status}
                    onChange={handleEditChange}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Issue Description</label>
                  <textarea
                    name="Issue_Description"
                    value={editFormData.Issue_Description}
                    onChange={handleEditChange}
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group full-width">
                  <label>Action Taken</label>
                  <textarea
                    name="Action_Taken"
                    value={editFormData.Action_Taken}
                    onChange={handleEditChange}
                    rows="3"
                  ></textarea>
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
                  {saving ? "Updating..." : "Update Complaint"}
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

function getCostTypeClass(type) {
  if (!type) return "";

  const value = String(type).toLowerCase();

  if (value === "free") return "status-active";
  if (value === "paid") return "status-info";

  return "";
}

function getComplaintStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "open") return "status-expired";
  if (value === "in progress") return "status-info";
  if (value === "completed") return "status-active";
  if (value === "cancelled") return "status-cancelled";

  return "";
}

export default Complaints;