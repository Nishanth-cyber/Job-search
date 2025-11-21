export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container foot-grid">
        <div>
          <div className="logo">JOBSAGA</div>
          <p className="muted" style={{maxWidth: 420}}>A modern job portal with smart matching and recruiter tools.</p>
        </div>
        <nav className="foot-links">
          <div>
            <h5>Product</h5>
            <a href="/jobs">Jobs</a>
            <a href="/challenges">Challenges</a>
          </div>
          <div>
            <h5>Company</h5>
            <a href="#">About</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
          </div>
          <div>
            <h5>Legal</h5>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </nav>
      </div>
      <div className="container foot-bottom">
        <span className="muted">© {new Date().getFullYear()} Jobsaga. All rights reserved.</span>
      </div>
    </footer>
  );
}
