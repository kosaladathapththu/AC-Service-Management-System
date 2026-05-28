export function getPaymentEvidence(payment) {
  const fileName = getFirstValue(payment, [
    "Payment_Evidence_File_Name",
    "Payment Evidence File Name",
    "Evidence_File_Name",
    "Evidence File Name",
    "File_Name",
    "File Name",
  ]);

  const rawLink = getFirstValue(payment, [
    "Payment_Evidence_Link",
    "Payment Evidence Link",
    "Payment_Evidence_URL",
    "Payment Evidence URL",
    "Payment_Evidence_File_Link",
    "Payment Evidence File Link",
    "Payment_Evidence_File_URL",
    "Payment Evidence File URL",
    "Payment_Evidence_Drive_Link",
    "Payment Evidence Drive Link",
    "Payment_Photo_Link",
    "Payment Photo Link",
    "Payment_Photo_URL",
    "Payment Photo URL",
    "Evidence_Link",
    "Evidence Link",
    "Evidence_URL",
    "Evidence URL",
    "Photo_Link",
    "Photo Link",
    "Photo_URL",
    "Photo URL",
    "Receipt_Link",
    "Receipt Link",
    "Receipt_URL",
    "Receipt URL",
    "Proof_Link",
    "Proof Link",
    "Proof_URL",
    "Proof URL",
    "Google_Drive_Link",
    "Google Drive Link",
    "Uploaded_File_Link",
    "Uploaded File Link",
    "File_Link",
    "File Link",
    "File_URL",
    "File URL",
  ]);

  const dataUrl = getFirstValue(payment, [
    "Payment_Evidence_File_Data_URL",
    "Payment Evidence File Data URL",
    "Evidence_File_Data_URL",
    "Evidence File Data URL",
  ]);

  const base64Data = getFirstValue(payment, [
    "Payment_Evidence_File_Data",
    "Payment Evidence File Data",
    "Evidence_File_Data",
    "Evidence File Data",
  ]);

  const openUrl = dataUrl || rawLink || "";
  const isDataImage = String(dataUrl).startsWith("data:image");
  const previewUrl = isDataImage
    ? dataUrl
    : getImagePreviewUrl(rawLink || dataUrl || fileName);

  return {
    hasEvidence: Boolean(rawLink || dataUrl || base64Data || fileName),
    fileName,
    openUrl,
    previewUrl,
    downloadUrl:
      !dataUrl && base64Data
        ? `data:application/octet-stream;base64,${base64Data}`
        : dataUrl || "",
  };
}

function getFirstValue(source, keys) {
  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}

function getImagePreviewUrl(value) {
  if (!value) return "";

  const text = String(value).trim();
  if (text.startsWith("data:image")) return text;
  if (!/^https?:\/\//i.test(text)) return "";

  if (/\.(png|jpe?g|webp|gif|bmp)(\?|#|$)/i.test(text)) return text;

  const driveFileId = getGoogleDriveFileId(text);
  if (driveFileId) {
    return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w600`;
  }

  return "";
}

function getGoogleDriveFileId(link) {
  const patterns = [
    /\/file\/d\/([^/?#]+)/,
    /[?&]id=([^&#]+)/,
    /\/open\?id=([^&#]+)/,
    /\/uc\?id=([^&#]+)/,
  ];

  for (const pattern of patterns) {
    const match = link.match(pattern);
    if (match && match[1]) return match[1];
  }

  return "";
}
