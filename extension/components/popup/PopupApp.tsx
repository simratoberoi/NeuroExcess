import { useState } from "react"

import { useActiveTabHostname } from "~hooks/useActiveTabHostname"
import { useAuditSummary } from "~hooks/useAuditSummary"
import { useEffectiveSettings } from "~hooks/useEffectiveSettings"
import { FEATURE_META } from "~lib/featureMeta"
import type { FeatureId, GlobalSettings, SettingsPatch, SiteOverride } from "~lib/settings/schema"

import { CalmThemeOptions } from "./CalmThemeOptions"
import { ContrastFixerOptions } from "./ContrastFixerOptions"
import { CurrentSiteHeader } from "./CurrentSiteHeader"
import { FeatureToggleRow } from "./FeatureToggleRow"
import { GlobalModeSummary } from "./GlobalModeSummary"

export function PopupApp() {
  const hostname = useActiveTabHostname()
  const { effective, override, isLoading, updateGlobal, updateSiteOverride, clearSiteOverride } =
    useEffectiveSettings(hostname)
  const auditSummary = useAuditSummary(hostname)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const tabs = globalThis.chrome.tabs

  const hasOverrides = Object.keys(override).length > 0

  function triggerReader(type: "neuroaccess:read-selection" | "neuroaccess:read-page") {
    tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return
      void tabs.sendMessage(tab.id, { type })
    })
  }

  function applyPatch<K extends FeatureId>(featureId: K, patch: Partial<GlobalSettings[K]>) {
    if (isCustomizing && hostname) {
      void updateSiteOverride({ [featureId]: patch } as SiteOverride)
    } else {
      void updateGlobal({ [featureId]: patch } as SettingsPatch)
    }
  }

  if (isLoading) {
    return <div className="w-80 p-4 text-sm text-gray-500">Loading...</div>
  }

  return (
    <div className="w-80 p-4">
      <h1 className="mb-3 text-base font-semibold text-gray-900">NeuroAccess</h1>
      <CurrentSiteHeader
        hostname={hostname}
        isCustomizing={isCustomizing}
        onToggleCustomizing={setIsCustomizing}
        hasOverrides={hasOverrides}
        onResetOverrides={() => {
          clearSiteOverride()
          setIsCustomizing(false)
        }}
      />
      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Read aloud
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => triggerReader("neuroaccess:read-selection")}
            className="flex-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            Read selection
          </button>
          <button
            type="button"
            onClick={() => triggerReader("neuroaccess:read-page")}
            className="flex-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            Read page
          </button>
        </div>
      </div>
      <div className="mt-2 rounded-lg border border-sky-100 bg-sky-50/50 p-2.5">
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-sky-800">
          AI Image & PDF Vision
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => {
              const url = globalThis.chrome.runtime.getURL("tabs/describe.html")
              void globalThis.chrome.tabs.create({ url })
            }}
            className="w-full rounded-md border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-900 hover:bg-sky-50 text-left flex items-center justify-between">
            <span>🖼️ Open Image Descriptor / OCR Tool</span>
            <span className="text-gray-400">↗</span>
          </button>
          <button
            type="button"
            onClick={() => {
              globalThis.chrome.runtime.sendMessage({ type: "neuroaccess:capture-screen-ocr" })
            }}
            className="w-full rounded-md border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-900 hover:bg-sky-50 text-left flex items-center justify-between">
            <span>📄 Capture & Read PDF / Screen (OCR)</span>
            <span className="text-sky-600 font-bold">▶</span>
          </button>
        </div>
      </div>
      <div className="mt-1">
        <FeatureToggleRow
          icon={FEATURE_META.globalMode.icon}
          label={FEATURE_META.globalMode.label}
          description={FEATURE_META.globalMode.description}
          enabled={effective.globalMode.enabled}
          isOverridden={override.globalMode !== undefined}
          onToggle={(enabled) => applyPatch("globalMode", { enabled })}>
          {effective.globalMode.enabled ? <GlobalModeSummary summary={auditSummary} /> : null}
        </FeatureToggleRow>

        <FeatureToggleRow
          icon={FEATURE_META.contrastFixer.icon}
          label={FEATURE_META.contrastFixer.label}
          description={FEATURE_META.contrastFixer.description}
          enabled={effective.contrastFixer.enabled}
          isOverridden={override.contrastFixer !== undefined}
          onToggle={(enabled) => applyPatch("contrastFixer", { enabled })}>
          <ContrastFixerOptions
            settings={effective.contrastFixer}
            onChange={(patch) => applyPatch("contrastFixer", patch)}
          />
        </FeatureToggleRow>

        <FeatureToggleRow
          icon={FEATURE_META.readingRuler.icon}
          label={FEATURE_META.readingRuler.label}
          description={FEATURE_META.readingRuler.description}
          enabled={effective.readingRuler.enabled}
          isOverridden={override.readingRuler !== undefined}
          onToggle={(enabled) => applyPatch("readingRuler", { enabled })}
        />

        <FeatureToggleRow
          icon={FEATURE_META.syllableHighlighting.icon}
          label={FEATURE_META.syllableHighlighting.label}
          description={FEATURE_META.syllableHighlighting.description}
          enabled={effective.syllableHighlighting.enabled}
          isOverridden={override.syllableHighlighting !== undefined}
          onToggle={(enabled) => applyPatch("syllableHighlighting", { enabled })}
        />

        <FeatureToggleRow
          icon={FEATURE_META.calmTheme.icon}
          label={FEATURE_META.calmTheme.label}
          description={FEATURE_META.calmTheme.description}
          enabled={effective.calmTheme.enabled}
          isOverridden={override.calmTheme !== undefined}
          onToggle={(enabled) => applyPatch("calmTheme", { enabled })}>
          <CalmThemeOptions
            settings={effective.calmTheme}
            onChange={(patch) => applyPatch("calmTheme", patch)}
          />
        </FeatureToggleRow>

        <FeatureToggleRow
          icon={FEATURE_META.skipLinks.icon}
          label={FEATURE_META.skipLinks.label}
          description={FEATURE_META.skipLinks.description}
          enabled={effective.skipLinks.enabled}
          isOverridden={override.skipLinks !== undefined}
          onToggle={(enabled) => applyPatch("skipLinks", { enabled })}
        />

        <FeatureToggleRow
          icon={FEATURE_META.voiceCommands.icon}
          label={FEATURE_META.voiceCommands.label}
          description={FEATURE_META.voiceCommands.description}
          enabled={effective.voiceCommands.enabled}
          isOverridden={override.voiceCommands !== undefined}
          onToggle={(enabled) => applyPatch("voiceCommands", { enabled })}
        />
      </div>
      <button
        type="button"
        onClick={() => globalThis.chrome.runtime.openOptionsPage()}
        className="mt-3 w-full rounded border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
        Manage all site overrides
      </button>
    </div>
  )
}
