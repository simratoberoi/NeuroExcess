// Talks to the NeuroExcess browser extension via chrome.runtime.sendMessage.
// Most visitors won't have the extension installed — every function here is
// a no-op (not an error) in that case.

// From chrome://extensions with Developer Mode on, after loading the
// extension unpacked. Update this once you have a real extension ID.
const EXTENSION_ID = 'mnhdnflaffinefhmfddleinmoeaclomk';

function hasExtensionRuntime() {
  return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.sendMessage;
}

/**
 * Sends the signed-in user's profile + token to the extension so it can
 * personalize the page. Call this after login/signup succeeds, and once
 * on app load if a session is restored from a stored token.
 */
export function notifyExtensionSignedIn(user, token) {
  if (!hasExtensionRuntime()) return;
  try {
    chrome.runtime.sendMessage(
      EXTENSION_ID,
      {
        type: 'NEUROEXCESS_AUTH',
        token,
        accessibilityNeeds: user?.accessibilityNeeds || [],
      },
      () => {
        // Swallow "Could not establish connection" — expected when the
        // extension isn't installed; chrome.runtime.lastError must still
        // be read or Chrome logs an unhandled-error warning to console.
        void chrome.runtime.lastError;
      }
    );
  } catch {
    // Extension not installed, or messaging blocked — not an error case.
  }
}

/** Call this from logout() so the extension clears its cached profile too. */
export function notifyExtensionSignedOut() {
  if (!hasExtensionRuntime()) return;
  try {
    chrome.runtime.sendMessage(EXTENSION_ID, { type: 'NEUROEXCESS_LOGOUT' }, () => {
      void chrome.runtime.lastError;
    });
  } catch {
    // Extension not installed — fine.
  }
}


export function syncWithExtensionUntilReady(
  user,
  token,
  { intervalMs = 1500, timeoutMs = 60000, onStatusChange } = {}
) {
  if (!hasExtensionRuntime()) {
    onStatusChange?.('unsupported');
    return () => {};
  }

  let stopped = false;
  const startedAt = Date.now();
  onStatusChange?.('waiting');

  function attempt() {
    if (stopped) return;

    if (Date.now() - startedAt > timeoutMs) {
      stopped = true;
      onStatusChange?.('timeout');
      return;
    }

    try {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          type: 'NEUROEXCESS_AUTH',
          token,
          accessibilityNeeds: user?.accessibilityNeeds || [],
        },
        (response) => {
          if (chrome.runtime.lastError || !response?.ok) {
            setTimeout(attempt, intervalMs); // not installed/ready yet — try again
            return;
          }
          stopped = true;
          onStatusChange?.('success');
        }
      );
    } catch {
      setTimeout(attempt, intervalMs);
    }
  }

  attempt();

  return () => {
    stopped = true;
  };
}