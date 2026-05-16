import { useEffect, useState } from "react";
import { getAllData, updateRecord } from "../api/googleSheetApi";

function ACUnits() {
  const [acUnits, setAcUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingUnit, setEditingUnit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    AC_Model: "",
    Serial_Number: "",
    Quantity: "",
    Price: "",
    Purchase_Date: "",
    Sales_Channel: "Showroom",
    Warranty_Start_Date: "",
    Warranty_End_Date: "",
    Warranty_Status: "Active",
  });

  useEffect(() => {
    loadACUnits();
  }, []);

  async function loadACUnits() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllData("acUnits");
      setAcUnits(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(unit) {
    setEditingUnit(unit);

    setEditFormData({
      AC_Model: unit.AC_Model || "",
      Serial_Number: unit.Serial_Number || "",
      Quantity: unit.Quantity || "",
      Price: unit.Price || "",
      Purchase_Date: formatDateForInput(unit.Purchase_Date),
      Sales_Channel: unit.Sales_Channel || "Showroom",
      Warranty_Start_Date: formatDateForInput(unit.Warranty_Start_Date),
      Warranty_End_Date: formatDateForInput(unit.Warranty_End_Date),
      Warranty_Status: unit.Warranty_Status || "Active",
    });
  }

  function closeEditModal() {
    setEditingUnit(null);

    setEditFormData({
      AC_Model: "",
      Serial_Number: "",
      Quantity: "",
      Price: "",
      Purchase_Date: "",
      Sales_Channel: "Showroom",
      Warranty_Start_Date: "",
      Warranty_End_Date: "",
      Warranty_Status: "Active",
    });
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleUpdateACUnit(event) {
    event.preventDefault();

    if (!editingUnit) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await updateRecord("acUnits", "AC_ID", editingUnit.AC_ID, editFormData);

      setSuccessMessage("AC unit updated successfully.");
      closeEditModal();
      await loadACUnits();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading AC units...</p>;
  if (error) return <p className="error-text">Error: {error}</p>;

  return (
  <div className="ac-units-page">
      <div className="page-header">
        <h2>AC Units</h2>
        <p>Manage all sold AC units and warranty details.</p>
      </div>

      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>AC ID</th>
              <th>Customer ID</th>
              <th>AC Model</th>
              <th>Serial Number</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Purchase Date</th>
              <th>Sales Channel</th>
              <th>Warranty Start</th>
              <th>Warranty End</th>
              <th>Warranty Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {acUnits.map((unit, index) => (
              <tr key={unit.AC_ID || index}>
                <td>{unit.AC_ID || "-"}</td>
                <td>{unit.Customer_ID || "-"}</td>
                <td>{unit.AC_Model || "-"}</td>
                <td>{unit.Serial_Number || "-"}</td>
                <td>{unit.Quantity || "-"}</td>
                <td>{formatPrice(unit.Price)}</td>
                <td>{formatDate(unit.Purchase_Date)}</td>
                <td>{unit.Sales_Channel || "-"}</td>
                <td>{formatDate(unit.Warranty_Start_Date)}</td>
                <td>{formatDate(unit.Warranty_End_Date)}</td>
                <td>
                  <span
                    className={`status-badge ${getStatusClass(
                      unit.Warranty_Status
                    )}`}
                  >
                    {unit.Warranty_Status || "-"}
                  </span>
                </td>
                <td>
                  <button className="edit-btn" onClick={() => openEditModal(unit)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {acUnits.length === 0 && <p>No AC units found.</p>}
      </div>

      {editingUnit && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit AC Unit</h3>
              <button className="close-btn" onClick={closeEditModal}>
                ×
              </button>
            </div>

            <p className="modal-subtitle">
              AC ID: <strong>{editingUnit.AC_ID}</strong> | Customer ID:{" "}
              <strong>{editingUnit.Customer_ID}</strong>
            </p>

            <form onSubmit={handleUpdateACUnit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>AC Model</label>
                  <input
                    type="text"
                    name="AC_Model"
                    value={editFormData.AC_Model}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Serial Number</label>
                  <input
                    type="text"
                    name="Serial_Number"
                    value={editFormData.Serial_Number}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    name="Quantity"
                    value={editFormData.Quantity}
                    onChange={handleEditChange}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    name="Price"
                    value={editFormData.Price}
                    onChange={handleEditChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Purchase Date</label>
                  <input
                    type="date"
                    name="Purchase_Date"
                    value={editFormData.Purchase_Date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Sales Channel</label>
                  <select
                    name="Sales_Channel"
                    value={editFormData.Sales_Channel}
                    onChange={handleEditChange}
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
                    value={editFormData.Warranty_Start_Date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Warranty End Date</label>
                  <input
                    type="date"
                    name="Warranty_End_Date"
                    value={editFormData.Warranty_End_Date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Warranty Status</label>
                  <select
                    name="Warranty_Status"
                    value={editFormData.Warranty_Status}
                    onChange={handleEditChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Expired">Expired</option>
                  </select>
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
                  {saving ? "Updating..." : "Update AC Unit"}
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

function getStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "active") return "status-active";
  if (value === "cancelled") return "status-cancelled";
  if (value === "expired") return "status-expired";

  return "";
}

export default ACUnits;