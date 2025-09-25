import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

const STATUS_OPTIONS = [
  "PENDING",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "REJECTED",
  "HIRED",
];

export default function AdminJobApplications() {
  const { id } = useParams(); // job id
  const [apps, setApps] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const [jobRes, appsRes] = await Promise.all([
        api.get(`/jobs/${id}`),
        api.get(`/applications/job/${id}`),
      ]);
      setJob(jobRes.data);
      setApps(appsRes.data || []);
    } catch (e) {
      alert(e.response?.data || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(applicationId, newStatus) {
    try {
      await api.patch(`/applications/${applicationId}/status`, null, { params: { status: newStatus } });
      await load();
    } catch (e) {
      alert(e.response?.data || "Failed to update status");
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {job && (
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ margin: 0 }}>Applications — {job.title}</h1>
          <div style={{ color: '#94a3b8' }}>{job.companyName} • {job.location}</div>
        </div>
      )}

      {apps.length === 0 ? (
        <div>No applications yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {apps.map(a => (
            <div key={a.id} style={{ padding: 16, border: '1px solid #334155', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{a.jobSeekerName}</strong>
                  <div style={{ color: '#94a3b8' }}>{a.jobSeekerEmail}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Skill Score: <strong>{typeof a.skillScore === 'number' ? a.skillScore : 'N/A'}</strong></div>
                  <div>
                    <label style={{ marginRight: 8 }}>Status</label>
                    <select value={a.status} onChange={e => updateStatus(a.id, e.target.value)}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              {a.coverLetter && (
                <div style={{ marginTop: 8 }}>
                  <strong>Cover Letter:</strong>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{a.coverLetter}</p>
                </div>
              )}
              {a.skillAnalysis && (
                <details style={{ marginTop: 8 }}>
                  <summary>View AI Analysis</summary>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{a.skillAnalysis}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
