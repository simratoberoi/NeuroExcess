export const BACKEND_BASE_URL = "http://localhost:8000"

export type AIMode = "caption" | "ocr"

export interface CaptionResponse {
  filename: string
  content_type: string
  size: number
  alt_text: string
  source: string
}

export interface OCRResponse {
  filename: string
  content_type: string
  size: number
  extracted_text: string
  word_count: number
  has_text: boolean
  language: string
  source: string
}

export interface AIBackendResult {
  success: boolean
  text: string
  source: string
  details?: {
    word_count?: number
    has_text?: boolean
    language?: string
  }
  error?: string
}

/** Converts data URLs into raw Blobs */
export function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",")
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : "image/png"
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

/** Fetches image bytes from any src URL, converting data/blob/http URLs into a Blob. */
export async function fetchImageBlob(src: string): Promise<Blob> {
  if (!src) throw new Error("Image source URL is empty")

  if (src.startsWith("data:")) {
    return dataURLtoBlob(src)
  }

  try {
    const res = await fetch(src, { mode: "cors" })
    if (res.ok) {
      return await res.blob()
    }
  } catch {
    // Fall back to image canvas rendering if direct fetch fails (e.g. CORS)
  }

  return new Promise<Blob>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth || img.width || 300
        canvas.height = img.naturalHeight || img.height || 300
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get 2D canvas context"))
          return
        }
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Canvas toBlob failed"))
        }, "image/png")
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error(`Failed to load image from source: ${src}`))
    img.src = src
  })
}

/** Unified backend API handler for /image/caption and /image/ocr */
export async function sendImageToBackend(
  blob: Blob | File,
  mode: AIMode
): Promise<AIBackendResult> {
  const formData = new FormData()
  const filename = blob instanceof File ? blob.name : "image.png"
  formData.append("file", blob, filename)

  const endpoint = mode === "caption" ? "/image/caption" : "/image/ocr"
  const url = `${BACKEND_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => "")
      let detail = `Server responded with status ${response.status}`
      try {
        const jsonErr = JSON.parse(errText)
        if (jsonErr.detail) detail = jsonErr.detail
      } catch {
        if (errText) detail = errText
      }
      return {
        success: false,
        text: "",
        source: "error",
        error: detail
      }
    }

    const data = await response.json()

    if (mode === "caption") {
      const capData = data as CaptionResponse
      return {
        success: true,
        text: capData.alt_text || "No description generated",
        source: capData.source || "huggingface"
      }
    } else {
      const ocrData = data as OCRResponse
      return {
        success: true,
        text: ocrData.extracted_text || "No text detected in image",
        source: ocrData.source || "easyocr",
        details: {
          word_count: ocrData.word_count,
          has_text: ocrData.has_text,
          language: ocrData.language
        }
      }
    }
  } catch (err: any) {
    const message =
      err?.message || "Failed to reach backend server. Make sure the backend is running."
    return {
      success: false,
      text: "",
      source: "error",
      error: message
    }
  }
}
