<div align="center">
  <img src="src/assets/supun-logo.png" alt="Supun Group of Companies" width="180" />

  # ❄️ AC Service Management System

  **A modern operations workspace for the complete air-conditioning service lifecycle.**

  From sales and installation to scheduled maintenance, payments, warranties, and customer support — all in one colorful, responsive dashboard.

  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
  [![Google Sheets](https://img.shields.io/badge/Google_Sheets-Backend-34A853?style=for-the-badge&logo=googlesheets&logoColor=white)](https://developers.google.com/apps-script)
  [![License](https://img.shields.io/badge/License-Private-ef5da8?style=for-the-badge)](#license)

  [Features](#-highlights) · [Modules](#-modules) · [Quick Start](#-local-setup) · [Configuration](#%EF%B8%8F-environment-configuration) · [Structure](#%EF%B8%8F-project-structure)

</div>

---

## ✨ Highlights

- **Operations dashboard** — live totals, due services, overdue payments, open complaints, and warranty health at a glance.
- **Customer 360° view** — complete customer profile with locations, AC units, installations, service history, payments, and complaints.
- **Full service lifecycle** — capture sales, register units, schedule installations, and track annual/free services end-to-end.
- **Payment evidence** — attach and retrieve payment proof through Google Apps Script with zero manual file handling.
- **Fast record discovery** — search and filter large operational lists with mobile-friendly, responsive layouts.
- **Light and dark themes** — saved to local storage and initialized from the system preference automatically.
- **Accessible UX** — animated dashboard, mobile navigation drawer, visible keyboard focus states, and `prefers-reduced-motion` support throughout.

---

## 🎨 Design Language

The interface uses a vibrant **violet/cyan** palette, contextual status colors, soft glass surfaces, and purposeful transitions. Motion enhances navigation and visual hierarchy while always respecting user accessibility preferences.

---

## 🧩 Modules

| Module | What it handles |
|---|---|
| **Dashboard** | KPIs, reminders, urgent items, and customer quick-lookup |
| **Sales & Customers** | New sales, customer profiles, contact details, and branch locations |
| **AC Units** | Models, serial numbers, ownership, and warranty state |
| **Installations** | Scheduling, technician assignment, status tracking, and free-service generation |
| **Services** | Recurring service records, due dates, rescheduling, and completion marking |
| **Payments** | Annual/service payments, due-state tracking, and payment evidence upload |
| **Complaints** | Issue logging, technician assignment, and resolution status |
| **Data Sync** | Google Sheets source selection and synchronization tooling |

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + React Router |
| Build Tool | Vite 8 |
| Data Store | Google Sheets |
| API & Integrations | Google Apps Script (web app) |
| Styling | Plain CSS — responsive layouts, theme variables, CSS animations |
| Icons | Tabler Icons |

---

## 🚀 Local Setup

### Prerequisites

- **Node.js 20+** and **npm**
- A deployed **Google Apps Script** web app connected to the required Google Sheets workbook

### Install and Run

```bash
git clone https://github.com/kosaladathapththu/AC-Service-Management-System.git
cd AC-Service-Management-System/ac-service-management-system
npm install
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
# → fill in your values in .env (see below)
npm run dev
```

Open the local URL printed by Vite — usually `http://localhost:5173`.

---

## ⚙️ Environment Configuration

Create `.env` in the project root (copy from `.env.example`):

```env
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

VITE_ONLINE_ORDERS_SHEET_ID=YOUR_ONLINE_ORDERS_SHEET_ID
VITE_ONLINE_ORDERS_SHEET_GID=YOUR_ONLINE_ORDERS_TAB_GID

VITE_SHOWROOM_SHEET_ID=YOUR_SHOWROOM_SHEET_ID
VITE_SHOWROOM_SHEET_GID=YOUR_SHOWROOM_TAB_GID

VITE_SYSTEM_DATABASE_SHEET_ID=YOUR_SYSTEM_DATABASE_SHEET_ID
VITE_SYSTEM_DATABASE_SHEET_GID=YOUR_SYSTEM_DATABASE_TAB_GID
```

> ⚠️ `VITE_*` variables are bundled into the browser build. Never store secrets here — keep them in Apps Script Project Settings instead (see below).

---

## 📊 Google Sheets & Apps Script

The frontend talks to a deployed Apps Script web app. Three supporting scripts are included:

| Script file | Purpose |
|---|---|
| `apps-script-payment-evidence.gs` | Payment evidence storage and retrieval |
| `apps-script-customer-locations.gs` | Customer branch/location management |
| `apps-script-full-sync-patch.gs` | Extended synchronisation operations |

### Deploy the web app

1. Open your Apps Script project → **Deploy → New deployment → Web app**
2. Set access to the minimum scope your organisation requires
3. Copy the `/exec` URL into `.env` as `VITE_GOOGLE_APPS_SCRIPT_URL`

### Script Properties (keep secrets server-side)

Go to **Apps Script → Project Settings → Script Properties** and add:

| Property | Value |
|---|---|
| `SYSTEM_SPREADSHEET_ID` | Main database spreadsheet ID |
| `ONLINE_SOURCE_SPREADSHEET_ID` | Online-orders spreadsheet ID |
| `SHOWROOM_SOURCE_SPREADSHEET_ID` | Showroom spreadsheet ID |
| `PAYMENT_EVIDENCE_FOLDER_ID` | Private Drive folder ID for evidence files |

---

## 📜 Available Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create an optimised production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |

---

## 🗂️ Project Structure

```text
AC-Service-Management-System/
└── ac-service-management-system/
    ├── public/
    │   └── _redirects              # Client-side routing support (Netlify etc.)
    ├── src/
    │   ├── api/                    # Google Apps Script API client
    │   ├── assets/                 # Branding and visual assets
    │   ├── components/             # Shared navigation, cards, selectors, and modals
    │   ├── config/                 # Data-source configuration
    │   ├── data/                   # Development / sample data
    │   ├── pages/                  # Route-level screens and workflows
    │   ├── utils/                  # Search, payment, warranty, and record helpers
    │   ├── App.jsx                 # Application routes
    │   ├── main.jsx                # Theme initialisation and React entry point
    │   └── index.css               # Responsive design system and component styles
    ├── apps-script-payment-evidence.gs
    ├── apps-script-customer-locations.gs
    ├── apps-script-full-sync-patch.gs
    ├── .env.example
    ├── vite.config.js
    └── package.json
```

---

## 🌐 Production Build

```bash
npm run lint
npm run build
npm run preview
```

The included `public/_redirects` handles client-side routing on Netlify. For other static hosts, configure all unknown paths to serve `index.html`.

---

## 🔐 Security Notes

- Customer contact, payment, and service data is **private operational data** — treat it accordingly.
- Restrict the Apps Script deployment to intended users whenever possible.
- **Validate all write operations in Apps Script.** Browser-side validation is convenience, not security.
- Avoid storing secrets in `VITE_*` variables — they are bundled into the frontend and visible in the browser.
- Review Google Drive sharing permissions on the payment evidence folder regularly.

---

## 🤝 Contributing

1. Branch off `main` with a focused, descriptive branch name.
2. Keep business logic in `src/utils/` and all API access in `src/api/`.
3. Run `npm run lint` and `npm run build` before opening a PR.
4. Include **screenshots** for any UI changes and **schema notes** for any Sheets/Apps Script changes.

---

## License

This project is maintained exclusively for **Supun Group of Companies**. No open-source license is granted — all rights reserved.

---

<div align="center">
  Built to keep every customer cool and every service team in control. ❄️
</div>
