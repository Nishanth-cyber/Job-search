import { useState } from "react";
import { Link } from "react-router-dom";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";
import ProfileModal from "./ProfileModal";
import { useUser } from "./UserContext";
import { useEffect } from "react";

export default function Navbar() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, setUser } = useUser();

  useEffect(() => {
    function onOpenSignup() { setSignupOpen(true); }
    window.addEventListener('open-signup-modal', onOpenSignup);
    return () => window.removeEventListener('open-signup-modal', onOpenSignup);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo">Job_Portal</div>
        <div>
          <Link to="/">Home</Link>
          {/* Role-based primary nav links */}
          {(!user || user.role === 'JOBSEEKER') && (
            <Link to="/jobs">Jobs</Link>
          )}
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <>
                  <Link to="/admin/my-jobs">My Jobs</Link>
                  <Link to="/admin/post-job">Post Job</Link>
                </>
              )}
              {user.role === 'JOBSEEKER' && (
                <Link to="/me/applications">My Applications</Link>
              )}
              <button className="btn btn-secondary" onClick={() => setProfileOpen(true)}>Profile</button>
              <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setLoginOpen(true)}>Login</button>
              <button className="btn btn-primary" onClick={() => setSignupOpen(true)}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} closeOnOverlay={false} closeOnEsc={false} />
      <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} closeOnOverlay={false} closeOnEsc={false} />
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
