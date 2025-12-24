import { useState } from "react";
import api from "../api";

export default function CompanyPostChallenge() {
  const [form, setForm] = useState({
    title: "",
    companyName: "",
    difficulty: "Medium",
    skills: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        skills: form.skills
          ? form.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };
      await api.post("/challenges", payload);
      alert("Challenge posted successfully");
      setForm({ title: "", companyName: "", difficulty: "Medium", skills: "", description: "" });
    } catch (e) {
      alert(e.response?.data || "Failed to post challenge");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in">
      <h1 className="title-grad" style={{ marginBottom: 8 }}>Post a Company Challenge</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
        Describe a real problem your team faces. Job seekers will submit solutions.
      </p>
      <form className="form" onSubmit={submit}>
        <div className="row cols-2">
          <div className="field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="field">
            <label>Company Name</label>
            <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
          </div>
        </div>
        <div className="row cols-2">
          <div className="field">
            <label>Difficulty</label>
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div className="field">
            <label>Skills (comma separated)</label>
            <input placeholder="React, Node, SQL" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea rows={8} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </div>
        <div className="modal-footer">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Posting..." : "Post Challenge"}
          </button>
        </div>
      </form>
    </div>
  );
}
