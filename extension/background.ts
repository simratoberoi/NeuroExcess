import { dataURLtoBlob, fetchImageBlob, sendImageToBackend } from "~lib/ai/backendClient"

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "read-selection-aloud",
    title: "Read selection aloud",
    contexts: ["selection"]
  })
  chrome.contextMenus.create({
    id: "read-page-aloud",
    title: "Read page aloud",
    contexts: ["page"]
  })
  chrome.contextMenus.create({
    id: "describe-image",
    title: "🖼️ Describe this image (AI)",
    contexts: ["image"]
  })
  chrome.contextMenus.create({
    id: "ocr-image",
    title: "🔤 Extract text from image (OCR)",
    contexts: ["image"]
  })
  chrome.contextMenus.create({
    id: "capture-pdf-ocr",
    title: "📄 Capture & Read PDF / Screen (OCR)",
    contexts: ["page", "frame"]
  })
})

async function processAndSendImageResult(
  tabId: number,
  srcUrl: string,
  mode: "caption" | "ocr"
) {
  try {
    const blob = await fetchImageBlob(srcUrl)
    const result = await sendImageToBackend(blob, mode)
    chrome.tabs.sendMessage(tabId, {
      type: "neuroaccess:show-image-ai-result",
      payload: {
        mode,
        srcUrl,
        result
      }
    })
  } catch (err: any) {
    chrome.tabs.sendMessage(tabId, {
      type: "neuroaccess:show-image-ai-result",
      payload: {
        mode,
        srcUrl,
        result: {
          success: false,
          text: "",
          source: "error",
          error: err?.message || "Failed to process image"
        }
      }
    })
  }
}

async function captureScreenAndReadOcr(tab: chrome.tabs.Tab) {
  if (!tab.id || !tab.windowId) return

  chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, async (dataUrl) => {
    if (!dataUrl) {
      chrome.tabs.sendMessage(tab.id!, {
        type: "neuroaccess:show-image-ai-result",
        payload: {
          mode: "ocr",
          srcUrl: "",
          result: {
            success: false,
            text: "",
            source: "error",
            error: "Screen capture failed or permission denied"
          }
        }
      })
      return
    }

    try {
      const blob = dataURLtoBlob(dataUrl)
      const result = await sendImageToBackend(blob, "ocr")

      chrome.tabs.sendMessage(tab.id!, {
        type: "neuroaccess:show-image-ai-result",
        payload: {
          mode: "ocr",
          srcUrl: dataUrl,
          result
        }
      })
    } catch (err: any) {
      chrome.tabs.sendMessage(tab.id!, {
        type: "neuroaccess:show-image-ai-result",
        payload: {
          mode: "ocr",
          srcUrl: dataUrl,
          result: {
            success: false,
            text: "",
            source: "error",
            error: err?.message || "Failed to extract text from PDF screen capture"
          }
        }
      })
    }
  })
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return

  if (info.menuItemId === "read-selection-aloud") {
    chrome.tabs.sendMessage(tab.id, { type: "neuroaccess:read-selection" })
  } else if (info.menuItemId === "read-page-aloud") {
    chrome.tabs.sendMessage(tab.id, { type: "neuroaccess:read-page" })
  } else if (info.menuItemId === "describe-image" && info.srcUrl) {
    void processAndSendImageResult(tab.id, info.srcUrl, "caption")
  } else if (info.menuItemId === "ocr-image" && info.srcUrl) {
    void processAndSendImageResult(tab.id, info.srcUrl, "ocr")
  } else if (info.menuItemId === "capture-pdf-ocr") {
    void captureScreenAndReadOcr(tab)
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "neuroaccess:capture-screen-ocr") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
      if (activeTab) {
        void captureScreenAndReadOcr(activeTab)
        sendResponse({ success: true })
      }
    })
    return true
  }
})
