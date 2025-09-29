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
import Challenges from "./pages/Challenges";
import ChallengeDetail from "./pages/ChallengeDetail";
import CompanyPostChallenge from "./pages/CompanyPostChallenge";
import AdminDashboard from "./pages/AdminDashboard";
import ChallengeSubmissions from "./pages/ChallengeSubmissions";

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
              <ProtectedRoute allowedRoles={["RECRUITER"]}>
                <AdminPostJob />
              </ProtectedRoute>
            } />
            <Route path="/admin/my-jobs" element={
              <ProtectedRoute allowedRoles={["RECRUITER"]}>
                <MyJobs />
              </ProtectedRoute>
            } />
            <Route path="/admin/jobs/:id/applications" element={
              <ProtectedRoute allowedRoles={["RECRUITER"]}>
                <AdminJobApplications />
              </ProtectedRoute>
            } />
            <Route path="/me/applications" element={
              <ProtectedRoute allowedRoles={["JOBSEEKER"]}>
                <MyApplications />
              </ProtectedRoute>
            } />

            {/* Challenges feature */}
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/challenges/:id" element={<ChallengeDetail />} />
            <Route path="/company/challenges/:id/submissions" element={
              <ProtectedRoute allowedRoles={["RECRUITER"]}>
                <ChallengeSubmissions />
              </ProtectedRoute>
            } />
            <Route path="/company/post-challenge" element={
              <ProtectedRoute allowedRoles={["RECRUITER"]}>
                <CompanyPostChallenge />
              </ProtectedRoute>
            } />

            {/* Admin Dashboard */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

          </Routes>
        </main>
      </Router>
    </UserProvider>
  );
}

export default App;
