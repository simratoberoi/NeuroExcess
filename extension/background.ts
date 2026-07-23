import { clearAuthSession, setAuthSession } from "~lib/auth/session"
import { dataURLtoBlob, fetchImageBlob, sendImageToBackend } from "~lib/ai/backendClient"
import { deriveSettingsPatchFromProfile } from "~lib/settings/profile/deriveSettingsPatch"
import { setGlobalSettings } from "~lib/settings/store"

interface AuthMessage {
  type: "NEUROEXCESS_AUTH"
  token: string
  accessibilityNeeds: string[]
}

interface LogoutMessage {
  type: "NEUROEXCESS_LOGOUT"
}

type IncomingMessage = AuthMessage | LogoutMessage

chrome.runtime.onMessageExternal.addListener((message: IncomingMessage, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    sendResponse({ ok: false, error: "Malformed message" })
    return false
  }

  if (message.type === "NEUROEXCESS_AUTH") {
    handleAuth(message)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }))
    return true // keep the message channel open for the async response
  }

  if (message.type === "NEUROEXCESS_LOGOUT") {
    clearAuthSession()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }))
    return true
  }

  sendResponse({ ok: false, error: `Unknown message type` })
  return false
})

async function handleAuth(message: AuthMessage): Promise<void> {
  const accessibilityNeeds = Array.isArray(message.accessibilityNeeds) ? message.accessibilityNeeds : []

  await setAuthSession({
    token: message.token ?? null,
    accessibilityNeeds,
    signedInAt: Date.now()
  })

  const patch = deriveSettingsPatchFromProfile(accessibilityNeeds)
  await setGlobalSettings(patch)
}

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