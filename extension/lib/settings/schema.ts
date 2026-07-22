export type ColorBlindMode =
  | "none"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"

export type ContrastLevel = "AA" | "AAA"

export type RulerFollowMode = "mouse" | "keyboard" | "both"

export interface ContrastFixerSettings {
  enabled: boolean
  colorBlindMode: ColorBlindMode
  contrastLevel: ContrastLevel
}

export interface ReadingRulerSettings {
  enabled: boolean
  bandHeightPx: number
  dimOpacity: number
  followMode: RulerFollowMode
}

export interface SyllableHighlightingSettings {
  enabled: boolean
  highlightColor: string
  speechRate: number
}

export interface CalmThemeSettings {
  enabled: boolean
  desaturate: boolean
  reduceMotion: boolean
  declutter: boolean
}

export interface SkipLinksSettings {
  enabled: boolean
}

export interface VoiceCommandsSettings {
  enabled: boolean
}

export interface GlobalModeSettings {
  enabled: boolean
}

export interface GlobalSettings {
  version: number
  contrastFixer: ContrastFixerSettings
  readingRuler: ReadingRulerSettings
  syllableHighlighting: SyllableHighlightingSettings
  calmTheme: CalmThemeSettings
  skipLinks: SkipLinksSettings
  voiceCommands: VoiceCommandsSettings
  globalMode: GlobalModeSettings
}

export type FeatureId =
  | "contrastFixer"
  | "readingRuler"
  | "syllableHighlighting"
  | "calmTheme"
  | "skipLinks"
  | "voiceCommands"
  | "globalMode"

/** A partial patch shape mirroring GlobalSettings, one level of partiality per feature. */
export interface SettingsPatch {
  version?: number
  contrastFixer?: Partial<ContrastFixerSettings>
  readingRuler?: Partial<ReadingRulerSettings>
  syllableHighlighting?: Partial<SyllableHighlightingSettings>
  calmTheme?: Partial<CalmThemeSettings>
  skipLinks?: Partial<SkipLinksSettings>
  voiceCommands?: Partial<VoiceCommandsSettings>
  globalMode?: Partial<GlobalModeSettings>
}

/** Per-hostname override — same shape as SettingsPatch minus the schema version. */
export type SiteOverride = Omit<SettingsPatch, "version">
