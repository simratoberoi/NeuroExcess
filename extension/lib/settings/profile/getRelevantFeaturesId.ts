// ~lib/settings/profile/getRelevantFeatureIds.ts
import type { FeatureId } from "~lib/settings/schema"
import { PROFILE_PATCHES } from "./deriveSettingsPatch"
// import { PROFILE_PATCHES } from "./deriveSettingsPatchFromProfile" // export this const if not already

/** Which FeatureIds are actually relevant given the user's selected accessibility needs. */
export function getRelevantFeatureIds(accessibilityNeeds: string[]): Set<FeatureId> {
  const relevant = new Set<FeatureId>()
  for (const need of accessibilityNeeds) {
    const patch = PROFILE_PATCHES[need]
    if (!patch) continue
    for (const key of Object.keys(patch)) {
      if (key !== "version") relevant.add(key as FeatureId)
    }
  }
  return relevant
}