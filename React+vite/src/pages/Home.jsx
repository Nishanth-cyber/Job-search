export default function Home() {
  return (
    <section className="hero fade-in">
      <div className="blob-wrap"><div className="blob" /></div>
      <h1 className="title-grad">Find your next great job</h1>
      <p className="muted" style={{ maxWidth: 760 }}>
        Browse open roles, upload your resume, and get AI-powered skill matching against job descriptions.
        Admins can post roles with company details and review applications with scores.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a className="btn btn-primary" href="/jobs">Browse Jobs</a>

      </div>

      <hr style={{ borderColor: '#334155', margin: '28px 0' }} />

      <h2 style={{ marginBottom: 8 }}>What’s New</h2>
      <ul style={{ lineHeight: 1.8, marginLeft: 18 }}>
        <li>
          <strong>Role‑based navigation</strong>: Admins see <em>My Jobs</em> and <em>Post Job</em>; Jobseekers see <em>Jobs</em> and <em>My Applications</em>.
        </li>
        <li>
          <strong>Admin job posting</strong>: Required validation for company name, description, location, and skills with clear error messages.
        </li>
        <li>
          <strong>AI resume test (5 questions)</strong>: Before applying, candidates answer five tailored questions.
          Questions are generated via LLM with a safe fallback; answers are evaluated and a <em>test score</em> is attached to the application.
        </li>
        <li>
          <strong>Secure, structured backend</strong>: JWT‑based auth, CORS configured, unified error responses, and dependency fixes for stable PDF parsing.
        </li>
      </ul>
    </section>
  );
}
