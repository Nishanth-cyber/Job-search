import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/jobs");
      setJobs(res.data || []);
    } catch (e) {
      alert("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  async function search(e) {
    e.preventDefault();
    try {
      const res = await api.get(`/jobs/search`, { params: { keyword: q } });
      setJobs(res.data || []);
    } catch (e) {
      alert("Search failed");
    }
  }

  return (
    <div className="fade-in">
      <h1 className="title-grad" style={{ marginBottom: 6 }}>Open Roles</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>Discover roles that match your skills.</p>
      <form onSubmit={search} className="row" style={{ gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <input placeholder="Search by title..." value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn btn-primary" type="submit">Search</button>
        <button className="btn btn-secondary" type="button" onClick={load}>Reset</button>
      </form>

      {loading ? (
        <div className="muted">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="muted">No jobs found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {jobs.map(j => (
            <div key={j.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    alt={j.companyName || 'Company'}
                    src={`${api.defaults.baseURL || ''}/companies/${j.postedBy}/logo`}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    style={{ height: 40, width: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <div>
                    <h3 style={{ margin: 0 }}>{j.title}</h3>
                    <div className="muted">{j.companyName} • {j.location} • {j.jobType}</div>
                  </div>
                </div>
                <Link className="btn btn-primary" to={`/jobs/${j.id}`}>View</Link>
              </div>
              <div style={{ marginTop: 8 }}>
                {j.description?.slice(0, 180)}{j.description?.length > 180 ? '...' : ''}
              </div>
              {Array.isArray(j.requiredSkills) && j.requiredSkills.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {j.requiredSkills.slice(0, 8).map(s => (
                    <span key={s} style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)', padding: '4px 10px', borderRadius: 999 }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
