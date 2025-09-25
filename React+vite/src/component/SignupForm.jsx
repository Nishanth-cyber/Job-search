import { useState } from "react";
import api from "../api";
import { useUser } from "./UserContext";

export default function SignupForm({ setIsOpen }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Jobseeker");
  const { setUser } = useUser();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/signup", { email, username, password, role });
      alert("Signup successful! Welcome " + res.data.username);
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      setIsOpen(false);
    } catch (err) {
      alert(err.response?.data || "Signup failed");
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <h2 style={{ marginBottom: "10px" }}>Sign Up</h2>
      <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required />
      <input type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} required />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required />
      
      <select onChange={e => setRole(e.target.value)} value={role}>
        <option value="Jobseeker">Jobseeker</option>
        <option value="Recruiter">Recruiter</option>
      </select>
      
      <button type="submit">Sign Up</button>
    </form>
  );
}
