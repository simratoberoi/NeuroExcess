import type { GlobalSettings, SettingsPatch, SiteOverride } from "./schema"

function mergeOptional<T extends object>(
  base: T | undefined,
  patch: T | undefined
): T | undefined {
  if (!patch) return base
  return { ...base, ...patch } as T
}

/** Applies a partial patch on top of a fully-populated GlobalSettings, one feature at a time. */
export function mergeSettings(
  base: GlobalSettings,
  patch: SettingsPatch | undefined
): GlobalSettings {
  if (!patch) return base
  return {
    version: patch.version ?? base.version,
    contrastFixer: { ...base.contrastFixer, ...patch.contrastFixer },
    readingRuler: { ...base.readingRuler, ...patch.readingRuler },
    syllableHighlighting: {
      ...base.syllableHighlighting,
      ...patch.syllableHighlighting
    },
    calmTheme: { ...base.calmTheme, ...patch.calmTheme },
    skipLinks: { ...base.skipLinks, ...patch.skipLinks },
    voiceCommands: { ...base.voiceCommands, ...patch.voiceCommands },
    globalMode: { ...base.globalMode, ...patch.globalMode }
  }
}

/** Combines two site-override patches (both partial), used when updating an existing override. */
export function mergePartialOverrides(
  base: SiteOverride,
  patch: SiteOverride
): SiteOverride {
  return {
    contrastFixer: mergeOptional(base.contrastFixer, patch.contrastFixer),
    readingRuler: mergeOptional(base.readingRuler, patch.readingRuler),
    syllableHighlighting: mergeOptional(
      base.syllableHighlighting,
      patch.syllableHighlighting
    ),
    calmTheme: mergeOptional(base.calmTheme, patch.calmTheme),
    skipLinks: mergeOptional(base.skipLinks, patch.skipLinks),
    voiceCommands: mergeOptional(base.voiceCommands, patch.voiceCommands),
    globalMode: mergeOptional(base.globalMode, patch.globalMode)
  }
}
