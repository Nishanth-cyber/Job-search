import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./component/UserContext";
import Navbar from "./component/Navbar";
import Home from "./pages/Home";
import ProtectedRoute from "./ProtectedRoute";
import "./App.css";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import "./component/modal.css";
import AdminPostJob from "./pages/AdminPostJob";
import MyJobs from "./pages/MyJobs";
import MyApplications from "./pages/MyApplications";
import AdminJobApplications from "./pages/AdminJobApplications";
import ResumeTest from "./pages/ResumeTest";

function App() {
  return (
    <UserProvider>
      <Router>
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/jobs/:id/test" element={
              <ProtectedRoute allowedRoles={["JOBSEEKER"]}>
                <ResumeTest />
              </ProtectedRoute>
            } />
            <Route path="/admin/post-job" element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminPostJob />
              </ProtectedRoute>
            } />
            <Route path="/admin/my-jobs" element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <MyJobs />
              </ProtectedRoute>
            } />
            <Route path="/admin/jobs/:id/applications" element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminJobApplications />
              </ProtectedRoute>
            } />
            <Route path="/me/applications" element={
              <ProtectedRoute allowedRoles={["JOBSEEKER"]}>
                <MyApplications />
              </ProtectedRoute>
            } />

          </Routes>
        </main>
      </Router>
    </UserProvider>
  );
}

export default App;
