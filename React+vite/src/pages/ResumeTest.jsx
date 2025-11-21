import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { evaluateInterviewWebhook, generateInterviewQuestionsWebhook, fetchMyProfile, downloadMyResume } from "../api";
import Loader from "../component/Loader";

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
  // Analysis removed from the flow; test starts immediately
  const [success, setSuccess] = useState(false);
  const [evalOut, setEvalOut] = useState(null);

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
        
        // Try to generate questions from n8n using stored profile resume
        try {
          const me = await fetchMyProfile();
          if (me?.resumeFileId) {
            const blob = await downloadMyResume();
            const file = new File([blob], me.resumeFileName || 'resume.pdf', { type: blob.type || 'application/pdf' });
            const qRes = await generateInterviewQuestionsWebhook(file, res.data?.description || '');
            if (Array.isArray(qRes?.questions) && qRes.questions.length > 0) {
              const list = qRes.questions.slice(0,5);
              setQuestions([list[0]||"", list[1]||"", list[2]||"", list[3]||"", list[4]||""]);
              setQuestionsReady(true);
            } else {
              throw new Error('Empty questions');
            }
          } else {
            throw new Error('No resume');
          }
        } catch (_) {
          // Fallback questions if n8n call fails or no resume
          const fallback = [
            `Describe a project where you used skills relevant to ${res.data?.title || 'this role'}. What was your contribution?`,
            'Explain how you debug a difficult production issue. Give a recent example.',
            'What trade-offs did you consider in a system you designed or improved?',
            'Describe a time you learned a new tool or concept quickly to deliver results.',
            'What accomplishment are you most proud of related to this role, and why?'
          ];
          setQuestions([fallback[0], fallback[1], fallback[2], fallback[3], fallback[4]]);
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
      // Build history for evaluation webhook
      const history = {};
      questions.forEach((q, i) => {
        history[String(q)] = answers[i] || "";
      });

      // Show loading state
      setEvalOut(null);
      setSuccess(false);

      // Evaluate via n8n (expects { history }) and returns { total_score, justification }
      const evalResult = await evaluateInterviewWebhook(history);
      
      setEvalOut({
        score: typeof evalResult?.total_score === 'number' ? Math.round(evalResult.total_score) : computeScore(),
        justification: evalResult?.justification || 'No justification provided.',
      });
      setSuccess(true);
      
      // Redirect after a short delay to show the success message
      setTimeout(() => navigate("/me/applications"), 1500);
    } catch (err) {
      const msg = err.response?.data || err.message || "Failed to submit application";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const allQuestionsLoaded = questionsReady && questions.every(q => typeof q === 'string' && q.trim().length > 0);

  if (loading) {
    return (
      <div style={{ display:'grid', placeItems:'center', minHeight: 240 }}>
        <Loader text="Loading job..." />
      </div>
    );
  }
  if (!job) return <div>Job not found</div>;

  // Do not force analysis before test; analysis remains optional via View Analysis button.

  if (!allQuestionsLoaded) {
    return (
      <div style={{ display:'grid', placeItems:'center', minHeight: 240 }}>
        <Loader text="Preparing your test..." />
      </div>
    );
  }

  if (success) {
    return (
      <div className="fade-in" style={{ display:'grid', placeItems:'center', minHeight: 260 }}>
        <div className="card" style={{ padding: 24, textAlign: 'center', maxWidth: 600 }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Evaluation Complete</div>
          {evalOut && (
            <>
              <div style={{ marginBottom: 6 }}>Score: <strong>{evalOut.score}/100</strong></div>
              <div className="muted" style={{ whiteSpace: 'pre-wrap' }}>{evalOut.justification}</div>
            </>
          )}
          <div className="muted" style={{ marginTop: 12 }}>Redirecting to My Applications...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Resume Test for {job.title}</h1>
      
      
      <p style={{ color: '#94a3b8', marginBottom: 12 }}>
        Answer at least 20 characters per question to progress.
      </p>

      <form className="form" onSubmit={submit}>
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
            <button className="btn btn-primary" type="button" onClick={handleNext} disabled={!canProceed || submitting}>Next</button>
          ) : (
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>

        {submitting && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              textAlign: 'center',
              maxWidth: '400px',
              width: '90%'
            }}>
              <Loader text="Evaluating your answers..." />
              <p style={{ marginTop: '16px', color: '#4b5563' }}>Please wait while we evaluate your responses. This may take a moment.</p>
            </div>
          </div>
        )}

      </form>
      
    </div>
  );
}
