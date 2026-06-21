<div align="center">
  <img src="src/assets/supun-logo.png" alt="Supun Group of Companies" width="180" />

  # ❄️ AC Service Management System

  **A modern operations workspace for the complete air-conditioning service lifecycle.**

  From sales and installation to scheduled maintenance, payments, warranties, and customer support—all in one colorful, responsive dashboard.

  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
  [![Google Sheets](https://img.shields.io/badge/Google_Sheets-Backend-34A853?style=for-the-badge&logo=googlesheets&logoColor=white)](https://developers.google.com/apps-script)
  [![License](https://img.shields.io/badge/License-Private-ef5da8?style=for-the-badge)](#license)
</div>

---

## ✨ Highlights

- **Operations dashboard** — live totals, due services, overdue payments, open complaints, and warranty health.
- **Customer 360° view** — customer profile, locations, units, installations, services, payments, and complaints.
- **Full service lifecycle** — capture sales, register units, arrange installations, and schedule annual/free services.
- **Payment evidence** — attach and retrieve payment proof through Google Apps Script.
- **Fast record discovery** — search and filter large operational lists with mobile-friendly layouts.
- **Light and dark themes** — saved locally and initialized from the system preference.
- **Responsive UX** — animated dashboard, mobile navigation drawer, accessible focus states, and reduced-motion support.

## 🎨 Experience

The interface uses a vibrant violet/cyan design language, contextual status colors, soft glass surfaces, and purposeful transitions. Motion enhances navigation and hierarchy while respecting `prefers-reduced-motion` for accessibility.

## 🧩 Modules

| Module | What it handles |
| --- | --- |
| Dashboard | KPIs, reminders, urgent items, and customer lookup |
| Sales & Customers | New sales, profiles, contact details, and branch locations |
| AC Units | Models, serial numbers, ownership, and warranty state |
| Installations | Scheduling, technicians, status, and free-service generation |
| Services | Recurring service records, due dates, rescheduling, and completion |
| Payments | Annual/service payments, due state, and payment evidence |
| Complaints | Issue tracking, technician assignment, and resolution status |
| Data Sync | Google Sheets source selection and synchronization tools |

## 🛠️ Technology

- React 19 and React Router
- Vite 8
- Google Sheets as the operational data store
- Google Apps Script as the API and evidence integration layer
- Plain CSS with responsive layouts, theme variables, and CSS animation
- Tabler Icons

## 🚀 Local setup

### Prerequisites

- Node.js 20 or newer
- npm
- A deployed Google Apps Script web app connected to the required Google Sheets workbook

### Install and run

```bash
git clone https://github.com/kosaladathapththu/AC-Service-Management-System.git
cd AC-Service-Management-System/ac-service-management-system
npm install
cp .env.example .env
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

On Windows PowerShell, replace the copy command with:

```powershell
Copy-Item .env.example .env
```

## ⚙️ Environment configuration

Create `.env` in the project root:

```env
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_ONLINE_ORDERS_SHEET_ID=YOUR_ONLINE_ORDERS_SHEET_ID
VITE_ONLINE_ORDERS_SHEET_GID=YOUR_ONLINE_ORDERS_TAB_GID
VITE_SHOWROOM_SHEET_ID=YOUR_SHOWROOM_SHEET_ID
VITE_SHOWROOM_SHEET_GID=YOUR_SHOWROOM_TAB_GID
VITE_SYSTEM_DATABASE_SHEET_ID=YOUR_SYSTEM_DATABASE_SHEET_ID
VITE_SYSTEM_DATABASE_SHEET_GID=YOUR_SYSTEM_DATABASE_TAB_GID
```

Do not commit private deployment URLs or credentials. Vite exposes variables prefixed with `VITE_` to browser code, so the Apps Script endpoint must enforce appropriate access and validation.

## 📊 Google Sheets and Apps Script

The frontend communicates with a deployed Apps Script web app. Supporting scripts included in this repository cover:

- `apps-script-payment-evidence.gs` — payment evidence storage and retrieval
- `apps-script-customer-locations.gs` — customer branch/location support
- `apps-script-full-sync-patch.gs` — extended synchronization operations

Deploy the Apps Script project as a web app, grant only the access your organization requires, and place its `/exec` URL in `.env`.

Store backend IDs in **Apps Script → Project Settings → Script Properties** instead of committing them:

| Script property | Value |
| --- | --- |
| `SYSTEM_SPREADSHEET_ID` | Main database spreadsheet ID |
| `ONLINE_SOURCE_SPREADSHEET_ID` | Online-orders spreadsheet ID |
| `SHOWROOM_SOURCE_SPREADSHEET_ID` | Showroom spreadsheet ID |
| `PAYMENT_EVIDENCE_FOLDER_ID` | Private Drive folder ID for evidence |

## 📜 Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create an optimized production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run the ESLint checks |

## 🗂️ Project structure

```text
src/
├── api/          # Google Apps Script API client
├── assets/       # Branding and visual assets
├── components/   # Shared navigation, cards, selectors, and modals
├── config/       # Data-source configuration
├── data/         # Development/sample data
├── pages/        # Route-level screens and workflows
├── utils/        # Search, payment, warranty, and record helpers
├── App.jsx       # Application routes
├── main.jsx      # Theme initialization and React entry point
└── index.css     # Responsive design system and component styles
```

## 🌐 Production build

```bash
npm run lint
npm run build
npm run preview
```

The included `public/_redirects` supports client-side routes on hosts such as Netlify. For other static hosts, configure all unknown routes to serve `index.html`.

## 🔐 Security notes

- Treat customer contact, payment, and service information as private operational data.
- Restrict the Apps Script deployment to the intended users whenever possible.
- Validate all actions in Apps Script; browser-side validation is not a security boundary.
- Avoid storing secrets in `VITE_*` variables because they are bundled into the frontend.
- Review Google Drive sharing permissions for uploaded payment evidence.

## 🤝 Contributing

1. Create a focused feature branch.
2. Keep business rules in `src/utils` and API access in `src/api`.
3. Run `npm run lint` and `npm run build`.
4. Open a pull request with screenshots for interface changes and notes for sheet/schema changes.

## License

This project is maintained for Supun Group of Companies. No open-source license is currently granted; all rights are reserved.

<div align="center">
  Built to keep every customer cool and every service team in control.
</div>
