import type { CSSProperties } from "react"

import { OVERLAY_Z_INDEX } from "~lib/dom/shadowRoot"
import type { ReadingRulerSettings } from "~lib/settings/schema"

import { useRulerPosition } from "./pointerTracking"

interface RulerOverlayProps {
  settings: ReadingRulerSettings
}

export function RulerOverlay({ settings }: RulerOverlayProps) {
  const { top, visible } = useRulerPosition(
    settings.followMode,
    settings.bandHeightPx,
    settings.enabled
  )


  if (!settings.enabled || !visible) return null

  const panelStyle: CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    // Non-negotiable: the overlay must never intercept clicks/scroll on the underlying page.
    pointerEvents: "none",
    zIndex: OVERLAY_Z_INDEX,
    backgroundColor: `rgba(0, 0, 0, ${settings.dimOpacity})`
  }

  return (
    <>
      <div style={{ ...panelStyle, top: 0, height: Math.max(0, top) }} />
      <div style={{ ...panelStyle, top: top + settings.bandHeightPx, bottom: 0 }} />
    </>
  )
}
