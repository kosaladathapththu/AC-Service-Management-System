import { useEffect, useState } from "react";
import { getAllData } from "../api/googleSheetApi";

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadComplaints();
  }, []);

  async function loadComplaints() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllData("complaints");
      console.log("Complaints Data:", data);

      setComplaints(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p>Loading complaints...</p>;
  }

  if (error) {
    return <p className="error-text">Error: {error}</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Complaints</h2>
        <p>Manage customer complaints and AC repair records.</p>
      </div>

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
              </tr>
            ))}
          </tbody>
        </table>

        {complaints.length === 0 && <p>No complaint records found.</p>}
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB");
}

function formatPrice(value) {
  if (!value) {
    return "-";
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return String(value);
  }

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