import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { IconCheck } from './Icons.jsx'
import { useAuth } from '../Contexts/AuthContext.jsx'

// Keep these values in sync with backend/src/models/user.py::AccessibilityNeed.
const ACCESSIBILITY_OPTIONS = [
  { value: 'blindness', label: 'Blindness' },
  { value: 'low_vision', label: 'Low Vision' },
  { value: 'color_vision_deficiency', label: 'Color Vision Deficiency' },
  { value: 'dyslexia', label: 'Dyslexia' },
  { value: 'adhd_focus_difficulties', label: 'ADHD / Focus Difficulties' },
  { value: 'autism_sensory_sensitivity', label: 'Autism / Sensory Sensitivity' },
  { value: 'motor_impairment', label: 'Motor Impairment' },
  { value: 'temporary_impairment', label: 'Temporary Impairment' },
  { value: 'deaf_hard_of_hearing', label: 'Deaf / Hard of Hearing' },
]

const EMPTY_SIGNUP_FORM = {
  name: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  region: '',
  accessibilityNeeds: [],
}

const EMPTY_LOGIN_FORM = { identifier: '', password: '' }

function IconClose(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconEyeOpen(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a18.6 18.6 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

/**
 * AuthModal
 *
 * Reusable Login/Signup modal, styled with the project's CSS-variable design
 * system (see index.css) instead of Tailwind. Owns its own form state and
 * validation; delegates network calls to AuthContext (login/signup).
 *
 * Rendered via a portal into document.body so it always centers against the
 * viewport, regardless of where it's mounted in the component tree. This
 * matters because any ancestor with `filter` or `backdrop-filter` (like the
 * sticky nav's blur) creates a new containing block for `position: fixed`
 * descendants — without the portal, the modal ends up fixed relative to
 * that ancestor's box instead of the viewport, which is what was causing it
 * to render squashed near the top of the page.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - initialMode: "login" | "signup" (default "login")
 *  - onAuthenticated: (user) => void   optional callback on success
 */
export default function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthenticated }) {
  const { login, signup, user } = useAuth()
  const [mode, setMode] = useState(initialMode)
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN_FORM)
  const [signupForm, setSignupForm] = useState(EMPTY_SIGNUP_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const firstFieldRef = useRef(null)
  const headingId = useId()

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setLoginForm(EMPTY_LOGIN_FORM)
      setSignupForm(EMPTY_SIGNUP_FORM)
      setErrors({})
      setFormError('')
      setShowPassword(false)
    }
  }, [isOpen, initialMode])

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => firstFieldRef.current?.focus(), 0)

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    // Lock background scroll while the modal is open.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, mode, onClose])

  if (!isOpen) return null

  function switchMode(nextMode) {
    setMode(nextMode)
    setErrors({})
    setFormError('')
  }

  function validateLogin() {
    const next = {}
    if (!loginForm.identifier.trim()) next.identifier = 'Enter your email or username.'
    if (!loginForm.password) next.password = 'Enter your password.'
    return next
  }

  function validateSignup() {
    const next = {}
    if (!signupForm.name.trim()) next.name = 'Enter your full name.'
    if (!signupForm.username.trim()) {
      next.username = "Choose a username."
    } else if (signupForm.username.includes(' ')) {
      next.username = "Username can't contain spaces."
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email)) {
      next.email = 'Enter a valid email address.'
    }
    if (signupForm.password.length < 8) {
      next.password = 'Password must be at least 8 characters.'
    }
    if (signupForm.confirmPassword !== signupForm.password) {
      next.confirmPassword = "Passwords don't match."
    }
    return next
  }

  function toggleAccessibilityNeed(value) {
    setSignupForm((prev) => {
      const isSelected = prev.accessibilityNeeds.includes(value)
      return {
        ...prev,
        accessibilityNeeds: isSelected
          ? prev.accessibilityNeeds.filter((v) => v !== value)
          : [...prev.accessibilityNeeds, value],
      }
    })
  }

  async function handleLoginSubmit(e) {
    e.preventDefault()
    const validation = validateLogin()
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setIsSubmitting(true)
    setFormError('')
    const result = await login(loginForm)
    setIsSubmitting(false)

    if (result.success) {
      onAuthenticated?.(user)
      onClose()
    } else {
      setFormError(result.error)
    }
  }

  async function handleSignupSubmit(e) {
    e.preventDefault()
    const validation = validateSignup()
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setIsSubmitting(true)
    setFormError('')
    const { confirmPassword, ...payload } = signupForm
    const result = await signup(payload)
    setIsSubmitting(false)

    if (result.success) {
      onAuthenticated?.(user)
      onClose()
    } else {
      setFormError(result.error)
    }
  }

  return (
    <div className="auth-overlay" role="presentation">
      <div className="auth-backdrop" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="auth-dialog card"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="auth-close"
        >
          <IconClose width={18} height={18} />
        </button>

        <div className="auth-body">
          <span className="eyebrow">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </span>
          <h2 id={headingId}>
            {mode === 'login' ? 'Log in to NeuroAccess' : 'Set up NeuroAccess'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Enter your details to continue.'
              : "Tell us a bit about yourself so the extension can adapt to you."}
          </p>

          {formError && (
            <div role="alert" className="auth-alert">
              {formError}
            </div>
          )}

          {mode === 'login' ? (
            <form className="auth-form" onSubmit={handleLoginSubmit} noValidate>
              <Field
                ref={firstFieldRef}
                id="login-identifier"
                label="Email or username"
                value={loginForm.identifier}
                onChange={(v) => setLoginForm((f) => ({ ...f, identifier: v }))}
                error={errors.identifier}
                autoComplete="username"
              />
              <PasswordField
                id="login-password"
                label="Password"
                value={loginForm.password}
                onChange={(v) => setLoginForm((f) => ({ ...f, password: v }))}
                error={errors.password}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword((s) => !s)}
                autoComplete="current-password"
              />

              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait…' : 'Log in'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignupSubmit} noValidate>
              <Field
                ref={firstFieldRef}
                id="signup-name"
                label="Full name"
                value={signupForm.name}
                onChange={(v) => setSignupForm((f) => ({ ...f, name: v }))}
                error={errors.name}
                autoComplete="name"
              />
              <Field
                id="signup-username"
                label="Username"
                value={signupForm.username}
                onChange={(v) => setSignupForm((f) => ({ ...f, username: v }))}
                error={errors.username}
                autoComplete="username"
              />
              <Field
                id="signup-email"
                label="Email"
                type="email"
                value={signupForm.email}
                onChange={(v) => setSignupForm((f) => ({ ...f, email: v }))}
                error={errors.email}
                autoComplete="email"
              />
              <Field
                id="signup-phone"
                label="Phone (optional)"
                type="tel"
                value={signupForm.phone}
                onChange={(v) => setSignupForm((f) => ({ ...f, phone: v }))}
                autoComplete="tel"
              />
              <Field
                id="signup-region"
                label="Region (optional)"
                value={signupForm.region}
                onChange={(v) => setSignupForm((f) => ({ ...f, region: v }))}
                autoComplete="country-name"
              />
              <PasswordField
                id="signup-password"
                label="Password"
                value={signupForm.password}
                onChange={(v) => setSignupForm((f) => ({ ...f, password: v }))}
                error={errors.password}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword((s) => !s)}
                autoComplete="new-password"
              />
              <PasswordField
                id="signup-confirm-password"
                label="Confirm password"
                value={signupForm.confirmPassword}
                onChange={(v) => setSignupForm((f) => ({ ...f, confirmPassword: v }))}
                error={errors.confirmPassword}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword((s) => !s)}
                autoComplete="new-password"
              />

              <fieldset className="auth-a11y-fieldset">
                <legend>
                  Accessibility profile <span>(select any that apply)</span>
                </legend>
                <p className="auth-a11y-hint">
                  This shapes how the NeuroAccess extension behaves for you. You can change
                  it later in Settings.
                </p>
                <div className="auth-a11y-grid">
                  {ACCESSIBILITY_OPTIONS.map((option) => {
                    const isSelected = signupForm.accessibilityNeeds.includes(option.value)
                    return (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => toggleAccessibilityNeed(option.value)}
                        aria-pressed={isSelected}
                        className={`auth-a11y-option${isSelected ? ' selected' : ''}`}
                      >
                        <IconCheck width={16} height={16} />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait…' : 'Create account'}
              </button>
            </form>
          )}

          <p className="auth-switch">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="auth-switch-link">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')} className="auth-switch-link">
                  Log in
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      <style>{`
        .auth-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .auth-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(5, 8, 16, 0.55);
          backdrop-filter: blur(3px);
        }
        .auth-dialog {
          position: relative;
          width: 100%;
          max-width: 440px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }
        .auth-close {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: var(--radius-pill);
          background: transparent;
          color: var(--text-faint);
          cursor: pointer;
          transition: background-color var(--duration) ease, color var(--duration) ease;
        }
        .auth-close:hover { background: var(--bg-soft); color: var(--text); }

        .auth-body { padding: 32px; }
        .auth-body h2 { font-size: 22px; margin-bottom: 4px; }
        .auth-subtitle { font-size: 14.5px; margin-bottom: 0; }

        .auth-alert {
          margin-top: 16px;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          background: var(--warn-soft);
          border: 1px solid var(--warn);
          color: var(--warn);
          font-size: 13.5px;
        }

        .auth-form {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .auth-field label {
          display: block;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text);
          margin-bottom: 6px;
        }
        .auth-field input {
          display: block;
          width: 100%;
          padding: 10px 13px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-strong);
          background: var(--surface);
          color: var(--text);
        }
        .auth-field input.has-error { border-color: var(--warn); }
        .auth-field-error {
          margin-top: 5px;
          font-size: 12.5px;
          color: var(--warn);
        }

        .auth-password-wrapper { position: relative; }
        .auth-password-wrapper input { padding-right: 42px; }
        .auth-password-toggle {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          color: var(--text-faint);
          cursor: pointer;
        }
        .auth-password-toggle:hover { color: var(--text-muted); }

        .auth-a11y-fieldset { border: none; padding: 0; margin: 4px 0 0; }
        .auth-a11y-fieldset legend {
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text);
          padding: 0;
        }
        .auth-a11y-fieldset legend span { font-weight: 400; color: var(--text-faint); }
        .auth-a11y-hint {
          font-size: 12.5px;
          color: var(--text-faint);
          margin: 4px 0 12px;
        }
        .auth-a11y-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .auth-a11y-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-muted);
          font-size: 13.5px;
          text-align: left;
          cursor: pointer;
          transition: border-color var(--duration) ease, background-color var(--duration) ease, color var(--duration) ease;
        }
        .auth-a11y-option svg { color: var(--border-strong); flex-shrink: 0; }
        .auth-a11y-option:hover { border-color: var(--border-strong); }
        .auth-a11y-option.selected {
          border-color: var(--primary);
          background: var(--primary-soft);
          color: var(--primary);
        }
        .auth-a11y-option.selected svg { color: var(--primary); }

        .auth-switch {
          margin: 24px 0 0;
          text-align: center;
          font-size: 13.5px;
          color: var(--text-muted);
        }
        .auth-switch-link {
          border: none;
          background: transparent;
          padding: 0;
          font: inherit;
          font-weight: 500;
          color: var(--primary);
          cursor: pointer;
        }
        .auth-switch-link:hover { color: var(--primary-hover); }

        @media (max-width: 480px) {
          .auth-body { padding: 24px; }
          .auth-a11y-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small presentational subcomponents
// ---------------------------------------------------------------------------

const Field = forwardRef(function Field({ id, label, value, onChange, error, type = 'text', autoComplete }, ref) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        ref={ref}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={error ? 'has-error' : ''}
      />
      {error && <p id={`${id}-error`} className="auth-field-error">{error}</p>}
    </div>
  )
})

function PasswordField({ id, label, value, onChange, error, showPassword, onToggleShow, autoComplete }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-wrapper">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={error ? 'has-error' : ''}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="auth-password-toggle"
        >
          {showPassword ? <IconEyeOff width={16} height={16} /> : <IconEyeOpen width={16} height={16} />}
        </button>
      </div>
      {error && <p id={`${id}-error`} className="auth-field-error">{error}</p>}
    </div>
  )
}