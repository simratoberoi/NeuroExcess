import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useTheme } from '../theme/ThemeContext.jsx'
import { useAuth } from '../Contexts/AuthContext.jsx'
import { IconSun, IconMoon, IconMenu, IconClose, IconPuzzle } from './Icons.jsx'
import AuthModal from './Auth.jsx'

const links = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/setup', label: 'Get the extension' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  function openAuth(mode) {
    setAuthMode(mode)
    setAuthModalOpen(true)
    setOpen(false) // close mobile menu if it was open
  }

  function handleLogout() {
    logout()
    setOpen(false)
  }

  return (
    <>
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="nav-brand" onClick={() => setOpen(false)}>
          <span className="nav-brand-mark">
            <IconPuzzle width={20} height={20} />
          </span>
          NeuroAccess
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => 'nav-link' + (isActive ? ' is-active' : '')}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          >
            {theme === 'light' ? <IconMoon width={18} height={18} /> : <IconSun width={18} height={18} />}
          </button>

          {isAuthenticated ? (
            <div className="nav-user">
              <span className="nav-user-name">{user?.name || user?.username}</span>
              <button type="button" className="btn btn-ghost nav-auth-btn" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost nav-auth-btn" onClick={() => openAuth('login')}>
              Log in
            </button>
          )}

          <Link to="/setup" className="btn btn-primary nav-cta">
            Add to Chrome
          </Link>

          <button
            type="button"
            className="nav-burger"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="nav-mobile" role="dialog" aria-label="Mobile navigation">
          <div className="container">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className="nav-mobile-link" onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <div className="nav-mobile-auth">
                <span className="nav-mobile-user">{user?.name || user?.username}</span>
                <button type="button" className="btn btn-ghost btn-block" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            ) : (
              <div className="nav-mobile-auth">
                <button type="button" className="btn btn-ghost btn-block" onClick={() => openAuth('login')}>
                  Log in
                </button>
              </div>
            )}

            <Link to="/setup" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
              Add to Chrome — it's free
            </Link>
          </div>
        </div>
      )}

      <style>{`
        .nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: color-mix(in srgb, var(--bg) 88%, transparent);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border);
        }
        .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 76px;
          gap: 24px;
        }
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 19px;
          color: var(--text);
          flex-shrink: 0;
        }
        .nav-brand-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: var(--primary);
          color: var(--on-primary);
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          justify-content: center;
        }
        .nav-link {
          padding: 10px 14px;
          border-radius: var(--radius-pill);
          font-size: 15px;
          font-weight: 500;
          color: var(--text-muted);
          transition: background-color var(--duration) ease, color var(--duration) ease;
        }
        .nav-link:hover { color: var(--text); background: var(--bg-soft); }
        .nav-link.is-active { color: var(--primary); background: var(--primary-soft); }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .theme-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid var(--border-strong);
          background: var(--surface);
          color: var(--text);
          cursor: pointer;
          transition: border-color var(--duration) ease, color var(--duration) ease;
        }
        .theme-toggle:hover { border-color: var(--primary); color: var(--primary); }

        .nav-auth-btn {
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          height: 40px;
        }
        .btn-ghost {
          background: transparent;
          border: 1px solid var(--border-strong);
          color: var(--text);
        }
        .btn-ghost:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .nav-user-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nav-cta { display: inline-flex; }
        .nav-burger {
          display: none;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid var(--border-strong);
          background: var(--surface);
          color: var(--text);
          cursor: pointer;
        }

        .nav-mobile {
          border-top: 1px solid var(--border);
          background: var(--bg);
          padding: 16px 0 24px;
        }
        .nav-mobile-link {
          display: block;
          padding: 14px 4px;
          font-size: 17px;
          font-weight: 500;
          color: var(--text);
          border-bottom: 1px solid var(--border);
        }
        .nav-mobile-auth {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px 0;
          border-bottom: 1px solid var(--border);
        }
        .nav-mobile-user {
          font-size: 15px;
          font-weight: 500;
          color: var(--text);
          padding: 0 4px;
        }

        @media (max-width: 900px) {
          .nav-links { display: none; }
          .nav-cta { display: none; }
          .nav-auth-btn { display: none; }
          .nav-user { display: none; }
          .nav-burger { display: inline-flex; }
        }
      `}</style>
    </header>

    <AuthModal
      isOpen={authModalOpen}
      onClose={() => setAuthModalOpen(false)}
      initialMode={authMode}
    />
    </>
  )
}