import { Storage, type StorageCallbackMap } from "@plasmohq/storage"

import { DEFAULT_GLOBAL_SETTINGS } from "./defaults"
import { SITE_OVERRIDE_KEY_PREFIX, siteOverrideKey } from "./hostname"
import { mergePartialOverrides, mergeSettings } from "./merge"
import type { GlobalSettings, SettingsPatch, SiteOverride } from "./schema"

const GLOBAL_SETTINGS_KEY = "settings:global"

// Global defaults sync across the user's signed-in browsers (small, single object).
export const globalStorage = new Storage({ area: "sync" })

// Per-site overrides stay local: unbounded-friendly and inherently machine-specific.
export const siteStorage = new Storage({ area: "local" })

export async function getGlobalSettings(): Promise<GlobalSettings> {
  const stored = await globalStorage.get<SettingsPatch>(GLOBAL_SETTINGS_KEY)
  return mergeSettings(DEFAULT_GLOBAL_SETTINGS, stored)
}

export async function setGlobalSettings(patch: SettingsPatch): Promise<void> {
  const current = await getGlobalSettings()
  const next = mergeSettings(current, patch)
  await globalStorage.set(GLOBAL_SETTINGS_KEY, next)
}

export async function getSiteOverride(
  hostname: string
): Promise<SiteOverride | undefined> {
  return siteStorage.get<SiteOverride>(siteOverrideKey(hostname))
}

export async function setSiteOverride(
  hostname: string,
  patch: SiteOverride
): Promise<void> {
  const current = (await getSiteOverride(hostname)) ?? {}
  const next = mergePartialOverrides(current, patch)
  await siteStorage.set(siteOverrideKey(hostname), next)
}

export async function clearSiteOverride(hostname: string): Promise<void> {
  await siteStorage.remove(siteOverrideKey(hostname))
}

export async function getEffectiveSettings(
  hostname: string
): Promise<GlobalSettings> {
  const [global, override] = await Promise.all([
    getGlobalSettings(),
    getSiteOverride(hostname)
  ])
  return mergeSettings(global, override)
}

/** Lists hostnames that currently have a site override stored. */
export async function listOverriddenHostnames(): Promise<string[]> {
  const all = await siteStorage.getAll()
  return Object.keys(all)
    .filter((key) => key.startsWith(SITE_OVERRIDE_KEY_PREFIX))
    .map((key) => key.slice(SITE_OVERRIDE_KEY_PREFIX.length))
}

/**
 * Subscribes to live changes in the effective settings for a hostname (global defaults
 * or that hostname's override, from any extension context). Returns an unsubscribe function.
 */
export function watchEffectiveSettings(
  hostname: string,
  callback: (settings: GlobalSettings) => void
): () => void {
  let cancelled = false

  const recompute = () => {
    getEffectiveSettings(hostname).then((settings) => {
      if (!cancelled) callback(settings)
    })
  }

  const globalWatchMap: StorageCallbackMap = {
    [GLOBAL_SETTINGS_KEY]: recompute
  }
  const siteWatchMap: StorageCallbackMap = {
    [siteOverrideKey(hostname)]: recompute
  }

  globalStorage.watch(globalWatchMap)
  siteStorage.watch(siteWatchMap)
  recompute()

  return () => {
    cancelled = true
    globalStorage.unwatch(globalWatchMap)
    siteStorage.unwatch(siteWatchMap)
  }
}
