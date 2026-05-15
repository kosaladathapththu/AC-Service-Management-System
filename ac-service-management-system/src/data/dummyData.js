export const customers = [
  {
    id: "C001",
    name: "Nimal Perera",
    phone: "0712345678",
    email: "nimal@gmail.com",
    address: "Colombo",
    status: "Active",
  },
  {
    id: "C002",
    name: "Kasun Silva",
    phone: "0771234567",
    email: "kasun@gmail.com",
    address: "Kandy",
    status: "Active",
  },
];

export const acUnits = [
  {
    id: "AC001",
    customerId: "C001",
    brand: "LG",
    model: "Dual Inverter 12000BTU",
    serialNumber: "LG-2025-001",
    purchaseDate: "2025-01-10",
    warrantyStart: "2025-01-10",
    warrantyEnd: "2030-01-10",
    warrantyStatus: "Active",
  },
  {
    id: "AC002",
    customerId: "C002",
    brand: "Samsung",
    model: "WindFree 18000BTU",
    serialNumber: "SAM-2025-002",
    purchaseDate: "2025-03-15",
    warrantyStart: "2025-03-15",
    warrantyEnd: "2030-03-15",
    warrantyStatus: "Active",
  },
];

export const installations = [
  {
    id: "I001",
    customerId: "C001",
    acUnitId: "AC001",
    installationDate: "2025-01-12",
    technician: "Amal",
    location: "Bedroom",
    status: "Completed",
  },
];

export const services = [
  {
    id: "S001",
    customerId: "C001",
    acUnitId: "AC001",
    serviceDate: "2026-05-20",
    serviceType: "Free Service",
    status: "Due",
  },
  {
    id: "S002",
    customerId: "C002",
    acUnitId: "AC002",
    serviceDate: "2026-04-10",
    serviceType: "Paid Service",
    status: "Overdue",
  },
];

export const payments = [
  {
    id: "P001",
    customerId: "C001",
    acUnitId: "AC001",
    year: "Year 2",
    amount: 12000,
    status: "Pending",
    dueDate: "2026-05-30",
  },
  {
    id: "P002",
    customerId: "C002",
    acUnitId: "AC002",
    year: "Year 2",
    amount: 15000,
    status: "Paid",
    dueDate: "2026-04-20",
  },
];

export const complaints = [
  {
    id: "CP001",
    customerId: "C001",
    issue: "AC not cooling properly",
    date: "2026-05-12",
    status: "Open",
  },
];