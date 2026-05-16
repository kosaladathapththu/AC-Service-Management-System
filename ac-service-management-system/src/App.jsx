import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerProfile from "./pages/CustomerProfile";
import ACUnits from "./pages/ACUnits";
import Installations from "./pages/Installations";
import Services from "./pages/Services";
import AddPayment from "./pages/AddPayment";
import Payments from "./pages/Payments";
import Complaints from "./pages/Complaints";
import AddSale from "./pages/AddSale";
import AddInstallation from "./pages/AddInstallation";
import AddService from "./pages/AddService";
import AddComplaint from "./pages/AddComplaint";

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
          <Route path="add-installation" element={<AddInstallation />} />
          <Route path="installations" element={<Installations />} />
          <Route path="add-service" element={<AddService />} />
          <Route path="services" element={<Services />} />
          <Route path="add-payment" element={<AddPayment />} />
          <Route path="payments" element={<Payments />} />
          <Route path="add-complaint" element={<AddComplaint />} />
          <Route path="complaints" element={<Complaints />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;