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
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverItem, setHoverItem] = useState(null);

  useEffect(() => {
    function onOpenSignup() { setSignupOpen(true); }
    window.addEventListener('open-signup-modal', onOpenSignup);
    return () => window.removeEventListener('open-signup-modal', onOpenSignup);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setMenuOpen(false);
  };

  const isRecruiter = !!user && (user.role === 'RECRUITER' || user.role === 'COMPANY');
  const isAdmin = !!user && user.role === 'ADMIN';
  const isJobseeker = !!user && user.role === 'JOBSEEKER';

  return (
    <>
      {/* local styles for dropdown animation */}
      <style>{`
        .nav-dropdown { animation: nav-fade-in 140ms ease-out; }
        @keyframes nav-fade-in { from { opacity: 0; transform: translateY(-6px);} to { opacity: 1; transform: translateY(0);} }
      `}</style>
      <nav className="navbar">
        <div className="logo">JOBSAGA</div>
        <div>
          <Link to="/">Home</Link>
          {!(user && user.role === 'ADMIN') && (
            <Link to="/challenges">Challenges</Link>
          )}
          {/* Role-based primary nav links */}
          {(!user || user.role === 'JOBSEEKER') && (
            <Link to="/jobs">Jobs</Link>
          )}
          {user ? (
            <>
              {isRecruiter && (
                <>
                  <Link to="/admin/my-jobs">My Jobs</Link>
                  <Link to="/admin/post-job">Post Job</Link>
                  <Link to="/company/post-challenge">Post Challenge</Link>
                </>
              )}
              {isAdmin && (
                <>
                  <Link to="/admin/dashboard">Admin Dashboard</Link>
                </>
              )}
              {user.role === 'JOBSEEKER' && (
                <Link to="/me/applications">My Applications</Link>
              )}
              <div style={{ display:'inline-block', position:'relative', marginLeft: 8 }}>
                <button
                  aria-label="Account menu"
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    height: 36,
                    width: 36,
                    borderRadius: '50%',
                    border: '1px solid #e5e7eb',
                    background: '#f3f4f6',
                    color: '#111827',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </button>
                {menuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      marginTop: 8,
                      background: '#0b0b0b',
                      border: '1px solid #1f2937',
                      borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.42)',
                      minWidth: 160,
                      zIndex: 50,
                      color: '#e5e7eb'
                    }}
                    className="nav-dropdown"
                  >
                    <button
                      onMouseEnter={() => setHoverItem('profile')}
                      onMouseLeave={() => setHoverItem(null)}
                      onClick={() => { setProfileOpen(true); setMenuOpen(false); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: hoverItem === 'profile' ? '#f59e0b' : '#e5e7eb'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {/* User icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/>
                        </svg>
                        <span>Profile</span>
                      </span>
                    </button>
                    <div style={{ height: 1, background: '#1f2937' }} />
                    <button
                      onMouseEnter={() => setHoverItem('logout')}
                      onMouseLeave={() => setHoverItem(null)}
                      onClick={handleLogout}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        background: 'transparent',
                        border: 'none',
                        color: hoverItem === 'logout' ? '#f59e0b' : '#e5e7eb',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {/* Logout icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 13v-2H7V8l-5 4 5 4v-3h9z"/>
                          <path d="M20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
                        </svg>
                        <span>Logout</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>
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
