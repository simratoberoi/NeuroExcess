import type { FeatureController } from "~features/types"
import type { CalmThemeSettings } from "~lib/settings/schema"

import { applyDeclutter, isDeclutterApplied, removeDeclutter } from "./declutter"
import { applyDesaturate, isDesaturateApplied, removeDesaturate } from "./desaturate"
import {
  applyMotionReduction,
  isMotionReductionApplied,
  removeMotionReduction
} from "./motionReduction"

export const calmThemeController: FeatureController<CalmThemeSettings> = {
  apply(settings) {
    if (settings.desaturate) applyDesaturate()
    else removeDesaturate()

    if (settings.reduceMotion) applyMotionReduction()
    else removeMotionReduction()

    if (settings.declutter) applyDeclutter()
    else removeDeclutter()
  },
  remove() {
    removeDesaturate()
    removeMotionReduction()
    removeDeclutter()
  },
  isApplied() {
    return isDesaturateApplied() || isMotionReductionApplied() || isDeclutterApplied()
  }
}
