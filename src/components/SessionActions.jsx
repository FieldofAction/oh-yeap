import React from "react";

// Bank and download, worded and placed the same way in every Workshop tool.
// `children` are any extra links the tool already had (copy, a second format).
export default function SessionActions({ onBank, onDownload, downloadLabel = "Download as Markdown", bankedTo, navigateTo, disabled = false, children }) {
  return (
    <>
      <div className="wb-actions">
        {onBank ? (
          <button type="button" className="wb-button" onClick={onBank} disabled={disabled}>{bankedTo ? "Bank it again" : "Bank this session"}</button>
        ) : null}
        {onDownload ? (
          <button type="button" className="wb-link" onClick={onDownload} disabled={disabled}>{downloadLabel}</button>
        ) : null}
        {children}
      </div>
      {bankedTo ? (
        <div className="wb-actions" role="status">
          <p className="wb-body">Banked on the Workbench, under "{bankedTo}".</p>
          <button type="button" className="wb-link" onClick={() => navigateTo?.("studio")}>Open the Workbench</button>
        </div>
      ) : null}
    </>
  );
}
