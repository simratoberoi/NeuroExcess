import { syllabify } from "./syllabify"
import { estimateWordDurationMs, stepThroughSyllables } from "./syllableTimingEstimator"

export interface TtsHighlightState {
  wordStart: number
  wordEnd: number
  syllableIndex: number
}

export interface TtsPlaybackHandle {
  play: () => void
  pause: () => void
  resume: () => void
  stop: () => void
}

interface CoreSpeakOptions {
  rate: number
  onBoundary?: (charIndex: number, charLength: number) => void
  onEnd: () => void
}

const MAX_CHUNK_CHARS = 200

/**
 * Chrome's speechSynthesis silently fails (or cuts speech off) on a single very long utterance —
 * fine for a manual text selection, but "read whole page" easily produces several thousand
 * characters and runs straight into it. Splitting into sentence-sized chunks (hard-wrapped at
 * word boundaries if a single sentence is still too long) and speaking them one at a time via
 * chained `end` events keeps every individual utterance well under that limit.
 */
function splitIntoChunks(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) ?? [text]
  const chunks: string[] = []

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue

    if (trimmed.length <= MAX_CHUNK_CHARS) {
      chunks.push(trimmed)
      continue
    }

    let piece = ""
    for (const word of trimmed.split(/\s+/)) {
      const next = piece ? `${piece} ${word}` : word
      if (next.length > MAX_CHUNK_CHARS && piece) {
        chunks.push(piece)
        piece = word
      } else {
        piece = next
      }
    }
    if (piece) chunks.push(piece)
  }

  return chunks.length > 0 ? chunks : [text]
}

/**
 * Low-level utterance lifecycle shared by both the syllable-highlighting overlay
 * (speakWithSyllableHighlight) and the standalone full-page/selection reader
 * (StandaloneReaderWidget). Callers own text extraction and any highlighting logic;
 * this just wraps the native SpeechSynthesisUtterance play/pause/resume/stop lifecycle,
 * transparently chunking long text so it actually plays.
 */
export function createTtsController(text: string, options: CoreSpeakOptions): TtsPlaybackHandle {
  const chunks = splitIntoChunks(text)
  const offsets: number[] = []
  {
    let running = 0
    for (const chunk of chunks) {
      offsets.push(running)
      running += chunk.length + 1
    }
  }

  let stopped = false

  function speakChunk(index: number): void {
    if (stopped) return
    if (index >= chunks.length) {
      options.onEnd()
      return
    }

    const utterance = new SpeechSynthesisUtterance(chunks[index])
    utterance.rate = options.rate

    utterance.addEventListener("boundary", (event) => {
      if (event.name !== "word") return
      options.onBoundary?.(offsets[index] + event.charIndex, event.charLength)
    })

    const next = () => speakChunk(index + 1)
    utterance.addEventListener("end", next)
    utterance.addEventListener("error", next)

    speechSynthesis.speak(utterance)
  }

  return {
    play: () => {
      stopped = false
      speakChunk(0)
    },
    pause: () => speechSynthesis.pause(),
    resume: () => speechSynthesis.resume(),
    stop: () => {
      stopped = true
      speechSynthesis.cancel()
    }
  }
}

interface SpeakOptions {
  rate: number
  onHighlight: (state: TtsHighlightState | null) => void
  onEnd: () => void
}

/**
 * Reads `text` aloud via the browser-native Web Speech API, calling `onHighlight` as playback
 * progresses word-by-word (native `boundary` events) and syllable-by-syllable within each word
 * (estimated — see syllableTimingEstimator.ts).
 *
 * Used by the syllable-highlighting overlay (ReadingBarOverlay.tsx). Behavior and call signature
 * are unchanged from before — it now just delegates the utterance lifecycle to createTtsController.
 */
export function speakWithSyllableHighlight(text: string, options: SpeakOptions): TtsPlaybackHandle {
  let lastBoundaryTime = performance.now()
  let cancelStepper: (() => void) | undefined

  const controller = createTtsController(text, {
    rate: options.rate,
    onBoundary: (charIndex, charLength) => {
      cancelStepper?.()

      const word =
        charLength > 0
          ? text.slice(charIndex, charIndex + charLength)
          : (text.slice(charIndex).match(/^\S+/)?.[0] ?? "")
      if (!word) return

      const now = performance.now()
      const observedInterval = now - lastBoundaryTime
      lastBoundaryTime = now

      // Self-correct using the previous observed inter-boundary interval once we have a
      // plausible one; otherwise fall back to a length-based estimate (e.g. for the first word).
      const durationMs =
        observedInterval > 50 && observedInterval < 5000
          ? observedInterval
          : estimateWordDurationMs(word, options.rate)

      const wordStart = charIndex
      const wordEnd = charIndex + word.length
      const syllables = syllabify(word)

      if (syllables.length <= 1) {
        options.onHighlight({ wordStart, wordEnd, syllableIndex: 0 })
        return
      }

      const { cancel } = stepThroughSyllables(syllables, durationMs, (index) => {
        options.onHighlight({ wordStart, wordEnd, syllableIndex: index })
      })
      cancelStepper = cancel
    },
    onEnd: () => {
      cancelStepper?.()
      options.onHighlight(null)
      options.onEnd()
    }
  })

  controller.play()

  return {
    ...controller,
    stop: () => {
      cancelStepper?.()
      controller.stop()
    }
  }
}
