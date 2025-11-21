import { useState } from "react";
import api from "../api";

export default function AdminPostJob() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    jobType: "FULL_TIME",
    experienceLevel: "MID",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    requiredSkills: "",
    preferredSkills: "",
    requirements: "",
    benefits: "",
    applicationDeadline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function validate(values) {
    const e = {};
    if (!values.title.trim()) e.title = "Title is required";
    if (!values.description.trim()) e.description = "Description is required";
    if (!values.location.trim()) e.location = "Location is required";
    if (!String(values.requiredSkills).trim()) e.requiredSkills = "Required skills are required";
    if (!String(values.requirements).trim()) e.requirements = "Requirements are required";
    return e;
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const errs = validate(form);
      setErrors(errs);
      if (Object.keys(errs).length > 0) {
        // Surface client-side validation immediately
        const firstKey = Object.keys(errs)[0];
        alert(errs[firstKey] || 'Please fix the highlighted fields');
        // Try to focus the first invalid input
        requestAnimationFrame(() => {
          const el = document.querySelector(`[name="${firstKey}"]`);
          if (el) el.focus();
        });
        setSubmitting(false);
        return;
      }

      const payload = {
        ...form,
        // companyName is resolved on backend from recruiter profile
        salaryMin: form.salaryMin ? Number(form.salaryMin) : 0,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : 0,
        requiredSkills: String(form.requiredSkills)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        preferredSkills: String(form.preferredSkills)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        applicationDeadline: form.applicationDeadline || null,
        isActive: true,
      };
      // Helpful log in case Network tab doesn't show a request
      console.log('Posting job payload', payload);
      await api.post("/jobs", payload);
      alert("Job posted successfully");
      setForm({
        ...form,
        title: "",
        description: "",
        location: "",
        salaryMin: "",
        salaryMax: "",
        requiredSkills: "",
        preferredSkills: "",
        requirements: "",
        benefits: "",
      });
      setErrors({});
    } catch (e) {
      // Try to surface backend validation errors nicely
      const data = e.response?.data;
      if (data && typeof data === 'object') {
        if (data.fields && typeof data.fields === 'object') {
          setErrors((prev) => ({ ...prev, ...data.fields }));
          alert(data.error || 'Validation failed');
        } else if (data.error) {
          alert(data.error);
        } else {
          alert(JSON.stringify(data));
        }
      } else {
        const msg = typeof data === 'string' ? data : (e.message || 'Failed to post job');
        alert(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fade-in">
      <h1 className="title-grad" style={{ marginBottom: 12 }}>Post a Job</h1>
      <div className="card">
        <form className="form" onSubmit={submit}>
          <div className="row cols-2">
            <div className="field">
              <label>Title</label>
              <input name="title" placeholder="e.g., Senior Java Developer" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              {errors.title && <small className="text-error">{errors.title}</small>}
            </div>
            <div className="field">
              <label>Job Type</label>
              <select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })}>
                <option>FULL_TIME</option>
                <option>PART_TIME</option>
                <option>CONTRACT</option>
                <option>INTERNSHIP</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Description</label>
            <textarea name="description" rows={4} placeholder="Describe the role, responsibilities, and expectations" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            {errors.description && <small className="text-error">{errors.description}</small>}
          </div>

          <div className="row cols-2">
            <div className="field">
              <label>Company Name</label>
              <input name="companyName" placeholder="e.g., Demo Company" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
              {errors.companyName && <small className="text-error">{errors.companyName}</small>}
            </div>
            <div className="field">
              <label>Currency</label>
              <input placeholder="e.g., USD, INR" value={form.salaryCurrency} onChange={(e) => setForm({ ...form, salaryCurrency: e.target.value })} />
            </div>
          </div>

          <div className="row cols-2">
            <div className="field">
              <label>Location</label>
              <input name="location" placeholder="City, Country or Remote" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
              {errors.location && <small className="text-error">{errors.location}</small>}
            </div>
            <div className="field">
              <label>Experience Level</label>
              <select value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>
                <option>ENTRY</option>
                <option>MID</option>
                <option>SENIOR</option>
                <option>EXECUTIVE</option>
              </select>
            </div>
          </div>

          <div className="row cols-2">
            <div className="field">
              <label>Application Deadline (optional)</label>
              <input type="datetime-local" value={form.applicationDeadline} onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })} />
            </div>
          </div>

          <div className="row cols-2">
            <div className="field">
              <label>Salary Min</label>
              <input type="number" placeholder="e.g., 60000" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} />
            </div>
            <div className="field">
              <label>Salary Max</label>
              <input type="number" placeholder="e.g., 90000" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} />
            </div>
          </div>

          <div className="row cols-2">
            <div className="field">
              <label>Required Skills</label>
              <input name="requiredSkills" placeholder="Comma-separated, e.g., Java, Spring, MongoDB" value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} />
              <small>These are the must-have skills for the role.</small>
              {errors.requiredSkills && <small className="text-error">{errors.requiredSkills}</small>}
            </div>
            <div className="field">
              {/* spacer to keep grid alignment */}
            </div>
          </div>

          <div className="row cols-2">
            <div className="field">
              <label>Preferred Skills</label>
              <input placeholder="Comma-separated, e.g., Docker, Kubernetes, AWS" value={form.preferredSkills} onChange={(e) => setForm({ ...form, preferredSkills: e.target.value })} />
            </div>
            <div className="field">
              <label>Requirements</label>
              <textarea name="requirements" rows={3} placeholder="e.g., 5+ years of backend development, strong OOP principles" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
              {errors.requirements && <small className="text-error">{errors.requirements}</small>}
            </div>
          </div>

          <div className="field">
            <label>Benefits</label>
            <textarea rows={3} placeholder="e.g., Health insurance, Remote-friendly, Learning budget" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Posting..." : "Post Job"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
