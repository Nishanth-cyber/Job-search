import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/jobs/mine");
      setJobs(res.data || []);
    } catch (e) {
      alert(e.response?.data || "Failed to load your jobs");
    } finally {
      setLoading(false);
    }
  }

  async function deactivate(id) {
    if (!confirm("Deactivate this job?")) return;
    try {
      await api.patch(`/jobs/${id}/deactivate`);
      await load();
    } catch (e) {
      alert(e.response?.data || "Failed to deactivate job");
    }
  }

  async function remove(id) {
    if (!confirm("Delete this job? This action cannot be undone.")) return;
    try {
      await api.delete(`/jobs/${id}`);
      await load();
    } catch (e) {
      alert(e.response?.data || "Failed to delete job");
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Jobs</h1>
        <Link className="btn btn-primary" to="/admin/post-job">Post New Job</Link>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : jobs.length === 0 ? (
        <div>You haven't posted any jobs yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {jobs.map(j => (
            <div key={j.id} style={{ padding: 16, border: '1px solid #334155', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{j.title}</h3>
                  <div style={{ color: '#94a3b8' }}>{j.companyName} • {j.location} • {j.jobType} {j.active === false ? '• Inactive' : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link className="btn btn-secondary" to={`/admin/jobs/${j.id}/applications`}>View Applications</Link>
                  {j.active !== false && (
                    <button className="btn btn-secondary" onClick={() => deactivate(j.id)}>Deactivate</button>
                  )}
                  <button className="btn btn-secondary" onClick={() => remove(j.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
