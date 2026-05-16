import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCustomerProfile } from "../api/googleSheetApi";

function CustomerProfile() {
  const { id } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomerProfile();
  }, [id]);

  async function loadCustomerProfile() {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomerProfile(id);
      console.log("Customer profile data:", data);

      setProfile(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function getValue(row, keys) {
    if (!row) return "-";

    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
        return row[key];
      }
    }

    return "-";
  }

  if (loading) {
    return <p>Loading customer profile...</p>;
  }

  if (error) {
    return (
      <div>
        <p className="error-text">Error: {error}</p>

        <Link to="/customers" className="view-link">
          Back to Customers
        </Link>
      </div>
    );
  }

  if (!profile || !profile.customer) {
    return (
      <div>
        <p className="error-text">Customer profile not found.</p>

        <Link to="/customers" className="view-link">
          Back to Customers
        </Link>
      </div>
    );
  }

  const {
    customer,
    acUnits = [],
    installations = [],
    services = [],
    payments = [],
    complaints = [],
  } = profile;

  const customerId = getValue(customer, [
    "customer_ID",
    "Customer_ID",
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
    "Google_Map_Li",
    "Google_Map_Link",
    "Google Map Link",
    "googleMapLink",
  ]);

  const createdDate = getValue(customer, [
    "Created_Date",
    "Created Date",
    "createdDate",
  ]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{customerName}</h2>
          <p>Full customer profile and service details.</p>
        </div>

        <Link to="/customers" className="view-link">
          Back to Customers
        </Link>
      </div>

      <div className="profile-grid">
        <div className="info-card">
          <h3>Customer Details</h3>

          <p>
            <strong>ID:</strong> {customerId}
          </p>

          <p>
            <strong>Name:</strong> {customerName}
          </p>

          <p>
            <strong>Phone:</strong> {phone}
          </p>

          <p>
            <strong>Email:</strong> {email}
          </p>

          <p>
            <strong>Address:</strong> {address}
          </p>

          <p>
            <strong>Google Map Link:</strong>{" "}
            {googleMapLink !== "-" ? (
              <a
                href={googleMapLink}
                target="_blank"
                rel="noreferrer"
                className="view-link"
              >
                Open Map
              </a>
            ) : (
              "-"
            )}
          </p>

          <p>
            <strong>Created Date:</strong> {formatDate(createdDate)}
          </p>
        </div>

        <div className="info-card">
          <h3>Warranty Status</h3>

          {acUnits.length === 0 ? (
            <p>No AC units found.</p>
          ) : (
            acUnits.map((unit, index) => {
              const brand = getValue(unit, ["Brand", "brand"]);
              const model = getValue(unit, ["Model", "model"]);
              const warrantyStatus = getValue(unit, [
                "Warranty_Status",
                "WarrantyStatus",
                "warrantyStatus",
              ]);

              return (
                <p key={unit.ac_ID || unit.AC_ID || unit.id || index}>
                  {brand} {model} - <strong>{warrantyStatus}</strong>
                </p>
              );
            })
          )}
        </div>
      </div>

      <Section title="Purchased AC Units" items={acUnits} />
      <Section title="Installation Details" items={installations} />
      <Section title="Service History" items={services} />
      <Section title="Payment History" items={payments} />
      <Section title="Complaints" items={complaints} />
    </div>
  );
}

function Section({ title, items }) {
  return (
    <div className="table-card section-card">
      <h3>{title}</h3>

      {items.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <table>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={
                  item.id ||
                  item.customer_ID ||
                  item.Customer_ID ||
                  item.ac_ID ||
                  item.AC_ID ||
                  item.installation_ID ||
                  item.service_ID ||
                  item.payment_ID ||
                  item.complaint_ID ||
                  index
                }
              >
                {Object.entries(item).map(([key, value]) => (
                  <td key={key}>
                    <strong>{formatLabel(key)}:</strong>{" "}
                    {formatCellValue(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function formatCellValue(value) {
  if (value === "" || value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "string" && value.includes("T") && value.includes("Z")) {
    return formatDate(value);
  }

  return String(value);
}

function formatDate(value) {
  if (!value || value === "-") {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB");
}

function formatLabel(label) {
  return label
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default CustomerProfile;