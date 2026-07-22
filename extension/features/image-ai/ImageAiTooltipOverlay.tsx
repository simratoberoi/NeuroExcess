import { useEffect, useState } from "react"

import type { AIBackendResult } from "~lib/ai/backendClient"
import { OVERLAY_Z_INDEX } from "~lib/dom/shadowRoot"

export interface ShowAiResultPayload {
  mode: "caption" | "ocr"
  srcUrl: string
  result: AIBackendResult
}

export function ImageAiTooltipOverlay() {
  const [data, setData] = useState<ShowAiResultPayload | null>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [appliedAlt, setAppliedAlt] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const runtime = globalThis.chrome.runtime

  useEffect(() => {
    function handleMessage(msg: any) {
      if (msg?.type === "neuroaccess:show-image-ai-result") {
        const payload = msg.payload as ShowAiResultPayload
        setData(payload)
        setCopied(false)
        setAppliedAlt(false)

        // Try locating element to position tooltip near image
        const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("img[src]"))
        const targetImg = imgs.find((img) => img.src === payload.srcUrl)

        if (targetImg) {
          const rect = targetImg.getBoundingClientRect()
          setPosition({
            x: Math.max(16, Math.min(window.innerWidth - 360, rect.left + window.scrollX)),
            y: Math.max(16, rect.bottom + window.scrollY + 8)
          })
          targetImg.scrollIntoView({ behavior: "smooth", block: "nearest" })
        } else {
          // Center top fallback
          setPosition({
            x: Math.max(16, window.innerWidth / 2 - 170),
            y: window.scrollY + 100
          })
        }
      }
    }

    runtime?.onMessage?.addListener(handleMessage)
    return () => {
      runtime?.onMessage?.removeListener(handleMessage)
    }
  }, [runtime])

  if (!data || !position) return null

  const title = data.mode === "caption" ? "🖼️ Image Description (AI)" : "🔤 Extracted Text (OCR)"
  const text = data.result.success ? data.result.text : `Error: ${data.result.error}`

  function handleCopy() {
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleApplyAlt() {
    if (!data?.srcUrl) return
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("img[src]"))
    const targetImg = imgs.find((img) => img.src === data.srcUrl)
    if (targetImg) {
      targetImg.setAttribute("alt", text)
      targetImg.setAttribute("data-na-added-alt", "user-applied")
      setAppliedAlt(true)
      setTimeout(() => setAppliedAlt(false), 2000)
    }
  }

  function handleReadAloud() {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    if (isReading) {
      setIsReading(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => setIsReading(false)
    utterance.onerror = () => setIsReading(false)

    setIsReading(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        zIndex: OVERLAY_Z_INDEX,
        width: 340,
        background: "#0F172A",
        color: "#F8FAFC",
        border: "1px solid #334155",
        borderRadius: 12,
        boxShadow: "0 16px 36px rgba(0,0,0,0.45)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 14,
        fontSize: 13,
        boxSizing: "border-box"
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong style={{ fontSize: 13, color: "#38BDF8" }}>{title}</strong>
        <button
          type="button"
          onClick={() => {
            if (window.speechSynthesis) window.speechSynthesis.cancel()
            setData(null)
          }}
          style={{
            background: "none",
            border: "none",
            color: "#94A3B8",
            fontSize: 18,
            cursor: "pointer",
            padding: 0
          }}>
          ×
        </button>
      </div>

      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: 8,
          padding: 10,
          maxHeight: 180,
          overflowY: "auto",
          color: data.result.success ? "#E2E8F0" : "#F87171",
          lineHeight: 1.4,
          wordBreak: "break-word",
          marginBottom: 10
        }}>
        {text}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            flex: 1,
            background: "#334155",
            color: "#F8FAFC",
            border: "none",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer"
          }}>
          {copied ? "✓ Copied!" : "📋 Copy"}
        </button>

        {data.mode === "caption" && (
          <button
            type="button"
            onClick={handleApplyAlt}
            style={{
              flex: 1,
              background: "#0284C7",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}>
            {appliedAlt ? "✓ Alt Set!" : "🏷️ Set Alt"}
          </button>
        )}

        <button
          type="button"
          onClick={handleReadAloud}
          style={{
            flex: 1,
            background: isReading ? "#DC2626" : "#059669",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer"
          }}>
          {isReading ? "⏹️ Stop" : "🔊 Read Aloud"}
        </button>
      </div>
    </div>
  )
}
