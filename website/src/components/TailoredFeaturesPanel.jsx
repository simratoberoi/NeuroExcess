import { useState } from 'react'
import { useAuth } from '../Contexts/AuthContext'
import { getMatchedFeatureGroups } from '../utils/accessibilityProfile'
import { syncWithExtensionUntilReady } from '../utils/extensionBridge'

// Replace with your real Chrome Web Store listing once published. Until
// then this can point at an internal "how to install" page.
const CHROME_WEB_STORE_URL = 'https://chromewebstore.google.com/detail/REPLACE_WITH_YOUR_ITEM_ID'

const STATUS_COPY = {
  idle: null,
  waiting: 'Setting up your extension… keep this tab open.',
  success: '✓ Done — only your selected features are turned on.',
  timeout: "Didn't detect the extension yet. Installed it? Try the button again.",
  unsupported: 'Open this page in Chrome to install the extension.',
}


export default function TailoredFeaturesPanel() {
  const { user, isAuthenticated, token } = useAuth()
  const [status, setStatus] = useState('idle')

  if (!isAuthenticated || !user) return null

  const matched = getMatchedFeatureGroups(user.accessibilityNeeds)

  function handleGetExtension() {
    window.open(CHROME_WEB_STORE_URL, '_blank', 'noopener')
    syncWithExtensionUntilReady(user, token, { onStatusChange: setStatus })
  }

  return (
    <div className="tailored-panel card">
      <span className="eyebrow">Tailored for you</span>
      <h3>We've configured NeuroAccess for your profile</h3>

      {matched.length === 0 ? (
        <p>
          You haven't selected any accessibility needs yet. Update your profile to get
          personalized features.
        </p>
      ) : (
        <>
          <p className="tailored-intro">
            Based on what you selected, these features turn on automatically once you install
            the extension and sign in — nothing else is enabled for you:
          </p>
          <div className="tailored-groups">
            {matched.map((group) => (
              <div className="tailored-group" key={group.need}>
                <h4>{group.label}</h4>
                <ul>
                  {group.features.map((feature) => (
                    <li key={feature.text} className={feature.available ? 'is-available' : 'is-coming-soon'}>
                      <span>{feature.text}</span>
                      {!feature.available && <span className="tailored-badge">Coming soon</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <button type="button" className="btn btn-primary" onClick={handleGetExtension}>
        Add to Chrome — free
      </button>
      {STATUS_COPY[status] && <p className="tailored-status">{STATUS_COPY[status]}</p>}

      <style>{`
        .tailored-panel {
          padding: 28px 32px;
          max-width: 560px;
        }
        .tailored-panel h3 {
          font-size: 19px;
          margin-bottom: 12px;
        }
        .tailored-intro {
          font-size: 14.5px;
          margin-bottom: 20px;
        }
        .tailored-groups {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        .tailored-group h4 {
          font-size: 14px;
          margin-bottom: 6px;
          color: var(--primary);
        }
        .tailored-group ul {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tailored-group li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 13.5px;
          color: var(--text);
          padding: 7px 12px;
          border-radius: var(--radius-sm);
          background: var(--bg-soft);
          border: 1px solid var(--border);
        }
        .tailored-group li.is-coming-soon {
          color: var(--text-faint);
        }
        .tailored-badge {
          flex-shrink: 0;
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: var(--radius-pill);
          background: var(--warn-soft);
          color: var(--warn);
        }
        .tailored-status {
          margin: 12px 0 0;
          font-size: 13px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}