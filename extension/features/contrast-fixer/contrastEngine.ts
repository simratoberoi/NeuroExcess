import { getContrast, hsla, parseToHsla } from "color2k"

import type { ContrastLevel } from "~lib/settings/schema"

const TARGET_RATIOS: Record<ContrastLevel, number> = { AA: 4.5, AAA: 7 }

const MARK_ATTR = "data-na-contrast-fixed"
const ORIGINAL_ATTR = "data-na-original-color"
const HAD_INLINE_ATTR = "data-na-had-inline-color"

// Elements we injected ourselves (skip links, color-blind SVG defs) shouldn't be re-scanned.
const OWN_ELEMENT_SELECTOR = "#neuroaccess-skip-links, #neuroaccess-colorblind-filters"

let observer: IntersectionObserver | undefined
const fixedElements = new Set<HTMLElement>()

function hasAnyDirectTextNode(el: Element): boolean {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length > 0) {
      return true
    }
  }
  return false
}

function getEffectiveBackgroundColor(el: Element): string {
  let current: Element | null = el
  while (current) {
    const bg = getComputedStyle(current).backgroundColor
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
      return bg
    }
    current = current.parentElement
  }
  return "#ffffff"
}

/** Tests one lightness step in each direction and picks whichever actually raises contrast. */
function pickDarkenDirection(textColor: string, bgColor: string): 1 | -1 {
  const [h, s, l, a] = parseToHsla(textColor)
  const darker = hsla(h, s, Math.max(0, l - 0.05), a)
  const lighter = hsla(h, s, Math.min(1, l + 0.05), a)
  return getContrast(darker, bgColor) >= getContrast(lighter, bgColor) ? -1 : 1
}

function adjustColorForContrast(textColor: string, bgColor: string, targetRatio: number): string {
  const [h, s, l, a] = parseToHsla(textColor)
  const direction = pickDarkenDirection(textColor, bgColor)

  let candidateL = l
  for (let i = 0; i < 20; i++) {
    candidateL = Math.min(1, Math.max(0, candidateL + direction * 0.05))
    const candidate = hsla(h, s, candidateL, a)
    if (getContrast(candidate, bgColor) >= targetRatio || candidateL === 0 || candidateL === 1) {
      return candidate
    }
  }
  return hsla(h, s, candidateL, a)
}

function fixElementContrast(el: HTMLElement, targetRatio: number): void {
  if (el.hasAttribute(MARK_ATTR) || el.closest(OWN_ELEMENT_SELECTOR)) return

  const computed = getComputedStyle(el)
  const textColor = computed.color
  const bgColor = getEffectiveBackgroundColor(el)
  if (getContrast(textColor, bgColor) >= targetRatio) return

  const hadInline = el.style.color !== ""
  el.setAttribute(HAD_INLINE_ATTR, hadInline ? "true" : "false")
  el.setAttribute(ORIGINAL_ATTR, el.style.color)

  const fixedColor = adjustColorForContrast(textColor, bgColor, targetRatio)
  el.style.setProperty("color", fixedColor, "important")
  el.setAttribute(MARK_ATTR, "true")
  fixedElements.add(el)
}

/** Scans the page for visible text elements below the target contrast ratio and fixes them. */
export function startContrastEngine(contrastLevel: ContrastLevel): void {
  stopContrastEngine()
  const targetRatio = TARGET_RATIOS[contrastLevel]

  const candidates = Array.from(document.body.querySelectorAll<HTMLElement>("*")).filter(
    hasAnyDirectTextNode
  )

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          fixElementContrast(entry.target as HTMLElement, targetRatio)
          observer?.unobserve(entry.target)
        }
      })
    },
    { rootMargin: "200px" }
  )

  candidates.forEach((el) => observer?.observe(el))
}

export function stopContrastEngine(): void {
  observer?.disconnect()
  observer = undefined

  fixedElements.forEach((el) => {
    const hadInline = el.getAttribute(HAD_INLINE_ATTR) === "true"
    if (hadInline) {
      el.style.setProperty("color", el.getAttribute(ORIGINAL_ATTR) ?? "")
    } else {
      el.style.removeProperty("color")
    }
    el.removeAttribute(MARK_ATTR)
    el.removeAttribute(ORIGINAL_ATTR)
    el.removeAttribute(HAD_INLINE_ATTR)
  })
  fixedElements.clear()
}

export function isContrastEngineRunning(): boolean {
  return observer !== undefined
}
