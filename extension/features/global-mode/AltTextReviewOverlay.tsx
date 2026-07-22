import { useEffect, useState } from "react"

import { OVERLAY_Z_INDEX } from "~lib/dom/shadowRoot"

import {
  getCaptionedImageItems,
  updateCaptionedImageAlt,
  type CaptionedImageItem
} from "./aiImageScanner"

interface AltTextReviewOverlayProps {
  enabled: boolean
}

export function AltTextReviewOverlay({ enabled }: AltTextReviewOverlayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<CaptionedImageItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  useEffect(() => {
    function handleUpdate() {
      setItems(getCaptionedImageItems())
    }

    window.addEventListener("neuroaccess:alt-text-updated", handleUpdate)
    handleUpdate()

    return () => {
      window.removeEventListener("neuroaccess:alt-text-updated", handleUpdate)
    }
  }, [])

  if (!enabled || items.length === 0) return null

  const completedCount = items.filter((i) => i.status === "completed").length
  const processingCount = items.filter((i) => i.status === "processing").length

  function handleSaveEdit(item: CaptionedImageItem) {
    if (editValue.trim()) {
      updateCaptionedImageAlt(item.element, editValue.trim())
    }
    setEditingId(null)
  }

  function handleHighlightElement(element: HTMLImageElement) {
    element.scrollIntoView({ behavior: "smooth", block: "center" })
    const origOutline = element.style.outline
    element.style.outline = "4px solid #3B82F6"
    element.style.transition = "outline 0.3s"
    setTimeout(() => {
      element.style.outline = origOutline
    }, 2500)
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: OVERLAY_Z_INDEX,
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            background: "#1E293B",
            color: "#F8FAFC",
            border: "1px solid #334155",
            borderRadius: 20,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
          <span>🖼️ AI Alt Text ({completedCount}/{items.length})</span>
          {processingCount > 0 && (
            <span style={{ fontSize: 11, color: "#60A5FA" }}>Processing...</span>
          )}
        </button>
      ) : (
        <div
          style={{
            width: 340,
            maxHeight: 460,
            background: "#0F172A",
            color: "#F8FAFC",
            border: "1px solid #334155",
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}>
          <div
            style={{
              padding: "12px 14px",
              background: "#1E293B",
              borderBottom: "1px solid #334155",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
            <div>
              <strong style={{ fontSize: 14, color: "#F8FAFC" }}>AI Alt-Text Reviewer</strong>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>
                {completedCount} captioned · {processingCount} in progress
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#94A3B8",
                fontSize: 18,
                cursor: "pointer",
                padding: "2px 6px"
              }}>
              ×
            </button>
          </div>

          <div style={{ padding: 10, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#1E293B",
                  borderRadius: 8,
                  border: "1px solid #334155",
                  padding: 10,
                  fontSize: 12
                }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 6 }}>
                  <img
                    src={item.src}
                    alt=""
                    style={{
                      width: 44,
                      height: 44,
                      objectFit: "cover",
                      borderRadius: 4,
                      border: "1px solid #475569"
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#E2E8F0", marginBottom: 2, display: "flex", justifyContent: "space-between" }}>
                      <span>Image</span>
                      <button
                        type="button"
                        onClick={() => handleHighlightElement(item.element)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#38BDF8",
                          fontSize: 11,
                          cursor: "pointer",
                          padding: 0
                        }}>
                        Find on page
                      </button>
                    </div>
                    {item.status === "processing" ? (
                      <div style={{ color: "#60A5FA", fontStyle: "italic" }}>Generating caption...</div>
                    ) : item.status === "failed" ? (
                      <div style={{ color: "#F87171" }}>Failed to generate caption</div>
                    ) : editingId === item.id ? (
                      <div style={{ marginTop: 4 }}>
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          style={{
                            width: "100%",
                            background: "#0F172A",
                            border: "1px solid #38BDF8",
                            color: "#FFFFFF",
                            padding: "4px 6px",
                            borderRadius: 4,
                            fontSize: 12,
                            boxSizing: "border-box"
                          }}
                        />
                        <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            style={{
                              background: "#334155",
                              color: "#CBD5E1",
                              border: "none",
                              borderRadius: 4,
                              padding: "3px 8px",
                              cursor: "pointer"
                            }}>
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item)}
                            style={{
                              background: "#0284C7",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: 4,
                              padding: "3px 8px",
                              fontWeight: 600,
                              cursor: "pointer"
                            }}>
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ color: "#34D399", wordBreak: "break-word" }}>
                          "{item.currentAlt}"
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id)
                            setEditValue(item.currentAlt)
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#94A3B8",
                            fontSize: 11,
                            cursor: "pointer",
                            padding: "4px 0 0 0",
                            textDecoration: "underline"
                          }}>
                          Edit alt text
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
