import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useUser } from "./UserContext";

export default function LoginForm({ setIsOpen }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      // Backend returns { user, token }
      const { user, token } = res.data || {};
      if (!user || !token) {
        throw new Error("Malformed login response");
      }
      // Save token for Authorization header via axios interceptor
      localStorage.setItem("authToken", token);
      // Save user in context and storage
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      alert(`Welcome ${user.username} (${user.role})`);
      setIsOpen(false);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data || err.message || "Login failed";
      alert(msg);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2 style={{ marginBottom: "10px" }}>Login</h2>
      <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required />
      <button type="submit">Login</button>
    </form>
  );
}
