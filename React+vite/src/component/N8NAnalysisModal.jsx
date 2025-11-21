import React, { useState, useEffect } from 'react';
import api from '../api';
import Modal from './Modal';

export default function N8NAnalysisModal({ jobId, isOpen, onClose, onContinue }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [job, setJob] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    if (isOpen && jobId) {
      // Check for existing application
      checkApplicationStatus();
      loadJob();
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

  function getCurrentUserId() {
    // This should come from your auth context
    return localStorage.getItem('userId') || '';
  }

  async function submitForAnalysis(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('jobId', jobId);
      const fileToUse = resumeFile || e.target.resume.files[0];
      if (!fileToUse) throw new Error('Please select a resume');
      formData.append('resume', fileToUse);

      // Preview only (no persistence)
      const res = await api.post('/applications/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnalysis(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to submit resume for analysis');
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    // If we already have a persisted application (status present), continue immediately
    if (analysis && analysis.status === 'READY_FOR_TEST') {
      onContinue?.(analysis);
      onClose();
      return;
    }

    // From preview -> create application, then continue
    (async () => {
      try {
        if (!resumeFile) {
          throw new Error('Please select your resume again.');
        }
        const fd = new FormData();
        fd.append('jobId', jobId);
        fd.append('resume', resumeFile);
        if (coverLetter) fd.append('coverLetter', coverLetter);
        const res = await api.post('/applications/initial', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const app = res.data;
        setAnalysis(app);
        if (app.status !== 'READY_FOR_TEST') {
          // Not eligible or error; just update view
          return;
        }
        onContinue?.(app);
        onClose();
      } catch (e) {
        setError(e.response?.data?.error || e.message || 'Failed to proceed');
      }
    })();
  }

  const belowThreshold = (() => {
    if (!analysis) return false;
    if (analysis.status === 'N8N_BELOW_THRESHOLD') return true;
    if (job?.minN8nScoreForTest != null && analysis.n8nScore != null) {
      return analysis.n8nScore < job.minN8nScoreForTest;
    }
    return false;
  })();

  const canContinue = (() => {
    if (!analysis) return false;
    if (analysis.status === 'READY_FOR_TEST') return true;
    if (analysis.eligible === true) return true; // from preview endpoint
    return false;
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resume Analysis" size="lg">
      {!analysis ? (
        <div>
          <p style={{ marginBottom: 16 }}>
            Please submit your resume for AI analysis before proceeding to the skill test.
          </p>

          {job && (
            <div style={{
              background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 16,
              border: '1px solid #e5e7eb'
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
              <input 
                type="file" 
                name="resume" 
                accept=".pdf,.doc,.docx" 
                required 
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setResumeFile(f);
                  setSelectedFileName(f?.name || "");
                }}
              />
              {selectedFileName && (
                <div style={{ marginTop: 6, fontSize: '0.9em', color: '#6b7280' }}>
                  Selected: {selectedFileName}
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

                {analysis.n8nSummary && (
                  <div style={{ marginBottom: 16 }}>
                    <strong>Summary:</strong>
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginTop: 8, whiteSpace: 'pre-wrap' }}>
                      {analysis.n8nSummary}
                    </div>
                  </div>
                )}

                {Array.isArray(analysis.n8nKeyStrengths) && analysis.n8nKeyStrengths.length > 0 && (
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

                {analysis.n8nSuggestions && (
                  <div style={{ marginBottom: 16 }}>
                    <strong>Suggestions:</strong>
                    <div style={{ 
                      background: '#f8fafc', 
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

              {belowThreshold && (
                <div style={{
                  background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5',
                  padding: 12, borderRadius: 8, marginBottom: 16
                }}>
                  Your score {analysis.n8nScore} is below the company threshold {job?.minN8nScoreForTest ?? 70}. You cannot take the skill test for this job.
                </div>
              )}

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
                <button className="btn btn-primary" onClick={handleContinue} disabled={belowThreshold || !canContinue}>
                  {belowThreshold || !canContinue ? 'Not Eligible for Skill Test' : 'Continue to Skill Test'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
