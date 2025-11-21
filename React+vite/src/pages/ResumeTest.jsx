import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import N8NAnalysisModal from "../component/N8NAnalysisModal";

export default function ResumeTest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState(["", "", "", "", ""]);
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState(["", "", "", "", ""]);
  const [questionsReady, setQuestionsReady] = useState(false);
  const [showN8NModal, setShowN8NModal] = useState(false);
  const [n8nAnalysis, setN8nAnalysis] = useState(null);

  useEffect(() => {
    // Load job and check application status
    (async () => {
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data);
        
        // Check if user has already applied
        const appRes = await api.get(`/applications/check-application/${id}`);
        if (appRes.data.hasApplied) {
          // User has already applied, show message
          alert("You have already applied for this job.");
          navigate("/me/applications");
          return;
        }
        
        // Load questions (fallback to local if endpoint missing/unauthorized)
        try {
          const qRes = await api.get(`/jobs/${id}/test-questions`);
          if (Array.isArray(qRes.data) && qRes.data.length > 0) {
            const list = qRes.data.slice(0,5);
            setQuestions([list[0]||"", list[1]||"", list[2]||"", list[3]||"", list[4]||""]);
            setQuestionsReady(true);
          } else {
            throw new Error("Empty questions");
          }
        } catch (_) {
          const fallback = [
            `Describe a project where you used skills relevant to ${res.data?.title || 'this role'}. What was your contribution?`,
            'Explain how you debug a difficult production issue. Give a recent example.',
            'What trade-offs did you consider in a system you designed or improved?',
            'Describe a time you learned a new tool or concept quickly to deliver results.',
            'What accomplishment are you most proud of related to this role, and why?'
          ];
          setQuestions(fallback);
          setQuestionsReady(true);
        }
        
        // Show N8N analysis modal
        setShowN8NModal(true);
      } catch {
        alert("Failed to load job");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function handleN8NComplete(analysis) {
    setN8nAnalysis(analysis);
  }

  function computeScore() {
    // Simple scoring: non-empty answers count equally
    const nonEmpty = answers.filter((a) => a && a.trim().length >= 20).length; // encourage some detail
    return Math.round((nonEmpty / 5) * 100);
  }

  function handleNext(e) {
    e.preventDefault();
    if (idx < 4) setIdx(idx + 1);
  }

  function handlePrev(e) {
    e.preventDefault();
    if (idx > 0) setIdx(idx - 1);
  }

  const canProceed = (answers[idx] && answers[idx].trim().length >= 20);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Use local score only
      let testScore = computeScore();

      const fd = new FormData();
      fd.append("jobId", id);
      fd.append("testScore", String(testScore));

      const res = await api.post("/applications", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(`Application submitted. Test score: ${testScore}/100. Status: ${res.data.status}`);
      navigate("/me/applications");
    } catch (err) {
      const msg = err.response?.data || err.message || "Failed to submit application";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const allQuestionsLoaded = questionsReady && questions.every(q => typeof q === 'string' && q.trim().length > 0);

  if (loading || !allQuestionsLoaded) return (
    <div>
      <div style={{height: 28, width: 280, background:'#0b1020', border:'1px solid #334155', borderRadius:6, marginBottom:12}} />
      <div style={{height: 14, width: 360, background:'#0b1020', border:'1px solid #334155', borderRadius:6, marginBottom:20}} />
      <div className="card" style={{padding:16}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
          <div style={{height: 18, width: 140, background:'#0b1020', border:'1px solid #334155', borderRadius:6}} />
          <div style={{height: 18, width: 160, background:'#0b1020', border:'1px solid #334155', borderRadius:6}} />
        </div>
        <div style={{height: 18, width: '80%', background:'#0b1020', border:'1px solid #334155', borderRadius:6, margin:'10px 0'}} />
        <div style={{height: 120, width: '100%', background:'#0b1020', border:'1px solid #334155', borderRadius:6, margin:'10px 0'}} />
        <div style={{display:'flex', gap:8, marginTop:10}}>
          <div style={{height: 36, width: 100, background:'#0b1020', border:'1px solid #334155', borderRadius:6}} />
          <div style={{height: 36, width: 120, background:'#0b1020', border:'1px solid #334155', borderRadius:6}} />
        </div>
      </div>
    </div>
  );
  if (!job) return <div>Job not found</div>;

  // Don't show test until N8N analysis is complete
  if (!n8nAnalysis) {
    return (
      <div>
        <h1>Resume Test for {job.title}</h1>
        <p style={{ color: '#94a3b8', marginBottom: 12 }}>
          Please complete the resume analysis first.
        </p>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowN8NModal(true)}
        >
          Start Resume Analysis
        </button>
        
        <N8NAnalysisModal
          jobId={id}
          isOpen={showN8NModal}
          onClose={() => setShowN8NModal(false)}
          onContinue={handleN8NComplete}
        />
      </div>
    );
  }

  return (
    <div>
      <h1>Resume Test for {job.title}</h1>
      {n8nAnalysis && (
        <div style={{ 
          background: '#f8fafc', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 20,
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Resume Score: </strong>
              <span style={{ 
                color: n8nAnalysis.n8nScore >= 70 ? '#10b981' : n8nAnalysis.n8nScore >= 50 ? '#f59e0b' : '#ef4444',
                fontWeight: 'bold'
              }}>
                {n8nAnalysis.n8nScore}/100
              </span>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowN8NModal(true)}
              style={{ fontSize: '0.9em' }}
            >
              View Analysis
            </button>
          </div>
        </div>
      )}
      
      <p style={{ color: '#94a3b8', marginBottom: 12 }}>
        Answer at least 20 characters per question to progress.
      </p>

      <form className="form" onSubmit={idx === 4 ? submit : handleNext}>
        <div className="field">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <strong>Question {idx + 1} / 5</strong>
            <span style={{color:'#94a3b8'}}>Estimated score: {computeScore()}/100</span>
          </div>
          <label style={{marginTop:6}}>{questions[idx]}</label>
          <textarea
            rows={4}
            value={answers[idx]}
            onChange={(e) => {
              const next = answers.slice();
              next[idx] = e.target.value;
              setAnswers(next);
            }}
          />
          <small>Minimum 20 characters.</small>
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-secondary" onClick={handlePrev} disabled={idx===0 || submitting}>Previous</button>
          {idx < 4 ? (
            <button className="btn btn-primary" type="submit" disabled={!canProceed || submitting}>Next</button>
          ) : (
            <button className="btn btn-primary" type="submit" disabled={submitting}>Submit Application</button>
          )}
        </div>

      </form>
      
      <N8NAnalysisModal
        jobId={id}
        isOpen={showN8NModal}
        onClose={() => setShowN8NModal(false)}
        onContinue={handleN8NComplete}
      />
    </div>
  );
}
