import React from "react";

export default function Loader({ text = "Loading...", size = 28 }) {
  const spinnerSize = Number(size) || 28;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <div
        aria-label="loading"
        style={{
          width: spinnerSize,
          height: spinnerSize,
          borderRadius: '50%',
          border: '3px solid rgba(148,163,184,0.25)',
          borderTopColor: '#f59e0b',
          animation: 'spin 0.9s linear infinite'
        }}
      />
      {text && <span style={{ color: '#94a3b8' }}>{text}</span>}
    </div>
  );
}
