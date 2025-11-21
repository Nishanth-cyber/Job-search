import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import N8NAnalysisModal from "../component/N8NAnalysisModal";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showN8NModal, setShowN8NModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data);
      } catch (e) {
        alert("Failed to load job");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function startTest(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // No cover letter flow required
      // Navigate to typing-based test page
      navigate(`/jobs/${id}/test`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>{job.title}</h1>
      <div style={{ color: '#94a3b8', marginBottom: 12 }}>{job.companyName} • {job.location} • {job.jobType}</div>
      <div style={{ marginBottom: 16 }}>
        <strong>Description</strong>
        <p style={{ whiteSpace: 'pre-wrap' }}>{job.description}</p>
      </div>
      {Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <strong>Required skills</strong>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {job.requiredSkills.map(s => (
              <span key={s} style={{ background: '#0b1020', border: '1px solid #334155', padding: '4px 8px', borderRadius: 999, color: '#ffffff' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {job.benefits && (
        <div style={{ marginBottom: 16 }}>
          <strong>Benefits</strong>
          <p style={{ whiteSpace: 'pre-wrap' }}>{job.benefits}</p>
        </div>
      )}

      <hr style={{ borderColor: '#334155', margin: '20px 0' }} />

      <h3>Start your skill test</h3>
      <form className="form" onSubmit={startTest}>
        <div style={{ marginTop: 10 }}>
          <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Opening test...' : 'Start Resume Test'}</button>
        </div>
      </form>

      <hr style={{ borderColor: '#334155', margin: '20px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={() => setShowN8NModal(true)}>
          Resume Match
        </button>
      </div>

      <N8NAnalysisModal
        jobId={id}
        isOpen={showN8NModal}
        onClose={() => setShowN8NModal(false)}
        onContinue={() => setShowN8NModal(false)}
      />
    </div>
  );
}
