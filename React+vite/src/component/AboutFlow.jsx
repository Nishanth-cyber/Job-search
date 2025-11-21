import { useEffect, useRef } from "react";

export default function AboutFlow() {
  const pathRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const path = pathRef.current;
    const wrap = wrapRef.current;
    if (!path || !wrap) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    let stepEls = Array.from(wrap.querySelectorAll('.flow-step'));
    let thresholds = [];

    const computeThresholds = () => {
      const boxTop = wrap.getBoundingClientRect().top + window.scrollY;
      const boxHeight = wrap.offsetHeight || 1;
      thresholds = stepEls.map(el => {
        const y = el.getBoundingClientRect().top + window.scrollY - boxTop;
        // Reveal later: wait until the line has gone beyond half the card
        const revealY = Math.max(0, y + el.offsetHeight * 0.55);
        return Math.min(1, revealY / boxHeight);
      });
    };

    const onScroll = () => {
      const rect = wrap.getBoundingClientRect();
      const viewH = window.innerHeight || document.documentElement.clientHeight;
      const total = rect.height + viewH * 0.4; // reduce denominator to speed up drawing
      const base = Math.max(0, (viewH * 0.6 - rect.top) / total);
      const progress = Math.min(1, base * 1.6); // multiplier speeds up coverage per scroll
      path.style.strokeDashoffset = `${length * (1 - progress)}`;

      stepEls.forEach((el, i) => {
        if (progress >= (thresholds[i] ?? 1)) el.classList.add('visible');
        else el.classList.remove('visible');
      });
    };

    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        computeThresholds();
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', computeThresholds);
      } else {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', computeThresholds);
      }
    });

    io.observe(wrap);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', computeThresholds);
      io.disconnect();
    };
  }, []);

  const steps = [
    { title: "Resume Upload", desc: "Parse PDFs and extract skills, experience, and education." },
    { title: "Skill Assessment", desc: "Generate tailored questions and score candidate answers." },
    { title: "Smart Matching", desc: "Match profiles to jobs using weighted skills and recency." },
    { title: "Apply & Track", desc: "One‑click apply and track application status in real‑time." },
    { title: "Recruiter Dashboard", desc: "Post jobs, review applicants, and manage challenges." },
  ];

  return (
    <section className="about-flow-section">
      <div className="container">
        <h2 className="about-heading">About our website</h2>
        <p className="muted" style={{ marginTop: -8, marginBottom: 18 }}>A quick tour of how everything flows from upload to hire.</p>
        <div className="flow-wrap" ref={wrapRef}>
          <svg className="flow-svg" viewBox="0 0 800 1600" preserveAspectRatio="none">
            {/* Drawing highlight only (no base track) */}
            <path
              ref={pathRef}
              className="flow-highlight"
              d="M740,80 H220 C140,80 140,180 220,180 H600 C680,180 680,300 600,300 H240 C160,300 160,420 240,420 H660 C740,420 740,540 660,540 H260 C180,540 180,660 260,660 H700 C780,660 780,780 700,780 V920"
              fill="none"
              strokeLinecap="round"
            />
            <circle className="flow-start" cx="740" cy="80" r="10" />
          </svg>
          <div className="flow-steps">
            {steps.map((s, i) => (
              <div className={`flow-step card ${i % 2 === 0 ? 'odd' : 'even'} ring-${i % 4}`} key={i}>
                <div className="flow-bullet" />
                <span className="circle-badge">{(i+1).toString().padStart(2,'0')}</span>
                <div className="flow-content pill">
                  <h4>{s.title}</h4>
                  <p className="muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
