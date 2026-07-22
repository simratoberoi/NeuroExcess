import { fetchImageBlob, sendImageToBackend } from "~lib/ai/backendClient"
import { NEUROACCESS_OWN_ELEMENT_SELECTOR } from "~lib/dom/ownElements"

const captionCache = new Map<string, string>()
const processingQueue = new Set<string>()

export interface CaptionedImageItem {
  id: string
  src: string
  originalAlt: string
  aiAlt: string
  currentAlt: string
  element: HTMLImageElement
  status: "pending" | "processing" | "completed" | "failed"
}

const captionedItemsMap = new Map<HTMLImageElement, CaptionedImageItem>()

function isOwn(el: Element): boolean {
  return el.closest(NEUROACCESS_OWN_ELEMENT_SELECTOR) !== null
}

function queryIncludingSelf<T extends Element>(root: Element, selector: string): T[] {
  const self = root.matches(selector) ? [root as unknown as T] : []
  return self.concat(Array.from(root.querySelectorAll<T>(selector)))
}

function notifyUpdate() {
  window.dispatchEvent(new CustomEvent("neuroaccess:alt-text-updated"))
}

/** Returns all images that have been audited/captioned for review UI */
export function getCaptionedImageItems(): CaptionedImageItem[] {
  return Array.from(captionedItemsMap.values()).filter(
    (item) => item.element.isConnected
  )
}

/** Updates alt text of a specific image element (e.g. from user edit in review UI) */
export function updateCaptionedImageAlt(element: HTMLImageElement, newAlt: string): void {
  element.setAttribute("alt", newAlt)
  element.setAttribute("data-na-added-alt", "user-edited")
  const item = captionedItemsMap.get(element)
  if (item) {
    item.currentAlt = newAlt
    notifyUpdate()
  }
}

/** Processes a queue of images with a concurrency limit (default 3 concurrent max) */
async function processBatchQueue<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  const results: Promise<void>[] = []
  const executing = new Set<Promise<void>>()

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item))
    results.push(p)
    executing.add(p)

    const clean = () => executing.delete(p)
    p.then(clean, clean)

    if (executing.size >= limit) {
      await Promise.race(executing)
    }
  }

  await Promise.all(results)
}

/** Scans root element for images missing alt text and captions them via backend AI */
export async function scanAndCaptionImages(root: Element = document.body): Promise<void> {
  const images = queryIncludingSelf<HTMLImageElement>(root, "img[src]")
  const targetImages = images.filter((img) => {
    if (isOwn(img) || !img.src) return false
    const alt = img.getAttribute("alt")
    // Target images missing alt or having weak alt text (< 5 chars)
    return alt === null || alt.trim().length < 5
  })

  if (targetImages.length === 0) return

  const toProcess: HTMLImageElement[] = []

  for (const img of targetImages) {
    const src = img.src
    // Check cache first
    if (captionCache.has(src)) {
      const cachedAlt = captionCache.get(src)!
      if (!img.hasAttribute("alt") || img.alt !== cachedAlt) {
        img.setAttribute("alt", cachedAlt)
        img.setAttribute("data-na-added-alt", "ai-cached")
      }
      captionedItemsMap.set(img, {
        id: Math.random().toString(36).substring(2),
        src,
        originalAlt: img.getAttribute("data-na-original-alt") || "",
        aiAlt: cachedAlt,
        currentAlt: cachedAlt,
        element: img,
        status: "completed"
      })
      continue
    }

    if (!processingQueue.has(src)) {
      toProcess.push(img)
    }
  }

  if (toProcess.length === 0) {
    notifyUpdate()
    return
  }

  // Process batch with max 3 concurrent API requests
  await processBatchQueue(toProcess, 3, async (img) => {
    const src = img.src
    if (processingQueue.has(src)) return
    processingQueue.add(src)

    if (!img.hasAttribute("data-na-original-alt")) {
      img.setAttribute("data-na-original-alt", img.getAttribute("alt") || "")
    }

    const item: CaptionedImageItem = {
      id: Math.random().toString(36).substring(2),
      src,
      originalAlt: img.getAttribute("data-na-original-alt") || "",
      aiAlt: "",
      currentAlt: img.alt || "",
      element: img,
      status: "processing"
    }
    captionedItemsMap.set(img, item)
    notifyUpdate()

    try {
      const blob = await fetchImageBlob(src)
      const result = await sendImageToBackend(blob, "caption")

      if (result.success && result.text) {
        const caption = result.text
        captionCache.set(src, caption)
        img.setAttribute("alt", caption)
        img.setAttribute("data-na-added-alt", "ai")
        item.aiAlt = caption
        item.currentAlt = caption
        item.status = "completed"
      } else {
        item.status = "failed"
      }
    } catch {
      item.status = "failed"
    } finally {
      processingQueue.delete(src)
      notifyUpdate()
    }
  })
}
