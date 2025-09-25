import { useState } from "react";
import Modal from "./Modal";
import api from "../api";
import { useUser } from "./UserContext";

export default function LoginModal({ isOpen, onClose, closeOnOverlay = true, closeOnEsc = true }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { user, token } = res.data; 
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      onClose?.();
    } catch (err) {
      alert(err.response?.data || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Login" size="sm" closeOnOverlay={closeOnOverlay} closeOnEsc={closeOnEsc}>
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Email</label>
          <input autoFocus type="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        </div>
      </form>
    </Modal>
  );
}
