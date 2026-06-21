function getSheetUrl(spreadsheetId, gid) {
  if (!spreadsheetId) return "";
  const tab = gid ? `?gid=${encodeURIComponent(gid)}#gid=${encodeURIComponent(gid)}` : "";
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/edit${tab}`;
}

const onlineSheetId = import.meta.env.VITE_ONLINE_ORDERS_SHEET_ID || "";
const onlineSheetGid = import.meta.env.VITE_ONLINE_ORDERS_SHEET_GID || "";
const showroomSheetId = import.meta.env.VITE_SHOWROOM_SHEET_ID || "";
const showroomSheetGid = import.meta.env.VITE_SHOWROOM_SHEET_GID || "";
const databaseSheetId = import.meta.env.VITE_SYSTEM_DATABASE_SHEET_ID || "";
const databaseSheetGid = import.meta.env.VITE_SYSTEM_DATABASE_SHEET_GID || "";

export const SOURCE_SHEETS = [
  {
    key: "online",
    label: "Online Orders",
    channel: "Online",
    spreadsheetId: onlineSheetId,
    gid: onlineSheetGid,
    url: getSheetUrl(onlineSheetId, onlineSheetGid),
  },
  {
    key: "showroom",
    label: "Showroom",
    channel: "Showroom",
    spreadsheetId: showroomSheetId,
    gid: showroomSheetGid,
    url: getSheetUrl(showroomSheetId, showroomSheetGid),
  },
];

export const SYSTEM_DATABASE_SHEET = {
  label: "System Database",
  spreadsheetId: databaseSheetId,
  gid: databaseSheetGid,
  url: getSheetUrl(databaseSheetId, databaseSheetGid),
};

export const APPS_SCRIPT_PROJECT = {
  webAppUrl: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || "",
};
