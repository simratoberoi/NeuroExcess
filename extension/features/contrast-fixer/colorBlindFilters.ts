import { registerFilter, unregisterFilter } from "~lib/dom/filterStack"
import type { ColorBlindMode } from "~lib/settings/schema"

const SVG_ROOT_ID = "neuroaccess-colorblind-filters"
const FILTER_STACK_KEY = "contrastFixerColorBlind"

type Deficiency = Exclude<ColorBlindMode, "none">

/**
 * Daltonization (color-correction) matrices — NOT simulation matrices. These boost the
 * channels a person with each deficiency can't otherwise distinguish, so they actually help a
 * colorblind visitor tell colors apart, rather than making a sighted user's view impaired
 * (which is what the commonly-copied "colorblind simulation" feColorMatrix snippets do).
 *
 * Derived as combinedMatrix = I + errorShift - errorShift * simulationMatrix, following the
 * standard daltonize approach (error-redistribution on top of a Machado/Oliveira/Fernandes-style
 * simulation matrix), computed once and hardcoded here since both inputs are fixed constants.
 */
const CORRECTION_MATRICES: Record<Deficiency, [number, number, number][]> = {
  protanopia: [
    [1, 0, 0],
    [-0.2549, 1.2549, 0],
    [0.3031, -0.5451, 1.242]
  ],
  deuteranopia: [
    [1, 0, 0],
    [-0.4375, 1.4375, 0],
    [0.2625, -0.5625, 1.3]
  ],
  tritanopia: [
    [1, 0, 0],
    [0.035, 1.532, -0.567],
    [0.035, -0.51, 1.475]
  ]
}

function filterId(mode: Deficiency): string {
  return `neuroaccess-colorblind-${mode}`
}

function matrixToSvgValues(matrix: [number, number, number][]): string {
  const [r, g, b] = matrix
  return [...r, 0, 0, ...g, 0, 0, ...b, 0, 0, 0, 0, 0, 1, 0].join(" ")
}

const SVG_NS = "http://www.w3.org/2000/svg"

function ensureSvgDefsInjected(): void {
  if (document.getElementById(SVG_ROOT_ID)) return

  const svg = document.createElementNS(SVG_NS, "svg")
  svg.setAttribute("id", SVG_ROOT_ID)
  svg.setAttribute("aria-hidden", "true")
  svg.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden")

  const defs = document.createElementNS(SVG_NS, "defs")
  ;(Object.keys(CORRECTION_MATRICES) as Deficiency[]).forEach((mode) => {
    const filter = document.createElementNS(SVG_NS, "filter")
    filter.setAttribute("id", filterId(mode))
    filter.setAttribute("color-interpolation-filters", "sRGB")

    const feColorMatrix = document.createElementNS(SVG_NS, "feColorMatrix")
    feColorMatrix.setAttribute("type", "matrix")
    feColorMatrix.setAttribute("values", matrixToSvgValues(CORRECTION_MATRICES[mode]))

    filter.appendChild(feColorMatrix)
    defs.appendChild(filter)
  })

  svg.appendChild(defs)
  document.body.appendChild(svg)
}

export function applyColorBlindFilter(mode: ColorBlindMode): void {
  if (mode === "none") {
    unregisterFilter(FILTER_STACK_KEY)
    return
  }
  ensureSvgDefsInjected()
  registerFilter(FILTER_STACK_KEY, `url(#${filterId(mode)})`)
}

export function removeColorBlindFilter(): void {
  unregisterFilter(FILTER_STACK_KEY)
}
