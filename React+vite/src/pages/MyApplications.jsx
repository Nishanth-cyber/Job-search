import { useEffect, useState } from "react";
import api from "../api";

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/applications/me");
      setApps(res.data || []);
    } catch (e) {
      alert(e.response?.data || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>My Applications</h1>
      {loading ? (
        <div>Loading...</div>
      ) : apps.length === 0 ? (
        <div>You haven't applied to any jobs yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {apps.map(a => (
            <div key={a.id} style={{ padding: 16, border: '1px solid #334155', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{a.jobTitle}</h3>
                  <div style={{ color: '#94a3b8' }}>{a.companyName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Status: <strong>{a.status}</strong></div>
                  {(() => {
                    const hasTest = typeof a.testScore === 'number';
                    const raw = hasTest ? a.testScore : null;
                    if (raw === null) return null;
                    const normalized = raw > 100 ? Math.round(raw / 100) : raw; // handle legacy 65100
                    return <div>Skill Score: <strong>{`${normalized}/100`}</strong></div>;
                  })()}
                </div>
              </div>
              {a.coverLetter && (
                <div style={{ marginTop: 8, color: '#cbd5e1' }}>
                  <strong>Cover Letter:</strong>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{a.coverLetter}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
