import { useEffect, useState } from "react";
import api from "../api";
import Modal from "../component/Modal";

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    companyName: "",
    companyDescription: "",
    website: "",
    contactPhone: "",
    industry: "",
    size: ""
  });

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

  async function createCompany(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...form };
      const res = await api.post("/admin/companies", payload);
      alert(`Created company. ID: ${res.data.companyId}`);
      setForm({ email: "", password: "", username: "", companyName: "", companyDescription: "", website: "", contactPhone: "", industry: "", size: "" });
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data || e.message || "Failed";
      alert(msg);
    } finally {
      setCreating(false);
    }
  }

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

      <div style={{ marginTop: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>Add Company</button>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Company & Recruiter" size="lg">
        <form className="form" onSubmit={async (e) => { await createCompany(e); if (!creating) setShowCreateModal(false); }}>
          <div className="row cols-3">
            <div className="field">
              <label>Recruiter Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="field">
              <label>Temp Password</label>
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="field">
              <label>Recruiter Username</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
          </div>

          <div className="row cols-2">
            <div className="field">
              <label>Company Name</label>
              <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
            </div>
            <div className="field">
              <label>Website</label>
              <input placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
          </div>

          <div className="row cols-2">
            <div className="field">
              <label>Contact Phone</label>
              <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
            <div className="field">
              <label>Industry</label>
              <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
          </div>

          <div className="row cols-2">
            <div className="field">
              <label>Company Size</label>
              <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
            </div>
            <div className="field">
              <label>Company Description</label>
              <textarea rows={3} value={form.companyDescription} onChange={(e) => setForm({ ...form, companyDescription: e.target.value })} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Company'}
            </button>
          </div>
        </form>
      </Modal>
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
