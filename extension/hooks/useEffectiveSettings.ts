import { useStorage } from "@plasmohq/storage/hook"

import { DEFAULT_GLOBAL_SETTINGS } from "~lib/settings/defaults"
import { siteOverrideKey } from "~lib/settings/hostname"
import { mergePartialOverrides, mergeSettings } from "~lib/settings/merge"
import type {
  GlobalSettings,
  SettingsPatch,
  SiteOverride
} from "~lib/settings/schema"
import { globalStorage, siteStorage } from "~lib/settings/store"

const GLOBAL_SETTINGS_KEY = "settings:global"

export interface UseEffectiveSettingsResult {
  /** The merged global+site-override settings that are actually applied on the current tab. */
  effective: GlobalSettings
  /** The raw per-site override for the current hostname (empty object if none). */
  override: SiteOverride
  isLoading: boolean
  updateGlobal: (patch: SettingsPatch) => Promise<void>
  updateSiteOverride: (patch: SiteOverride) => Promise<void>
  clearSiteOverride: () => void
}

/**
 * Reads and writes the effective settings for `hostname`, staying live-synced via
 * @plasmohq/storage's chrome.storage.onChanged wrapper (so edits made in another
 * extension context, e.g. the options page, are reflected here automatically).
 */
export function useEffectiveSettings(
  hostname: string | undefined
): UseEffectiveSettingsResult {
  const [globalSettings, , globalMeta] = useStorage<GlobalSettings>(
    { key: GLOBAL_SETTINGS_KEY, instance: globalStorage },
    DEFAULT_GLOBAL_SETTINGS
  )

  const overrideKey = siteOverrideKey(hostname ?? "")
  const [override, , overrideMeta] = useStorage<SiteOverride>(
    { key: overrideKey, instance: siteStorage },
    {}
  )

  const global = globalSettings ?? DEFAULT_GLOBAL_SETTINGS
  const effective = mergeSettings(global, override)

  async function updateGlobal(patch: SettingsPatch): Promise<void> {
    await globalMeta.setStoreValue(mergeSettings(global, patch))
  }

  async function updateSiteOverride(patch: SiteOverride): Promise<void> {
    if (!hostname) return
    await overrideMeta.setStoreValue(
      mergePartialOverrides(override ?? {}, patch)
    )
  }

  function clearSiteOverride(): void {
    if (!hostname) return
    overrideMeta.remove()
  }

  return {
    effective,
    override: override ?? {},
    isLoading: globalMeta.isLoading || overrideMeta.isLoading,
    updateGlobal,
    updateSiteOverride,
    clearSiteOverride
  }
}
