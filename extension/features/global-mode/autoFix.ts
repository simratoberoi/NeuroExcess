import { scanAndCaptionImages } from "./aiImageScanner"
import { AUTO_FIXABLE_CATEGORIES, type AuditIssue } from "./issueTypes"

const ADDED_ALT_ATTR = "data-na-added-alt"
const ADDED_ARIA_LABEL_ATTR = "data-na-added-aria-label"

function humanizeFromSrc(src: string): string {
  const filename = src.split("/").pop()?.split("?")[0] ?? ""
  const withoutExt = filename.replace(/\.[a-z0-9]+$/i, "")
  const spaced = withoutExt.replace(/[-_]+/g, " ").trim()
  return spaced.length > 1 ? spaced : "Image"
}

function fixImageAlt(img: HTMLImageElement): void {
  // Set fallback immediate alt text while AI captioning is in progress
  if (!img.hasAttribute("alt")) {
    img.setAttribute("alt", humanizeFromSrc(img.src))
    img.setAttribute(ADDED_ALT_ATTR, "true")
  }
  // Trigger backend AI captioning scan
  void scanAndCaptionImages(img.parentElement || document.body)
}

function humanizeFromField(field: HTMLElement): string {
  const placeholder = field.getAttribute("placeholder")
  if (placeholder?.trim()) return placeholder.trim()

  const raw = field.getAttribute("name") || field.id
  if (raw) {
    return raw
      .replace(/[-_]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .trim()
  }

  if (field.tagName === "SELECT") return "Dropdown"
  if (field.tagName === "TEXTAREA") return "Text area"
  return "Input field"
}

function fixFormLabel(field: HTMLElement): void {
  field.setAttribute("aria-label", humanizeFromField(field))
  field.setAttribute(ADDED_ARIA_LABEL_ATTR, "true")
}

function humanizeControlLabel(control: HTMLElement): string {
  const title = control.getAttribute("title")
  if (title?.trim()) return title.trim()
  return control.tagName === "A" ? "Link" : "Button"
}

function fixUnlabeledControl(control: HTMLElement): void {
  control.setAttribute("aria-label", humanizeControlLabel(control))
  control.setAttribute(ADDED_ARIA_LABEL_ATTR, "true")
}

export interface FixOutcome {
  fixed: AuditIssue[]
  needsReview: AuditIssue[]
}

/** Applies every auto-fixable issue in `issues`, returning what got fixed vs. what still needs a human. */
export function applyAutoFixes(issues: AuditIssue[]): FixOutcome {
  const fixed: AuditIssue[] = []
  const needsReview: AuditIssue[] = []

  for (const issue of issues) {
    if (!AUTO_FIXABLE_CATEGORIES.has(issue.category)) {
      needsReview.push(issue)
      continue
    }

    switch (issue.category) {
      case "missingAlt":
        fixImageAlt(issue.element as HTMLImageElement)
        break
      case "missingFormLabel":
        fixFormLabel(issue.element as HTMLElement)
        break
      case "unlabeledControl":
        fixUnlabeledControl(issue.element as HTMLElement)
        break
    }
    fixed.push(issue)
  }

  return { fixed, needsReview }
}

/** Reverts every attribute Global Mode added, restoring the page to exactly how it was found. */
export function revertAutoFixes(): void {
  document.querySelectorAll(`[${ADDED_ALT_ATTR}]`).forEach((el) => {
    el.removeAttribute("alt")
    el.removeAttribute(ADDED_ALT_ATTR)
  })
  document.querySelectorAll(`[${ADDED_ARIA_LABEL_ATTR}]`).forEach((el) => {
    el.removeAttribute("aria-label")
    el.removeAttribute(ADDED_ARIA_LABEL_ATTR)
  })
}
