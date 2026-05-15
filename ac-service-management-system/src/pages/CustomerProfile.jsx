import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
      setProfile(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p>Loading customer profile...</p>;
  }

  if (error) {
    return <p className="error-text">Error: {error}</p>;
  }

  const {
    customer,
    acUnits,
    installations,
    services,
    payments,
    complaints,
  } = profile;

  return (
    <div>
      <div className="page-header">
        <h2>{customer.name}</h2>
        <p>Full customer profile and service details.</p>
      </div>

      <div className="profile-grid">
        <div className="info-card">
          <h3>Customer Details</h3>
          <p><strong>ID:</strong> {customer.id}</p>
          <p><strong>Phone:</strong> {customer.phone}</p>
          <p><strong>Email:</strong> {customer.email}</p>
          <p><strong>Address:</strong> {customer.address}</p>
          <p><strong>Status:</strong> {customer.status}</p>
        </div>

        <div className="info-card">
          <h3>Warranty Status</h3>

          {acUnits.length === 0 ? (
            <p>No AC units found.</p>
          ) : (
            acUnits.map((unit) => (
              <p key={unit.id}>
                {unit.brand} {unit.model} -{" "}
                <strong>{unit.warrantyStatus}</strong>
              </p>
            ))
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
            {items.map((item) => (
              <tr key={item.id}>
                {Object.entries(item).map(([key, value]) => (
                  <td key={key}>
                    <strong>{key}:</strong> {value}
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

export default CustomerProfile;