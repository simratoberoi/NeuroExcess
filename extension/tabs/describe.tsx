import { useEffect, useRef, useState } from "react"
import "~style.css"
import { fetchImageBlob, sendImageToBackend, type AIBackendResult, type AIMode } from "~lib/ai/backendClient"

export default function DescribePage() {
  const [mode, setMode] = useState<AIMode>("caption")
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<AIBackendResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0]
        if (file.type.startsWith("image/")) {
          handleFileSelected(file)
        }
      }
    }

    window.addEventListener("paste", handlePaste)
    return () => {
      window.removeEventListener("paste", handlePaste)
    }
  }, [])

  function handleFileSelected(file: File | Blob) {
    setSelectedFile(file)
    setResult(null)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        handleFileSelected(file)
      }
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  async function processImage() {
    if (!selectedFile) return
    setIsProcessing(true)
    setResult(null)

    try {
      const res = await sendImageToBackend(selectedFile, mode)
      setResult(res)
    } catch (err: any) {
      setResult({
        success: false,
        text: "",
        source: "error",
        error: err?.message || "Failed to process image"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  function handleCopy() {
    if (result?.text) {
      void navigator.clipboard.writeText(result.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleReadAloud() {
    if (!result?.text || !window.speechSynthesis) return
    window.speechSynthesis.cancel()

    if (isReading) {
      setIsReading(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(result.text)
    utterance.onend = () => setIsReading(false)
    utterance.onerror = () => setIsReading(false)

    setIsReading(true)
    window.speechSynthesis.speak(utterance)
  }

  function handleDownloadText() {
    if (!result?.text) return
    const blob = new Blob([result.text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `neuroaccess-${mode}-result.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans p-6">
      <header className="max-w-4xl w-full mx-auto mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <div>
            <h1 className="text-xl font-bold text-slate-100">NeuroAccess Image AI Tool</h1>
            <p className="text-xs text-slate-400">Generate alt-text captions or extract OCR text from any image</p>
          </div>
        </div>
        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => setMode("caption")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
              mode === "caption" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
            }`}>
            🖼️ Image Caption
          </button>
          <button
            type="button"
            onClick={() => setMode("ocr")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
              mode === "ocr" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
            }`}>
            🔤 OCR Extract
          </button>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* Left Column: Image Input & Upload */}
        <div className="flex flex-col gap-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-sky-500 bg-slate-800/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition min-h-[260px]">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelected(e.target.files[0])
                }
              }}
              accept="image/*"
              className="hidden"
            />

            {previewUrl ? (
              <img src={previewUrl} alt="Upload preview" className="max-h-60 rounded-lg object-contain" />
            ) : (
              <div className="text-center">
                <span className="text-4xl block mb-2">📁</span>
                <p className="text-sm font-semibold text-slate-200">Click to upload, drag & drop, or paste (Ctrl+V)</p>
                <p className="text-xs text-slate-400 mt-1">Supports PNG, JPEG, WEBP</p>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!selectedFile || isProcessing}
            onClick={processImage}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm rounded-xl transition shadow-lg text-white">
            {isProcessing
              ? "⏳ Processing Image with AI..."
              : mode === "caption"
              ? "Generate Description (Alt Text)"
              : "Extract Text (OCR)"}
          </button>
        </div>

        {/* Right Column: Output Results */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                {mode === "caption" ? "Generated Description" : "Extracted Text"}
              </h2>
              {result && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                  Engine: {result.source}
                </span>
              )}
            </div>

            {isProcessing ? (
              <div className="py-16 text-center text-slate-400">
                <div className="animate-spin text-3xl mb-2">🌀</div>
                <p className="text-sm font-medium">Processing with backend AI models...</p>
              </div>
            ) : result ? (
              result.success ? (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-100 text-sm leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {result.text}
                  </div>

                  {result.details && (
                    <div className="flex gap-4 text-xs text-slate-400">
                      <span>Words: {result.details.word_count ?? 0}</span>
                      <span>Text detected: {result.details.has_text ? "Yes" : "No"}</span>
                      {result.details.language && <span>Lang: {result.details.language}</span>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-950/60 border border-red-800 rounded-lg p-4 text-red-200 text-sm">
                  <p className="font-semibold mb-1">Processing Failed</p>
                  <p>{result.error}</p>
                </div>
              )
            ) : (
              <div className="py-16 text-center text-slate-500 text-sm">
                Upload or paste an image and click process to view results here.
              </div>
            )}
          </div>

          {result?.success && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-semibold rounded-lg text-slate-100 transition">
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
              <button
                type="button"
                onClick={handleReadAloud}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg text-white transition ${
                  isReading ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500"
                }`}>
                {isReading ? "⏹️ Stop" : "🔊 Read Aloud"}
              </button>
              <button
                type="button"
                onClick={handleDownloadText}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-semibold rounded-lg text-slate-100 transition">
                💾 Download
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
