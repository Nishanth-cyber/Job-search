import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

export default function ChallengeSubmissions() {
  const { id } = useParams();
  const [subs, setSubs] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Load challenge meta (optional, for title)
        const [cRes, sRes] = await Promise.all([
          api.get(`/challenges/${id}`),
          api.get(`/challenges/${id}/submissions`)
        ]);
        setChallenge(cRes.data);
        setSubs(sRes.data || []);
      } catch (e) {
        alert(e.response?.data || "Failed to load submissions");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="title-grad" style={{ marginBottom: 6 }}>Challenge Submissions</h1>
        <div>
          <Link className="btn btn-secondary" to={`/challenges/${id}`}>Back to Challenge</Link>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
        {challenge ? (<>
          {challenge.title} • {challenge.companyName}
        </>) : 'Loading challenge...'}
      </p>
      {loading ? (
        <div className="muted">Loading...</div>
      ) : subs.length === 0 ? (
        <div className="muted">No submissions yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {subs.map(s => (
            <div key={s.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>Submitted</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(s.createdAt || Date.now()).toLocaleString()}</div>
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'right' }}>
                  <div>User: {s.userId}</div>
                  {s.submitterName && (<div>{s.submitterName}</div>)}
                  {s.submitterEmail && (<div>{s.submitterEmail}</div>)}
                </div>
              </div>
              <div style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>{s.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
