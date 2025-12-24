import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useUser } from "../component/UserContext";

export default function Challenges() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const { user } = useUser();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/challenges");
      setItems(res.data || []);
    } catch (e) {
      alert(e.response?.data || "Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }

  async function search(e) {
    e.preventDefault();
    try {
      const res = await api.get("/challenges", { params: { q } });
      setItems(res.data || []);
    } catch (e) {
      alert(e.response?.data || "Search failed");
    }
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="title-grad" style={{ marginBottom: 6 }}>Company Challenges</h1>
        {user && user.role === 'COMPANY' && (
          <Link className="btn btn-primary" to="/company/post-challenge">Post Challenge</Link>
        )}
      </div>
      <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>Solve real-world problems from companies and showcase your skills.</p>
      <form onSubmit={search} className="row" style={{ gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <input placeholder="Search challenges..." value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn btn-primary" type="submit">Search</button>
        <button className="btn btn-secondary" type="button" onClick={load}>Reset</button>
      </form>
      {loading ? (
        <div className="muted">Loading...</div>
      ) : items.length === 0 ? (
        <div className="muted">No challenges found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {items.map(c => (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{c.title}</h3>
                  <div className="muted">{c.companyName} • {c.difficulty || 'Medium'} • {Array.isArray(c.skills) ? c.skills.join(', ') : c.skills}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Link className="btn btn-primary" to={`/challenges/${c.id}`}>View</Link>
                  {(user && user.role === 'RECRUITER' && user.id && c.createdByUserId === user.id) && (
                    <Link className="btn btn-secondary" to={`/company/challenges/${c.id}/submissions`}>View Submissions</Link>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 8 }}>{c.summary || (c.description?.slice(0, 160) + (c.description?.length > 160 ? '...' : ''))}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
