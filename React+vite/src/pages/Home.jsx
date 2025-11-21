import heroImg from "../assets/hero.png";
import AboutFlow from "../component/AboutFlow";
import Footer from "../component/Footer";

export default function Home() {
  return (
    <div className="home">
      <section className="home-hero fade-in">
        <div className="blob-wrap"><div className="blob" /></div>
        <div className="hero-grid">
          <div className="hero-media">
            <img alt="Career" src={heroImg} />
          </div>
          <div className="hero-copy">
            <h1 className="title-grad">Develop your career in a new and unique way</h1>
            <p className="muted">
              Discover curated jobs, practice with AI interviews, and showcase your skills through challenges. Recruiters can post roles and review smart‑scored applications.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href="/jobs">Find Jobs</a>
            </div>
          </div>
        </div>
      </section>
      <AboutFlow />
      <Footer />
    </div>
  );
}
