import { subscribeToMutations } from "~lib/dom/mutationWatcher"
import { injectStyle, isStyleInjected, removeStyle } from "~lib/dom/styleInjector"

const STYLE_ID = "neuroaccess-motion-reduction"

const MOTION_REDUCTION_CSS = `
*, *::before, *::after {
  animation-duration: 0.001ms !important;
  animation-delay: -0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
  transition-delay: -0.001ms !important;
  scroll-behavior: auto !important;
}
`

let unsubscribeMutations: (() => void) | undefined

function pauseAutoplayIn(root: Element | Document): void {
  const elements = Array.from(
    root.querySelectorAll<HTMLMediaElement>("video[autoplay], audio[autoplay]")
  )
  if (root instanceof HTMLMediaElement && root.hasAttribute("autoplay")) {
    elements.push(root)
  }
  elements.forEach((media) => {
    media.pause()
    media.removeAttribute("autoplay")
  })
}

/**
 * Pausing already-playing media is a one-way effect: toggling this off does not resume
 * playback, since forcing autoplay back on would itself be the worse UX violation.
 */
export function applyMotionReduction(): void {
  injectStyle(STYLE_ID, MOTION_REDUCTION_CSS)
  pauseAutoplayIn(document)

  if (!unsubscribeMutations) {
    unsubscribeMutations = subscribeToMutations((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) pauseAutoplayIn(node)
        })
      })
    })
  }
}

export function removeMotionReduction(): void {
  removeStyle(STYLE_ID)
  unsubscribeMutations?.()
  unsubscribeMutations = undefined
}

export function isMotionReductionApplied(): boolean {
  return isStyleInjected(STYLE_ID)
}
