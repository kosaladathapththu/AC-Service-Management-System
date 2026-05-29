function PaymentEvidence({ evidence }) {
  return (
    <div className="payment-evidence">
      {evidence.previewUrl && (
        <a
          className="payment-evidence-thumb-link"
          href={evidence.openUrl || evidence.previewUrl}
          target="_blank"
          rel="noreferrer"
        >
          <img
            className="payment-evidence-thumb"
            src={evidence.previewUrl}
            alt={evidence.fileName || "Payment evidence"}
            onError={(event) => {
              if (
                evidence.previewFallbackUrl &&
                event.currentTarget.src !== evidence.previewFallbackUrl
              ) {
                event.currentTarget.src = evidence.previewFallbackUrl;
                return;
              }

              event.currentTarget.style.display = "none";
            }}
          />
        </a>
      )}

      <div className="payment-evidence-actions">
        {evidence.openUrl && (
          <>
            <a
              className="payment-evidence-view-btn"
              href={evidence.openUrl}
              target="_blank"
              rel="noreferrer"
            >
              View Evidence
            </a>

            <a
              className="payment-evidence-url"
              href={evidence.openUrl}
              target="_blank"
              rel="noreferrer"
              title={evidence.displayUrl || evidence.openUrl}
            >
              {evidence.displayUrl || evidence.openUrl}
            </a>
          </>
        )}

        {evidence.downloadUrl && (
          <a href={evidence.downloadUrl} download={evidence.fileName}>
            Download {evidence.fileName || "Evidence"}
          </a>
        )}

        {!evidence.openUrl && !evidence.downloadUrl && evidence.fileName && (
          <span>
            Evidence saved, but Google Drive link is missing: {evidence.fileName}
          </span>
        )}
      </div>
    </div>
  );
}

export default PaymentEvidence;
