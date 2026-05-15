import { Link } from "react-router-dom";
import { customers } from "../data/dummyData";

function Customers() {
  return (
    <div>
      <div className="page-header">
        <h2>Customers</h2>
        <p>Manage all customer records.</p>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>Status</th>
              <th>Profile</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.email}</td>
                <td>{customer.address}</td>
                <td>{customer.status}</td>
                <td>
                  <Link className="view-link" to={`/customers/${customer.id}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Customers;