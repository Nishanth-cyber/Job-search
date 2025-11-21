import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000",
  withCredentials: true,
});

// Attach Bearer token from localStorage to all requests
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {
    // ignore storage errors
  }
  return config;
});

export default api;

// N8N Webhook base
const N8N_BASE_URL = "https://moonknight.app.n8n.cloud/webhook";

// Helper to include auth header from localStorage for fetch calls
function authHeaders() {
  try {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (_) {
    return {};
  }
}

// Download the current user's stored resume as a Blob
export async function downloadMyResume() {
  const url = `${api.defaults.baseURL || ""}/me/resume`;
  const res = await fetch(url, { credentials: "include", headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to download resume");
  const blob = await res.blob();
  return blob;
}

// Fetch the current user's profile (to check for resumeFileId, etc.)
export async function fetchMyProfile() {
  const res = await api.get("/me");
  return res.data;
}

// N8N: Resume Analysis
export async function analyzeResumeWebhook(resumeFile, jobDescription) {
  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("jobdescription", jobDescription || "");
  const res = await fetch(`${N8N_BASE_URL}/resume-analysis`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Resume analysis failed");
  return res.json();
}

// N8N: Interview Question Generation
export async function generateInterviewQuestionsWebhook(resumeFile, jobDescription) {
  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("jobdescription", jobDescription || "");
  const res = await fetch(`${N8N_BASE_URL}/interview-question`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Question generation failed");
  return res.json();
}

// N8N: Interview Evaluation
export async function evaluateInterviewWebhook(historyObject) {
  const res = await fetch(`${N8N_BASE_URL}/interview-evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history: historyObject }),
  });
  if (!res.ok) throw new Error("Interview evaluation failed");
  return res.json();
}
