import { subscribeToMutations } from "~lib/dom/mutationWatcher"
import { injectStyle, isStyleInjected, removeStyle } from "~lib/dom/styleInjector"

const STYLE_ID = "neuroaccess-declutter"
const FADE_CLASS = "neuroaccess-declutter-faded"

const FADE_CSS = `
.${FADE_CLASS} {
  opacity: 0.15 !important;
  filter: blur(1px) !important;
  pointer-events: none !important;
  transition: opacity 0.2s ease !important;
}
`

// Conservative selector set (ad/tracking/sidebar patterns + the aside/complementary landmark)
// rather than a blind low-text-density scorer across the whole DOM: false-positive risk (fading
// real content, e.g. short buttons/badges) is worse than under-fading some clutter.
const CLUTTER_SELECTOR = [
  '[class*="advert" i]',
  '[id*="advert" i]',
  '[class*="-ad-" i]',
  '[class*="_ad_" i]',
  '[id*="google_ads" i]',
  'iframe[src*="doubleclick" i]',
  'iframe[id*="google_ads" i]',
  '[class*="sponsor" i]',
  '[id*="sponsor" i]',
  '[class*="promo" i]',
  '[class*="newsletter" i]',
  '[class*="popup" i]',
  '[class*="modal-overlay" i]',
  "aside",
  '[role="complementary"]'
].join(", ")

let unsubscribeMutations: (() => void) | undefined
const fadedElements = new Set<HTMLElement>()

function isMainContentDescendant(el: HTMLElement): boolean {
  return Boolean(el.closest("main, [role='main'], article"))
}

function scoreAndFade(el: HTMLElement): void {
  if (fadedElements.has(el) || isMainContentDescendant(el)) return
  el.classList.add(FADE_CLASS)
  fadedElements.add(el)
}

function scanForClutter(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(CLUTTER_SELECTOR).forEach(scoreAndFade)
}

export function applyDeclutter(): void {
  injectStyle(STYLE_ID, FADE_CSS)
  scanForClutter(document)

  if (!unsubscribeMutations) {
    unsubscribeMutations = subscribeToMutations((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          if (node.matches(CLUTTER_SELECTOR)) scoreAndFade(node)
          scanForClutter(node)
        })
      })
    })
  }
}

export function removeDeclutter(): void {
  removeStyle(STYLE_ID)
  unsubscribeMutations?.()
  unsubscribeMutations = undefined
  fadedElements.forEach((el) => el.classList.remove(FADE_CLASS))
  fadedElements.clear()
}

export function isDeclutterApplied(): boolean {
  return isStyleInjected(STYLE_ID)
}
