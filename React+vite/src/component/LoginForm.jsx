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
      alert(`Welcome ${res.data.username} (${res.data.role})`);
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      setIsOpen(false);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data || "Login failed");
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
