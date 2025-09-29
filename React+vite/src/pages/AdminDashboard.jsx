import { useEffect, useState } from "react";
import api from "../api";

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/admin/dashboard/summary");
        setSummary(res.data);
      } catch (e) {
        alert(e.response?.data || "Failed to load dashboard summary");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="fade-in">
      <h1 className="title-grad" style={{ marginBottom: 8 }}>Admin Dashboard</h1>
      {loading ? (
        <div className="muted">Loading...</div>
      ) : summary ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Card title="Users" value={summary.users} />
          <Card title="Jobs" value={summary.jobs} />
          <Card title="Challenges" value={summary.challenges} />
          <Card title="Submissions" value={summary.submissions} />
        </div>
      ) : (
        <div className="muted">No data</div>
      )}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="card">
      <div style={{ fontSize: 13, color: '#94a3b8' }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value ?? '-'}</div>
    </div>
  );
}
