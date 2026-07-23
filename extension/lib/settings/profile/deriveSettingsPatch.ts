import type { SettingsPatch } from "~lib/settings/schema"


export const PROFILE_PATCHES: Partial<Record<string, SettingsPatch>> = {
  blindness: {
    voiceCommands: { enabled: true }

  },
  low_vision: {
    contrastFixer: { enabled: true, contrastLevel: "AAA" },
    readingRuler: { enabled: true },
    syllableHighlighting: { enabled: true }
  },
  color_vision_deficiency: {

    contrastFixer: { enabled: true },
    calmTheme: { enabled: true }
  },
  dyslexia: {
    readingRuler: { enabled: true },
    syllableHighlighting: { enabled: true }
    
  },
  adhd_focus_difficulties: {
    calmTheme: { enabled: true, reduceMotion: true, declutter: true },
     readingRuler: { enabled: true }
  },
  autism_sensory_sensitivity: {
    calmTheme: { enabled: true, desaturate: true, reduceMotion: true }
  },
  motor_impairment: {
    skipLinks: { enabled: true },
    voiceCommands: { enabled: true }
  },
  temporary_impairment: {
    // General "reduce strain" default — the profile doesn't say which
    // sense is affected, so this is deliberately the mildest applicable
    // preset rather than turning everything on.
    calmTheme: { enabled: true, reduceMotion: true }
  }
  // deaf_hard_of_hearing: no corresponding feature exists yet in this
  // extension (no captioning/transcript module) — intentionally omitted
  // rather than mapped to something approximate.
}

function mergePatch(base: SettingsPatch, incoming: SettingsPatch): SettingsPatch {
  return {
    version: incoming.version ?? base.version,
    contrastFixer: { ...base.contrastFixer, ...incoming.contrastFixer },
    readingRuler: { ...base.readingRuler, ...incoming.readingRuler },
    syllableHighlighting: { ...base.syllableHighlighting, ...incoming.syllableHighlighting },
    calmTheme: { ...base.calmTheme, ...incoming.calmTheme },
    skipLinks: { ...base.skipLinks, ...incoming.skipLinks },
    voiceCommands: { ...base.voiceCommands, ...incoming.voiceCommands }
  }
}

/** Combines the patches for every need the user selected into one SettingsPatch. */
export function deriveSettingsPatchFromProfile(accessibilityNeeds: string[]): SettingsPatch {
  return accessibilityNeeds.reduce<SettingsPatch>((patch, need) => {
    const needPatch = PROFILE_PATCHES[need]
    return needPatch ? mergePatch(patch, needPatch) : patch
  }, {})
}