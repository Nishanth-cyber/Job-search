import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

// Real-Time Voice Interview Page
// - Web Speech API STT (SpeechRecognition)
// - Web Speech API TTS (speechSynthesis)
// - 5 minutes or 5 questions max
// - Proxies to Spring Boot: /api/ai-interview/session, /next, /finish

export default function VoiceInterviewPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [supported, setSupported] = useState({ stt: false, tts: false });
  const [question, setQuestion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState(null);
  const [qCount, setQCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes
  const [interviewHistory, setInterviewHistory] = useState({}); // Dictionary: { question: answer }
  const [evaluation, setEvaluation] = useState(null); // last evaluation from agent

  const recognitionRef = useRef(null);
  const sessionIdRef = useRef("");
  const timerRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const sttOk = !!SpeechRecognition;
    const ttsOk = typeof window.speechSynthesis !== "undefined";
    setSupported({ stt: sttOk, tts: ttsOk });
    if (sttOk) {
      const r = new SpeechRecognition();
      r.lang = "en-US";
      r.interimResults = true;
      r.continuous = false;
      r.onresult = (e) => {
        let final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          final += e.results[i][0].transcript;
        }
        setTranscript(final);
      };
      r.onend = () => {
        setRecording(false);
      };
      recognitionRef.current = r;
    }
    return () => {
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!started || finished) return;
    if (secondsLeft <= 0) {
      finishInterview();
      return;
    }
    timerRef.current = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [secondsLeft, started, finished]);

  function speak(text) {
    if (!supported.tts || !text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function startRecording() {
    if (!supported.stt) return;
    try {
      setTranscript("");
      recognitionRef.current?.start();
      setRecording(true);
    } catch {
      // ignore
    }
  }

  function stopRecording() {
    try {
      recognitionRef.current?.stop();
    } catch { /* ignore */ }
  }

  function stopAll() {
    stopRecording();
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  async function startInterview() {
    setLoading(true);
    try {
      // Initialize empty history and ask agent for first question via single endpoint
      const payload = {
        sessionId: sessionIdRef.current || undefined,
        jobId,
        turnIndex: 0,
        interviewHistory: {},
        latestAnswer: "",
        timeElapsedSec: 0
      };
      const res = await api.post("/api/ai-interview/agent", payload);
      sessionIdRef.current = res.data.sessionId || sessionIdRef.current || crypto.randomUUID?.() || String(Date.now());
      const tool = res.data.tool;
      if (tool === 'ask_question') {
        const q = res.data.args?.question || res.data.question;
        setQuestion(q || "");
        setQCount(1);
        setStarted(true);
        setSecondsLeft(300);
        if (q) speak(q);
      } else if (tool === 'end_interview') {
        setFinished(true);
        setSummary(res.data.args || res.data);
      } else {
        alert('Agent did not return a question.');
      }
    } catch (e) {
      alert(e.response?.data || e.message || "Failed to start interview");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }

  async function nextTurn() {
    if (!sessionIdRef.current) return;
    const answer = transcript.trim();
    if (!answer) {
      alert("Please speak your answer before continuing.");
      return;
    }
    setLoading(true);
    stopRecording();
    try {
      // Update history with last Q->A
      const nextHistory = { ...interviewHistory, [question]: answer };
      setInterviewHistory(nextHistory);

      const elapsed = 300 - secondsLeft;
      const res = await api.post("/api/ai-interview/agent", {
        sessionId: sessionIdRef.current,
        jobId,
        turnIndex: qCount,
        interviewHistory: nextHistory,
        latestAnswer: answer,
        timeElapsedSec: elapsed
      });

      const tool = res.data?.tool;
      if (tool === 'end_interview' || qCount >= 5 || secondsLeft <= 0) {
        setFinished(true);
        setSummary(res.data?.args || res.data);
        return;
      }
      if (tool === 'evaluate_answer') {
        setEvaluation(res.data.args || null);
      }
      if (tool === 'ask_question') {
        const q = res.data.args?.question || res.data.question;
        setTranscript("");
        setQCount((c) => c + 1);
        setQuestion(q || "");
        if (q) speak(q);
      }
    } catch (e) {
      alert(e.response?.data || e.message || "Failed to continue interview");
    } finally {
      setLoading(false);
    }
  }

  async function finishInterview() {
    if (finished) return;
    setFinished(true);
    setLoading(true);
    stopAll();
    try {
      const res = await api.post("/api/ai-interview/agent", {
        sessionId: sessionIdRef.current,
        jobId,
        turnIndex: qCount,
        interviewHistory,
        latestAnswer: transcript || "",
        timeElapsedSec: 300 - secondsLeft,
        forceEnd: true
      });
      setSummary(res.data?.args || res.data);
    } catch (e) {
      // Even if finish fails, end the UI cleanly
      setSummary({ error: e.response?.data || e.message || "Failed to finalize interview" });
    } finally {
      setLoading(false);
    }
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fade-in">
      <h1 className="title-grad" style={{ marginBottom: 12 }}>Voice Interview</h1>

      {!supported.stt || !supported.tts ? (
        <div className="card" style={{ padding: 16, color: '#ef4444' }}>
          Your browser does not support Web Speech API (STT/TTS). Please use Chrome on desktop.
        </div>
      ) : null}

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div><strong>Timer:</strong> {mm}:{ss}</div>
          <div><strong>Question:</strong> {qCount}/5</div>
        </div>

        {!started && !finished && (
          <button className="btn btn-primary" onClick={startInterview} disabled={loading || !supported.stt || !supported.tts}>
            {loading ? 'Starting...' : 'Start Interview'}
          </button>
        )}

        {started && !finished && (
          <>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Current Question</label>
              <div style={{ background:'#0b1020', border:'1px solid #334155', padding: 12, borderRadius: 8 }}>
                {question || 'Waiting for next question...'}
              </div>
            </div>

            {evaluation && (
              <div className="field" style={{ marginTop: 12 }}>
                <label>Last Evaluation</label>
                <div style={{ background:'#0b1020', border:'1px solid #334155', padding: 12, borderRadius: 8 }}>
                  {evaluation.evaluation || '—'}
                  {typeof evaluation.score === 'number' && (
                    <div style={{ marginTop: 6 }}>Score: {evaluation.score}/100</div>
                  )}
                </div>
              </div>
            )}

            <div className="field" style={{ marginTop: 12 }}>
              <label>Your Answer (auto-filled by speech)</label>
              <textarea rows={3} value={transcript} onChange={(e)=>setTranscript(e.target.value)} />
              <div style={{ marginTop: 8, display:'flex', gap:8 }}>
                <button className="btn btn-secondary" onClick={startRecording} disabled={recording || loading}>Start Mic</button>
                <button className="btn btn-secondary" onClick={stopRecording} disabled={!recording || loading}>Stop Mic</button>
                <button className="btn btn-primary" onClick={nextTurn} disabled={loading}>Submit Answer</button>
                <button className="btn" onClick={finishInterview} disabled={loading}>Finish Now</button>
              </div>
              <div style={{ marginTop: 6, color: '#94a3b8' }}>Recording: {recording ? 'On' : 'Off'}</div>
            </div>
          </>
        )}

        {finished && (
          <div style={{ marginTop: 12 }}>
            <h3>Interview Summary</h3>
            {!summary && <div>Finalizing...</div>}
            {summary && (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {summary.error ? (
                  <div style={{ color:'#ef4444' }}>{String(summary.error)}</div>
                ) : (
                  <>
                    {summary.summary && (<>
                      <strong>Summary:</strong>
                      <div style={{ background:'#0b1020', border:'1px solid #334155', padding: 12, borderRadius:8, margin:'6px 0' }}>{summary.summary}</div>
                    </>)}
                    {typeof summary.score === 'number' && (
                      <div><strong>Score:</strong> {summary.score}/100</div>
                    )}
                    {Array.isArray(summary.highlights) && summary.highlights.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <strong>Highlights:</strong>
                        <ul>
                          {summary.highlights.map((h,i)=>(<li key={i}>{h}</li>))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            <div className="modal-footer" style={{ marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={()=>navigate(-1)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
