import { useEffect, useState } from "react";
import Modal from "./Modal";
import api from "../api";

export default function ProfileModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "",
    profileSummary: "", skills: [], experience: "",
    education: "", location: "",
    companyName: "", companyWebsite: "", companySize: "", industry: "",
    role: ""
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!isOpen) return;
      try {
        const res = await api.get("/me");
        const user = res.data;
        setForm({
          ...form,
          ...user,
          skills: user.skills || [],
        });
      } catch (e) {
        // ignore
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        skills: Array.isArray(form.skills)
          ? form.skills
          : String(form.skills)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
      };
      await api.put("/me", payload);
      onClose?.();
    } catch (e) {
      alert(e.response?.data || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function uploadResume(e) {
    e.preventDefault();
    if (!resumeFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", resumeFile);
      await api.post("/me/resume", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Resume uploaded");
    } catch (e) {
      alert(e.response?.data || "Failed to upload resume");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Profile" size="lg">
      <form className="form" onSubmit={saveProfile}>
        <div className="row cols-2">
          <div className="field">
            <label>First name</label>
            <input value={form.firstName || ""} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="field">
            <label>Last name</label>
            <input value={form.lastName || ""} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>

        <div className="row cols-2">
          <div className="field">
            <label>Phone</label>
            <input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field">
            <label>Location</label>
            <input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
        </div>

        <div className="field">
          <label>Profile summary</label>
          <textarea rows={4} value={form.profileSummary || ""} onChange={(e) => setForm({ ...form, profileSummary: e.target.value })} />
        </div>

        <div className="row cols-2">
          <div className="field">
            <label>Skills (comma-separated)</label>
            <input
              value={Array.isArray(form.skills) ? form.skills.join(", ") : form.skills || ""}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Experience</label>
            <input value={form.experience || ""} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
          </div>
        </div>

        <div className="row cols-2">
          <div className="field">
            <label>Education</label>
            <input value={form.education || ""} onChange={(e) => setForm({ ...form, education: e.target.value })} />
          </div>
          <div className="field">
            <label>Resume</label>
            <input type="file" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={uploadResume} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Resume"}
              </button>
            </div>
          </div>
        </div>

        {form.role === "ADMIN" && (
          <>
            <div className="row cols-2">
              <div className="field">
                <label>Company Name</label>
                <input value={form.companyName || ""} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div className="field">
                <label>Company Website</label>
                <input value={form.companyWebsite || ""} onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })} />
              </div>
            </div>
            <div className="row cols-2">
              <div className="field">
                <label>Company Size</label>
                <input value={form.companySize || ""} onChange={(e) => setForm({ ...form, companySize: e.target.value })} />
              </div>
              <div className="field">
                <label>Industry</label>
                <input value={form.industry || ""} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
              </div>
            </div>
          </>
        )}

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </form>
    </Modal>
  );
}
