import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerProfile from "./pages/CustomerProfile";
import ACUnits from "./pages/ACUnits";
import Installations from "./pages/Installations";
import Services from "./pages/Services";
import Payments from "./pages/Payments";
import Complaints from "./pages/Complaints";
import AddSale from "./pages/AddSale";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="add-sale" element={<AddSale />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerProfile />} />
          <Route path="ac-units" element={<ACUnits />} />
          <Route path="installations" element={<Installations />} />
          <Route path="services" element={<Services />} />
          <Route path="payments" element={<Payments />} />
          <Route path="complaints" element={<Complaints />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;