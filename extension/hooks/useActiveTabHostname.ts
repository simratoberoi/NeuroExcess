import { useEffect, useState } from "react"

/** Hostname of the active tab in the current window. Undefined until resolved or on non-http(s) tabs. */
export function useActiveTabHostname(): string | undefined {
  const [hostname, setHostname] = useState<string>()

  useEffect(() => {
    let cancelled = false

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (cancelled || !tab?.url) return
      try {
        setHostname(new URL(tab.url).hostname)
      } catch {
        setHostname(undefined)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return hostname
}
