import { fetchImageBlob, sendImageToBackend } from "~lib/ai/backendClient"
import { NEUROACCESS_OWN_ELEMENT_SELECTOR } from "~lib/dom/ownElements"

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "NAV",
  "FOOTER",
  "TEXTAREA",
  "INPUT"
])

function isVisibleElement(element: Element): boolean {
  const style = getComputedStyle(element)
  return style.display !== "none" && style.visibility !== "hidden"
}

function shouldSkipElement(element: Element): boolean {
  return (
    SKIP_TAGS.has(element.tagName) ||
    element.closest(NEUROACCESS_OWN_ELEMENT_SELECTOR) !== null
  )
}

function getImageSource(image: HTMLImageElement): string {
  return image.currentSrc || image.src || image.getAttribute("src") || ""
}

async function describeImageForSpeech(
  image: HTMLImageElement
): Promise<string> {
  const altText = image.getAttribute("alt")?.trim() || "No alt text provided."
  const src = getImageSource(image)

  if (!src) {
    return `Image. Alt text: ${altText}`
  }

  try {
    const blob = await fetchImageBlob(src)
    const result = await sendImageToBackend(blob, "ocr")
    const ocrText = result.success ? result.text.trim() : ""

    return ocrText
      ? `Image. Alt text: ${altText} OCR text: ${ocrText}`
      : `Image. Alt text: ${altText} OCR found no text in the image.`
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error"
    return `Image. Alt text: ${altText} OCR unavailable: ${message}`
  }
}

function collectReadingParts(
  node: Node,
  parts: Array<string | Promise<string>>
): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim()
    if (text) parts.push(text)
    return
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return

  const element = node as Element
  if (shouldSkipElement(element) || !isVisibleElement(element)) return

  if (element instanceof HTMLImageElement) {
    parts.push(describeImageForSpeech(element))
    return
  }

  for (const child of Array.from(element.childNodes)) {
    collectReadingParts(child, parts)
  }
}

export async function extractPageText(
  root: Element = document.body
): Promise<string> {
  const parts: Array<string | Promise<string>> = []
  collectReadingParts(root, parts)

  const resolved = await Promise.all(parts)
  return resolved.filter(Boolean).join(" ")
}
