import type { GlobalSettings } from "./schema"

export const SETTINGS_SCHEMA_VERSION = 1

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  version: SETTINGS_SCHEMA_VERSION,
  contrastFixer: {
    enabled: false,
    colorBlindMode: "none",
    contrastLevel: "AA"
  },
  readingRuler: {
    enabled: false,
    bandHeightPx: 120,
    dimOpacity: 0.55,
    followMode: "both"
  },
  syllableHighlighting: {
    enabled: false,
    highlightColor: "#fbbf24",
    speechRate: 1
  },
  calmTheme: {
    enabled: false,
    desaturate: true,
    reduceMotion: true,
    declutter: false
  },
  // On by default: a pure keyboard-navigation aid with no visible effect for
  // mouse users, so it carries none of the "surprising page repaint" risk
  // that justifies opt-in for the other features.
  skipLinks: {
    enabled: false
  },
  voiceCommands: {
    enabled: false
  },
  globalMode: {
    enabled: false
  }
}
