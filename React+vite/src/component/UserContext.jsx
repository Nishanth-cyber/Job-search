import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Restore user only if token is present and still valid
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("authToken");
    if (!token) {
      localStorage.removeItem("user");
      return;
    }
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    // Verify token with backend; if invalid, clear stored auth
    api
      .get("/me")
      .then(res => {
        if (res?.data) {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        }
      })
      .catch(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setUser(null);
      });
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
