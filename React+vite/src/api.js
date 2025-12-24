import axios from "axios";

// Use relative URLs if VITE_API_URL is empty (for Docker nginx proxy)
// Otherwise use the provided URL or fallback to localhost for local dev
const apiBaseURL = import.meta.env.VITE_API_URL !== undefined 
  ? (import.meta.env.VITE_API_URL || "") 
  : "http://localhost:9000";

const api = axios.create({
  baseURL: apiBaseURL,
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

// N8N Webhook base (proxied via backend to avoid CORS)
const N8N_PROXY_BASE = "/n8n";

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
  const baseURL = api.defaults.baseURL || "";
  const url = `${baseURL}/me/resume`;
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
  formData.append("jobdescription", jobDescription || "http://localhost:9000");
  const res = await api.post(`${N8N_PROXY_BASE}/resume-analysis`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// N8N: Interview Question Generation
export async function generateInterviewQuestionsWebhook(resumeFile, jobDescription) {
  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("jobdescription", jobDescription || "");
  const res = await api.post(`${N8N_PROXY_BASE}/interview-question`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// N8N: Interview Evaluation
export async function evaluateInterviewWebhook(historyObject) {
  const res = await api.post(`${N8N_PROXY_BASE}/interview-evaluate`, { history: historyObject });
  return res.data;
}
