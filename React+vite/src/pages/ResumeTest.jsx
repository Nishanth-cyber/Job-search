import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

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

  useEffect(() => {
    // Load job and questions from backend (LLM with fallback on server)
    (async () => {
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data);
        const qRes = await api.get(`/jobs/${id}/test-questions`);
        if (Array.isArray(qRes.data) && qRes.data.length > 0) {
          const list = qRes.data.slice(0,5);
          setQuestions(prev => {
            const next = [list[0]||"", list[1]||"", list[2]||"", list[3]||"", list[4]||""];
            return next;
          });
          setQuestionsReady(true);
        }
      } catch {
        alert("Failed to load job");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
      // Step 1: ask backend to evaluate answers (LLM w/ fallback)
      let testScore = computeScore(); // local estimate fallback
      try {
        const evalRes = await api.post(`/jobs/${id}/evaluate-answers`, { answers });
        if (typeof evalRes.data?.score === 'number') {
          testScore = Math.max(0, Math.min(100, Math.round(evalRes.data.score)));
        }
      } catch (_) {
        // ignore and use local estimate
      }

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

  return (
    <div>
      <h1>Resume Test for {job.title}</h1>
      <p style={{ color: '#94a3b8', marginBottom: 12 }}>
        Threshold: {job.skillScoreThreshold}. Answer at least 20 characters per question to progress.
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
    </div>
  );
}
