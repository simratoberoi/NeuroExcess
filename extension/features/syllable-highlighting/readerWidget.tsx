import { forwardRef, useImperativeHandle, useRef, useState } from "react"

import { OVERLAY_Z_INDEX } from "~lib/dom/shadowRoot"

import { extractPageText } from "./extractPageText"
import { createTtsController, type TtsPlaybackHandle } from "./ttsPlayback"

type PlaybackState = "idle" | "playing" | "paused"

export interface StandaloneReaderHandle {
  readSelection: () => void
  readPage: () => Promise<void>
  stop: () => void
  pause: () => void
  resume: () => void
}

interface StandaloneReaderWidgetProps {
  rate?: number
}

export const StandaloneReaderWidget = forwardRef<
  StandaloneReaderHandle,
  StandaloneReaderWidgetProps
>(function StandaloneReaderWidget({ rate = 1 }, ref) {
  const [state, setState] = useState<PlaybackState>("idle")
  const handleRef = useRef<TtsPlaybackHandle>()
  const readRequestIdRef = useRef(0)

  function start(text: string) {
    if (!text.trim()) return
    handleRef.current?.stop()

    const handle = createTtsController(text, {
      rate,
      onEnd: () => setState("idle")
    })
    handleRef.current = handle
    handle.play()
    setState("playing")
  }

  function pause() {
    handleRef.current?.pause()
    setState("paused")
  }

  function resume() {
    handleRef.current?.resume()
    setState("playing")
  }

  function stop() {
    readRequestIdRef.current += 1
    handleRef.current?.stop()
    setState("idle")
  }

  async function readPage() {
    const requestId = ++readRequestIdRef.current
    const text = await extractPageText()
    if (requestId !== readRequestIdRef.current) return
    start(text)
  }

  useImperativeHandle(ref, () => ({
    readSelection: () => start(window.getSelection()?.toString().trim() ?? ""),
    readPage,
    stop,
    pause,
    resume
  }))

  if (state === "idle") return null

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: OVERLAY_Z_INDEX,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "#111827",
        color: "#fff",
        padding: "8px 12px",
        borderRadius: 8,
        font: "13px system-ui, sans-serif",
        boxShadow: "0 4px 14px rgba(0,0,0,0.25)"
      }}>
      {state === "playing" ? (
        <button type="button" onClick={pause} style={controlButtonStyle}>
          ⏸ Pause
        </button>
      ) : (
        <button type="button" onClick={resume} style={controlButtonStyle}>
          ▶ Resume
        </button>
      )}
      <button type="button" onClick={stop} style={controlButtonStyle}>
        ⏹ Stop
      </button>
    </div>
  )
})

const controlButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #ffffff55",
  color: "#fff",
  borderRadius: 4,
  padding: "4px 10px",
  cursor: "pointer",
  font: "inherit"
}
