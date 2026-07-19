import { useState } from 'react'
import PageHero from '../components/PageHero.jsx'
import { IconMail, IconChat, IconShield, IconCheck } from '../components/Icons.jsx'

const topics = ['General question', 'Bug report', 'Accessibility feedback', 'Early access request', 'Partnerships']

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', topic: topics[0], message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.errors?.join(', ') || 'Failed to send message.')
      }

      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow="We read every message"
        title="Tell us what's getting in your way"
        lede="Bug reports and accessibility feedback shape the roadmap directly — this is one of the fastest ways to change what ships next."
      />

      <section className="section contact-section">
        <div className="container contact-grid">
          <div className="contact-form-wrap card">
            {sent ? (
              <div className="contact-success">
                <div className="contact-success-icon">
                  <IconCheck width={26} height={26} />
                </div>
                <h3>Message sent</h3>
                <p>Thanks — we typically reply within two business days.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                {error && (
                  <div className="form-error">
                    {error}
                  </div>
                )}
                
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="name">Name</label>
                    <input id="name" required value={form.name} onChange={update('name')} placeholder="Your name" />
                  </div>
                  <div className="form-field">
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="topic">Topic</label>
                  <select id="topic" value={form.topic} onChange={update('topic')}>
                    {topics.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={update('message')}
                    placeholder="What happened, and what page or profile were you using?"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
                  {loading ? 'Sending...' : 'Send message'}
                </button>
              </form>
            )}
          </div>

          <div className="contact-side">
            <div className="contact-side-item card">
              <div className="contact-side-icon">
                <IconMail width={20} height={20} />
              </div>
              <div>
                <h4>Email support</h4>
                <p>support@neuroaccess.app<br />Replies within two business days.</p>
              </div>
            </div>
            <div className="contact-side-item card">
              <div className="contact-side-icon">
                <IconChat width={20} height={20} />
              </div>
              <div>
                <h4>Accessibility feedback</h4>
                <p>Found a barrier the extension missed? Flag it — this queue is reviewed first.</p>
              </div>
            </div>
            <div className="contact-side-item card">
              <div className="contact-side-icon">
                <IconShield width={20} height={20} />
              </div>
              <div>
                <h4>Privacy questions</h4>
                <p>Ask us anything about what runs locally versus in the cloud.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 32px;
          align-items: start;
        }
        .contact-form-wrap { padding: 36px; }
        .contact-form { display: flex; flex-direction: column; gap: 20px; }
        .form-error {
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #ef4444;
          font-size: 14px;
          line-height: 1.4;
        }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-field { display: flex; flex-direction: column; gap: 8px; }
        .form-field label { font-size: 14px; font-weight: 500; color: var(--text); }
        .form-field input,
        .form-field select,
        .form-field textarea {
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-strong);
          background: var(--surface);
          color: var(--text);
          resize: vertical;
        }
        .form-field input:focus,
        .form-field select:focus,
        .form-field textarea:focus {
          border-color: var(--primary);
        }

        .contact-success { text-align: center; padding: 40px 12px; }
        .contact-success-icon {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: var(--accent-soft);
          color: var(--accent);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 18px;
        }

        .contact-side { display: flex; flex-direction: column; gap: 16px; }
        .contact-side-item {
          padding: 22px;
          display: flex;
          gap: 16px;
        }
        .contact-side-icon {
          width: 42px; height: 42px;
          border-radius: 11px;
          background: var(--primary-soft);
          color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .contact-side-item h4 { font-size: 15px; margin-bottom: 6px; }
        .contact-side-item p { font-size: 13.5px; margin: 0; }

        @media (max-width: 900px) {
          .contact-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  )
}
