import type { FeatureController } from "~features/types"
import type { ContrastFixerSettings } from "~lib/settings/schema"

import { applyColorBlindFilter, removeColorBlindFilter } from "./colorBlindFilters"
import { isContrastEngineRunning, startContrastEngine, stopContrastEngine } from "./contrastEngine"

export const contrastFixerController: FeatureController<ContrastFixerSettings> = {
  apply(settings) {
    applyColorBlindFilter(settings.colorBlindMode)
    startContrastEngine(settings.contrastLevel)
  },
  remove() {
    removeColorBlindFilter()
    stopContrastEngine()
  },
  isApplied() {
    return isContrastEngineRunning()
  }
}
