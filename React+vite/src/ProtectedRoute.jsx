import { Navigate } from "react-router-dom";
import { useUser } from "./component/UserContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useUser();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    alert("Access denied!");
    return <Navigate to="/" replace />;
  }
  return children;
}
