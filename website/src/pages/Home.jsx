import { Link } from 'react-router-dom'
import BeforeAfterDemo from '../components/BeforeAfterDemo.jsx'
import {
  IconEye, IconContrast, IconMic, IconSpeaker, IconKeyboard, IconImage,
  IconShield, IconArrowRight, IconCheck, IconStar,
} from '../components/Icons.jsx'
import img from '../assets/img.png'
import { useState } from "react";
import { useAuth } from "../Contexts/AuthContext.jsx";
import AuthModal from "../components/Auth.jsx";
import darkImg from "../assets/dark-img.png";
import { useTheme } from "../theme/ThemeContext.jsx";
import TailoredFeaturesPanel from '../components/TailoredFeaturesPanel.jsx';

const groups = [
  { icon: IconEye, title: 'Blind & low vision', text: 'AI image labeling, OCR, and ARIA fixes make pages make sense out loud.' },
  { icon: IconContrast, title: 'Color vision deficiency', text: 'Color-blind presets and WCAG-checked contrast, without redesigning the page.' },
  { icon: IconSpeaker, title: 'Dyslexia & reading fatigue', text: 'Text-to-speech and paced-reading profiles cut cognitive load on dense pages.' },
  { icon: IconKeyboard, title: 'Motor impairments', text: 'Voice commands and better keyboard flow replace precise, repeated clicking.' },
]

const features = [
  { icon: IconContrast, title: 'One-click accessibility mode', text: 'A single audit finds missing alt text, poor contrast, and broken navigation, then fixes what it safely can.' },
  { icon: IconImage, title: 'AI image labeling & OCR', text: 'Unlabeled images get clear, editable descriptions — generated in the browser, not guessed at.' },
  { icon: IconSpeaker, title: 'Text-to-speech', text: 'Read a selection or the full page aloud, with simple playback controls and no surprise autoplay.' },
  { icon: IconMic, title: 'Voice commands', text: 'Scroll, navigate, and trigger actions hands-free — built for days when a mouse is hard to use.' },
]

const testimonials = [
  {
    quote: 'I turned on one-click mode for my course portal and could finally read the syllabus without a headache by page three.',
    name: 'Priya M.',
    role: 'Low vision, university student',
  },
  {
    quote: 'The voice commands mean I do not have to fight a trackpad on bad pain days. It gives time back.',
    name: 'Daniel R.',
    role: 'Motor impairment, remote support agent',
  },
  {
    quote: 'Text-to-speech plus the paced reading profile is the first setup that has not left me exhausted by lunchtime.',
    name: 'Ade O.',
    role: 'Dyslexia, policy analyst',
  },
]

