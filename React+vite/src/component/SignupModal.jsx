import { useState } from "react";
import Modal from "./Modal";
import api from "../api";

export default function SignupModal({ isOpen, onClose, closeOnOverlay = true, closeOnEsc = true }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "JOBSEEKER",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/signup", form);
      alert("Signup successful. Please login.");
      onClose?.();
    } catch (err) {
      alert(err.response?.data || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create an account" size="md" closeOnOverlay={closeOnOverlay} closeOnEsc={closeOnEsc}>
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Username</label>
          <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        </div>
        <div className="field">
          <label>Role</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="JOBSEEKER">Jobseeker</option>
            <option value="ADMIN">Admin (Recruiter)</option>
          </select>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating..." : "Sign Up"}</button>
        </div>
      </form>
    </Modal>
  );
}
