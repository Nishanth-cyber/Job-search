import { useEffect, useState } from "react"; import { useNavigate, useParams } from "react-router-dom"; import api from "../api";
import { Link } from "react-router-dom";
import { useUser } from "../component/UserContext";
export default function ChallengeDetail() {
  const { id } = useParams(); const navigate = useNavigate(); const [challenge, setChallenge] = useState(null); const [loading, setLoading] = useState(true); const [solution, setSolution] = useState(""); const [submitting, setSubmitting] = useState(false);
  const { user } = useUser();
  useEffect(() => { (async () => { try { const res = await api.get(`/challenges/${id}`); setChallenge(res.data); } catch { alert("Failed to load challenge"); } finally { setLoading(false); } })(); }, [id]);
  async function submitSolution(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/challenges/${id}/submit`, { content: solution });
      alert("Submitted! Company will review your solution.");
      setSolution("");
    } catch (e) {
      alert(e.response?.data || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!challenge) return <div>Challenge not found</div>;

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>{challenge.title}</h1>
      <div style={{ color: '#94a3b8', marginBottom: 12 }}>{challenge.companyName} • {challenge.difficulty || 'Medium'}</div>
      {/* Owner utility actions for challenges - shown only if recruiter and owner */}
      {user && user.role === 'RECRUITER' && challenge && user.id === challenge.createdByUserId && (
        <Link to={`/company/challenges/${id}/submissions`}>
          <button className="btn btn-primary" style={{ marginBottom: 12 }}>View Submissions</button>
        </Link>
      )}
      {Array.isArray(challenge.skills) && challenge.skills.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <strong>Skills:</strong> {challenge.skills.join(', ')}
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <strong>Description</strong>
        <p style={{ whiteSpace: 'pre-wrap' }}>{challenge.description}</p>
      </div>

      <hr style={{ borderColor: '#334155', margin: '20px 0' }} />
      <h3>Submit your solution</h3>
      <form className="form" onSubmit={submitSolution}>
        <div className="field">
          <label>Solution (link or write-up)</label>
          <textarea rows={6} value={solution} placeholder="Share a GitHub repo link, demo URL, or detailed approach..." onChange={e => setSolution(e.target.value)} required />
        </div>
        <div style={{ marginTop: 10 }}>
          <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Solution'}</button>
        </div>
      </form>
    </div>
  );
}