export default function Home() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  function handleAddToChrome(e) {
    if (!isAuthenticated) {
      e.preventDefault(); 
      setAuthMode("login");
      setAuthModalOpen(true); 
    }
  }
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Free Chrome extension</span>
            <h1>
              Accessibility support,
              <br />
              <span className="hero-accent">one click away.</span>
            </h1>
            <p className="lede">
              Making every website accessible in seconds. NeuroAccess uses AI to
              detect and repair accessibility barriers—improving readability,
              navigation, image understanding, and voice interaction for people
              with visual, cognitive, motor, and reading disabilities, all while
              keeping your data private.
            </p>
            <div className="hero-cta-row">
              <Link
                to="/setup"
                className="btn btn-primary btn-lg"
                onClick={handleAddToChrome}
              >
                Add to Chrome — free <IconArrowRight width={18} height={18} />
              </Link>

              
              <Link to="/features" className="btn btn-secondary btn-lg">
                See how it works
              </Link>
            </div>
            <div className="hero-trust">
              <div className="hero-trust-item">
                <IconShield width={18} height={18} />
                Local-first, no browsing history leaves your device
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <BeforeAfterDemo />
          </div>
        </div>
      </section>

       {/* ============ TAILORED FOR YOU (only shows if signed in) ============ */}
      <section className="section">
        <div className="container">
          <TailoredFeaturesPanel />
        </div>
      </section>

      {/* ============ WHO IT HELPS ============ */}
      <section className="section groups-section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Built for real barriers</span>
            <h2>Every profile fixes a different kind of friction</h2>
            <p>
              Accessibility needs aren't one-size-fits-all. NeuroAccess ships
              four starting profiles, then lets you fine-tune per site.
            </p>
          </div>
          <div className="groups-grid">
            {groups.map((g) => (
              <div className="group-card card" key={g.title}>
                <div className="group-icon">
                  <g.icon width={22} height={22} />
                </div>
                <h3>{g.title}</h3>
                <p>{g.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SPLIT FEATURE (compassionate-care style block) ============ */}
      <section className="section split-section">
        <div className="container split-grid">
          <div className="split-visual">
            <div className="split-image card">
              <div className="split-image-inner">
                <img
                  src={theme === "dark" ? darkImg : img}
                  alt="NeuroAccess features"
                  className="features-img"
                />
              </div>
            </div>
            <div className="split-stat card">
              <div className="split-stat-number">4</div>
              <div>
                <strong>Accessibility profiles</strong>
                <span>
                  Default, Blind, Low Vision, Dyslexic — plus per-site overrides
                </span>
              </div>
            </div>
          </div>
          <div className="split-copy">
            <span className="eyebrow">Independence, not intervention</span>
            <h2>Designed to reduce blockers in seconds, not minutes</h2>
            <p className="lede">
              Forms for school admissions, banking, and healthcare weren't built
              with every reader in mind. NeuroAccess runs its audit the moment
              you land on a page, so the fix is ready before frustration sets
              in.
            </p>
            <ul className="split-list">
              <li>
                <IconCheck width={18} height={18} /> Before/after issue summary
                on every page
              </li>
              <li>
                <IconCheck width={18} height={18} /> Site-level memory, so fixes
                stick on return visits
              </li>
              <li>
                <IconCheck width={18} height={18} /> Machine-readable report
                export for tracking progress
              </li>
            </ul>
            <Link to="/features" className="btn btn-secondary">
              Explore all features
            </Link>
          </div>
        </div>
      </section>

      {/* ============ THREE-UP FEATURE CARDS ============ */}
      <section className="section three-up-section">
        <div className="container">
          <div
            className="section-head"
            style={{
              margin: "0 auto 48px",
              textAlign: "center",
              maxWidth: 560,
            }}
          >
            <span className="eyebrow">Core toolkit</span>
            <h2>Four ways in, one click deep</h2>
          </div>
          <div className="three-up-grid">
            {features.map((f) => (
              <div className="feature-tile card" key={f.title}>
                <div className="feature-tile-icon">
                  <f.icon width={24} height={24} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="section testimonial-section">
        <div className="container">
          <div
            className="section-head"
            style={{
              margin: "0 auto 48px",
              textAlign: "center",
              maxWidth: 560,
            }}
          >
            <span className="eyebrow">From early readers</span>
            <h2>What one click changes</h2>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((t) => (
              <div className="testimonial-card card" key={t.name}>
                <div className="testimonial-stars" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <IconStar key={i} width={16} height={16} />
                  ))}
                </div>
                <p className="testimonial-quote">{t.quote}</p>
                <div className="testimonial-person">
                  <div className="testimonial-avatar">{t.name.charAt(0)}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="section">
        <div className="container">
          <div className="cta-banner">
            <div>
              <h2>NEUROACCESS</h2>
              <p>
                One click, and the page reads the way you need it to. Free while
                the extension is in early access.
              </p>
            </div>
            <Link
              to="/setup"
              className="btn cta-banner-btn"
              onClick={handleAddToChrome}
            >
              Add to Chrome <IconArrowRight width={18} height={18} />
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .hero { padding: 72px 0 40px; }
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 56px;
          align-items: center;
        }
        .hero h1 {
          font-size: clamp(36px, 5vw, 54px);
          margin-bottom: 20px;
        }
        .hero-accent { color: var(--primary); }
        .hero-cta-row {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin: 32px 0 28px;
        }
        .hero-trust-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-faint);
        }

        .groups-section { background: var(--bg-soft); }
        .groups-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .group-card { padding: 26px; }
        .group-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: var(--primary-soft);
          color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .group-card h3 { font-size: 17px; margin-bottom: 8px; }
        .group-card p { font-size: 14.5px; margin: 0; }

        .split-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }
        .split-visual { position: relative; }
        .split-image { aspect-ratio: 4/3; overflow: hidden; }
        .split-image-inner {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, var(--primary-soft), var(--accent-soft));
          color: var(--primary);
        }
        .split-stat {
          position: absolute;
          bottom: -28px;
          right: -20px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 22px;
          max-width: 280px;
          background: var(--surface);
        }
        .split-stat-number {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 700;
          color: var(--primary);
        }
        .split-stat strong { display: block; font-size: 14px; margin-bottom: 2px; }
        .split-stat span { font-size: 12.5px; color: var(--text-faint); }
        .split-list { display: flex; flex-direction: column; gap: 14px; margin: 24px 0 28px; }
        .split-list li {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 15px; color: var(--text);
        }
        .split-list svg { color: var(--accent); flex-shrink: 0; margin-top: 2px; }

        .three-up-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .feature-tile { padding: 28px; }
        .feature-tile-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: var(--accent-soft);
          color: var(--accent);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
        }
        .feature-tile h3 { font-size: 17px; margin-bottom: 8px; }
        .feature-tile p { font-size: 14.5px; margin: 0; }

        .testimonial-section { background: var(--bg-soft); }
        .testimonial-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .testimonial-card { padding: 28px; }
        .testimonial-stars { display: flex; gap: 3px; color: #F0B429; margin-bottom: 16px; }
        .testimonial-quote { font-size: 15px; color: var(--text); margin-bottom: 22px; }
        .testimonial-person { display: flex; align-items: center; gap: 12px; }
        .testimonial-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--primary-soft); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          font-weight: 600; font-family: var(--font-display);
        }
        .testimonial-person strong { display: block; font-size: 14px; }
        .testimonial-person span { font-size: 13px; color: var(--text-faint); }

        @media (max-width: 980px) {
          .hero-grid { grid-template-columns: 1fr; }
          .groups-grid { grid-template-columns: repeat(2, 1fr); }
          .split-grid { grid-template-columns: 1fr; gap: 48px; }
          .split-stat { position: static; margin-top: 20px; max-width: none; }
          .three-up-grid { grid-template-columns: repeat(2, 1fr); }
          .testimonial-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .groups-grid { grid-template-columns: 1fr; }
          .three-up-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
