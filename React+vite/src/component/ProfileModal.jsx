import { useEffect, useState } from "react";
import Modal from "./Modal";
import api from "../api";
import { useUser } from "./UserContext";

export default function ProfileModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "",
    profileSummary: "", skills: [], experience: "",
    education: "", location: "",
    companyName: "", companyDescription: "",
    role: ""
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { user } = useUser();
  const normalizedRole = String(user?.role || form.role || '').toUpperCase();
  const isRecruiter = (normalizedRole === 'RECRUITER' || normalizedRole === 'COMPANY')
    || !!form.companyId || !!form.companyName || !!user?.companyId || !!user?.companyName;

  useEffect(() => {
    async function load() {
      if (!isOpen) return;
      try {
        const res = await api.get("/me");
        const user = res.data;
        setForm(prev => ({
          ...prev,
          ...user,
          skills: user.skills || [],
        }));
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
      // Reload user data to get updated resume info
      const res = await api.get("/me");
      const user = res.data;
      setForm(prev => ({
        ...prev,
        ...user,
        skills: user.skills || [],
      }));
    } catch (e) {
      alert(e.response?.data || "Failed to upload resume");
    } finally {
      setUploading(false);
    }
  }

  async function uploadLogo(e) {
    e.preventDefault();
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", logoFile);
      await api.post("/me/company-logo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Company logo uploaded");
      const res = await api.get("/me");
      const user = res.data;
      setForm({
        ...form,
        ...user,
        skills: user.skills || [],
      });
    } catch (e) {
      alert(e.response?.data || "Failed to upload company logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  function previewResume() {
    if (form.resumeFileId) {
      window.open(`${api.defaults.baseURL || ''}/me/resume`, '_blank');
    }
  }

  function previewCompanyLogo() {
    if (form.companyLogoFileId) {
      window.open(`${api.defaults.baseURL || ''}/companies/${form.id}/logo`, '_blank');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Profile" size="lg">
      <form className="form" onSubmit={saveProfile}>
        {!isRecruiter && (
          <>
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
                  {form.resumeFileId && (
                    <button 
                      className="btn btn-primary" 
                      onClick={previewResume} 
                      style={{ marginLeft: 8 }}
                    >
                      Preview
                    </button>
                  )}
                  {form.resumeFileName && (
                    <div style={{ marginTop: 4, fontSize: '0.9em', color: '#666' }}>
                      Current: {form.resumeFileName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {isRecruiter && (
          <>
            <div className="row cols-2">
              <div className="field">
                <label>Company Name</label>
                <input value={form.companyName || ""} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div className="field">
                <label>Company Logo</label>
                <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                <div style={{ marginTop: 8 }}>
                  <button className="btn btn-secondary" onClick={uploadLogo} disabled={uploadingLogo}>
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </button>
                  {form.companyLogoFileId && (
                    <button 
                      className="btn btn-primary" 
                      onClick={previewCompanyLogo}
                      style={{ marginLeft: 8 }}
                    >
                      Preview
                    </button>
                  )}
                  {form.companyLogoFileName && (
                    <div style={{ marginTop: 4, fontSize: '0.9em', color: '#666' }}>
                      Current: {form.companyLogoFileName}
                    </div>
                  )}
                  {form.companyLogoFileId && (
                    <div style={{ marginTop: 8 }}>
                      <img
                        alt="Company Logo"
                        src={`${api.defaults.baseURL || ''}/companies/${form.id}/logo`}
                        style={{ height: 48, width: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="row cols-2">
              <div className="field">
                <label>Company Website</label>
                <input placeholder="https://yourcompany.com" value={form.companyWebsite || ""} onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })} />
              </div>
              <div className="field">
                <label>Contact Phone</label>
                <input placeholder="Company contact number" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Company Information</label>
              <textarea rows={3} value={form.companyDescription || ""} onChange={(e) => setForm({ ...form, companyDescription: e.target.value })} />
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
