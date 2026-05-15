import { useParams } from "react-router-dom";
import {
  customers,
  acUnits,
  installations,
  services,
  payments,
  complaints,
} from "../data/dummyData";

function CustomerProfile() {
  const { id } = useParams();

  const customer = customers.find((item) => item.id === id);

  if (!customer) {
    return <h2>Customer not found</h2>;
  }

  const customerACUnits = acUnits.filter((item) => item.customerId === id);
  const customerInstallations = installations.filter(
    (item) => item.customerId === id
  );
  const customerServices = services.filter((item) => item.customerId === id);
  const customerPayments = payments.filter((item) => item.customerId === id);
  const customerComplaints = complaints.filter((item) => item.customerId === id);

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
          {customerACUnits.map((unit) => (
            <p key={unit.id}>
              {unit.brand} {unit.model} - <strong>{unit.warrantyStatus}</strong>
            </p>
          ))}
        </div>
      </div>

      <Section title="Purchased AC Units" items={customerACUnits} />
      <Section title="Installation Details" items={customerInstallations} />
      <Section title="Service History" items={customerServices} />
      <Section title="Payment History" items={customerPayments} />
      <Section title="Complaints" items={customerComplaints} />
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