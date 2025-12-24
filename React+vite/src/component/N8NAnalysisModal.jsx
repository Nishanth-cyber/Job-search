import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { analyzeResumeWebhook, generateInterviewQuestionsWebhook, fetchMyProfile, downloadMyResume } from '../api';
import Modal from './Modal';

export default function N8NAnalysisModal({ jobId, isOpen, onClose, onContinue }) {
  const navigate = useNavigate();
  const [showResult, setShowResult] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [job, setJob] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [usingProfileResume, setUsingProfileResume] = useState(false);

  useEffect(() => {
    if (isOpen && jobId) {
      // Check for existing application
      checkApplicationStatus();
      loadJob();
      loadProfileResumeIfAny();
    }
  }, [isOpen, jobId]);

  async function checkApplicationStatus() {
    try {
      const res = await api.get(`/applications/check-application/${jobId}`);
      if (res.data.hasApplied) {
        // Fetch the application details
        const appsRes = await api.get(`/applications?jobId=${jobId}`);
        const userApp = appsRes.data.find(app => app.jobSeekerId === getCurrentUserId());
        if (userApp) {
          setAnalysis(userApp);
        }
      }
    } catch (e) {
      console.error('Failed to check application status:', e);
    }
  }

  async function loadJob() {
    try {
      const res = await api.get(`/jobs/${jobId}`);
      setJob(res.data);
    } catch (e) {
      // ignore job load error in modal
    }
  }

  async function loadProfileResumeIfAny() {
    try {
      const me = await fetchMyProfile();
      if (me?.resumeFileId) {
        const blob = await downloadMyResume();
        const fileName = me.resumeFileName || 'resume.pdf';
        const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
        setResumeFile(file);
        setSelectedFileName(file.name);
        setUsingProfileResume(true);
      } else {
        setUsingProfileResume(false);
      }
    } catch (_) {
      // ignore
    }
  }

  function getCurrentUserId() {
    // This should come from your auth context
    return localStorage.getItem('userId') || '';
  }

  async function submitForAnalysis(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const fileToUse = resumeFile || e.target.resume?.files?.[0];
      if (!fileToUse) throw new Error('Please select a resume');

      // Build job description from loaded job
      const jobdescription = job?.description || '';
      const result = await analyzeResumeWebhook(fileToUse, jobdescription);

      // Normalize score to 0-100 scale
      const normalizeScore = (s) => {
        if (typeof s !== 'number' || isNaN(s)) return null;
        if (s <= 1) return Math.round(s * 100);      // e.g., 0.82 => 82
        if (s <= 10) return Math.round(s * 10);      // e.g., 8 => 80
        if (s <= 100) return Math.round(s);          // e.g., 80 => 80
        return Math.min(100, Math.round(s));
      };

      // Map webhook result to modal UI structure
      const mapped = {
        status: 'N8N_READY',
        n8nScore: normalizeScore(result.score),
        n8nSummary: result.summary || '',
        n8nKeyStrengths: Array.isArray(result.key_strengths) ? result.key_strengths : [],
        n8nMissingSkills: Array.isArray(result.missing_skills) ? result.missing_skills : [],
        n8nSuggestions: Array.isArray(result.suggestions) ? result.suggestions.join('\n') : (result.suggestions || ''),
        eligible: true,
      };
      setAnalysis(mapped);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to submit resume for analysis');
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    (async () => {
      try {
        if (!resumeFile) throw new Error('Resume not available.');
        const jobdescription = job?.description || '';
        const q = await generateInterviewQuestionsWebhook(resumeFile, jobdescription);
        const questions = Array.isArray(q?.questions) ? q.questions : [];
        onContinue?.({ ...analysis, questions });
        onClose();
      } catch (e) {
        setError(e.response?.data?.error || e.message || 'Failed to generate questions');
      }
    })();
  }

  const belowThreshold = (() => {
    if (!analysis) return false;
    if (job?.minN8nScoreForTest != null && analysis.n8nScore != null) {
      return analysis.n8nScore < job.minN8nScoreForTest;
    }
    return false;
  })();

  const canContinue = (() => {
    if (!analysis) return false;
    if (analysis.eligible === true) return true;
    return false;
  })();

  const handleAcknowledge = () => {
    setShowResult(false);
    onClose();
    navigate('/my-applications');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resume Analysis" size="lg">
      {!analysis ? (
        <div>
          <p style={{ marginBottom: 16 }}>
            Please submit your resume for AI analysis before proceeding to the skill test.
          </p>

          {job && (
            <div style={{
              background: '#0b1020', padding: 16, borderRadius: 8, marginBottom: 16,
              border: '1px solid #334155'
            }}>
              <h4 style={{ marginTop: 0 }}>{job.title || 'Job Details'}</h4>
              <div style={{ marginBottom: 8 }}>
                <strong>Company:</strong> {job.companyName}
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                <strong>Description:</strong>
                <div style={{ marginTop: 4 }}>{job.description}</div>
              </div>
              {job.requirements && (
                <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                  <strong>Requirements:</strong>
                  <div style={{ marginTop: 4 }}>{job.requirements}</div>
                </div>
              )}
              {job.minN8nScoreForTest != null && (
                <div style={{ marginTop: 12, color: '#374151' }}>
                  <strong>Minimum score to take skill test:</strong> {job.minN8nScoreForTest}
                </div>
              )}
            </div>
          )}
          
          <form className="form" onSubmit={submitForAnalysis}>
            <div className="field">
              <label>Resume *</label>
              {!usingProfileResume && (
                <input 
                  type="file" 
                  name="resume" 
                  accept=".pdf,.doc,.docx" 
                  required={!resumeFile}
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setResumeFile(f);
                    setSelectedFileName(f?.name || "");
                    setUsingProfileResume(false);
                  }}
                />
              )}
              {selectedFileName && (
                <div style={{ marginTop: 6, fontSize: '0.9em', color: '#6b7280' }}>
                  {usingProfileResume ? (
                    <span>Using profile resume: {selectedFileName}</span>
                  ) : (
                    <span>Selected: {selectedFileName}</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="field">
              <label>Cover Letter (optional)</label>
              <textarea 
                name="coverLetter" 
                rows={4} 
                placeholder="Tell us why you're interested in this position..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ color: '#ef4444', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Analyzing...' : 'Submit for Analysis'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          {analysis.status === 'N8N_ANALYSIS' ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
              <p>Analyzing your resume... This may take a few moments.</p>
            </div>
          ) : analysis.status === 'N8N_ERROR' ? (
            <div>
              <div style={{ color: '#ef4444', marginBottom: 16 }}>
                <h4>Analysis Failed</h4>
                <p>{analysis.n8nSuggestions}</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h4>Analysis Results</h4>

                {job?.minN8nScoreForTest != null && (
                  <div style={{ marginBottom: 8, color: '#374151' }}>
                    <strong>Company threshold:</strong> {job.minN8nScoreForTest}
                  </div>
                )}
                
                {analysis.n8nScore !== null && (
                  <div style={{ marginBottom: 16 }}>
                    <strong>Resume Score: </strong>
                    <span style={{ 
                      fontSize: '1.2em', 
                      fontWeight: 'bold',
                      color: (job?.minN8nScoreForTest != null
                        ? (analysis.n8nScore >= job.minN8nScoreForTest ? '#10b981' : '#ef4444')
                        : (analysis.n8nScore >= 70 ? '#10b981' : analysis.n8nScore >= 50 ? '#f59e0b' : '#ef4444'))
                    }}>
                      {analysis.n8nScore}/100
                    </span>
                  </div>
                )}

                {false && analysis.n8nSummary && (
                  <div style={{ marginBottom: 16 }}>
                    <strong>Summary:</strong>
                    <div style={{ background: '#0b1020', border: '1px solid #334155', padding: 12, borderRadius: 8, marginTop: 8, whiteSpace: 'pre-wrap' }}>
                      {analysis.n8nSummary}
                    </div>
                  </div>
                )}

                {false && Array.isArray(analysis.n8nKeyStrengths) && analysis.n8nKeyStrengths.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <strong>Key strengths:</strong>
                    <ul style={{ marginTop: 8 }}>
                      {analysis.n8nKeyStrengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(analysis.n8nMissingSkills) && analysis.n8nMissingSkills.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <strong>Missing skills:</strong>
                    <ul style={{ marginTop: 8 }}>
                      {analysis.n8nMissingSkills.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {false && analysis.n8nSuggestions && (
                  <div style={{ marginBottom: 16 }}>
                    <strong>Suggestions:</strong>
                    <div style={{ 
                      background: '#0b1020', 
                      border: '1px solid #334155',
                      padding: 12, 
                      borderRadius: 8,
                      marginTop: 8,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {analysis.n8nSuggestions}
                    </div>
                  </div>
                )}
              </div>

              {belowThreshold ? (
                <>
                  <div style={{
                    background: '#FEF2F2', 
                    color: '#991B1B', 
                    border: '1px solid #FCA5A5',
                    padding: '16px', 
                    borderRadius: '8px', 
                    marginBottom: '24px',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ marginTop: 0, color: '#991B1B' }}>Evaluation Complete</h4>
                    <p>Your resume score: <strong>{analysis.n8nScore}/100</strong></p>
                    <p>Required score: <strong>{job?.minN8nScoreForTest ?? 70}/100</strong></p>
                    <p style={{ marginBottom: 0 }}>Your application has been saved. You can view its status in My Applications.</p>
                  </div>
                  
                  <div className="modal-footer" style={{ justifyContent: 'center' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleAcknowledge}
                      style={{ minWidth: '120px' }}
                    >
                      OK
                    </button>
                  </div>
                </>
              ) : (
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={onClose}>
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
