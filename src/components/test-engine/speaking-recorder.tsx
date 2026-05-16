'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Mic, RotateCcw, Square, Volume2 } from 'lucide-react'

type RecordingValue = {
  audioUrl: string
  durationSeconds: number
  mimeType: string
  key?: string
}

interface SpeakingRecorderProps {
  attemptId?: string
  value?: RecordingValue | null
  onChange?: (value: RecordingValue | null) => void
  maxSeconds?: number
  uploadEndpoint?: string
  readOnly?: boolean
}

const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm'
  return MIME_TYPES.find(type => MediaRecorder.isTypeSupported(type)) ?? 'audio/webm'
}

export function SpeakingRecorder({
  attemptId,
  value,
  onChange,
  maxSeconds = 120,
  uploadEndpoint = '/api/speaking-recordings',
  readOnly = false,
}: SpeakingRecorderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const frameRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const [permissionState, setPermissionState] = useState<'idle' | 'requesting' | 'ready' | 'denied'>('idle')
  const [phase, setPhase] = useState<'idle' | 'recording' | 'processing' | 'uploading' | 'done' | 'error'>(
    value?.audioUrl ? 'done' : 'idle'
  )
  const [recordingSeconds, setRecordingSeconds] = useState(value?.durationSeconds ?? 0)
  const [uploadedValue, setUploadedValue] = useState<RecordingValue | null>(value ?? null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const remainingSeconds = useMemo(() => Math.max(0, maxSeconds - recordingSeconds), [maxSeconds, recordingSeconds])
  const isLowTime = remainingSeconds <= 15

  useEffect(() => {
    setUploadedValue(value ?? null)
    setPhase(value?.audioUrl ? 'done' : 'idle')
    setRecordingSeconds(value?.durationSeconds ?? 0)
  }, [value])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current)
      audioContextRef.current?.close().catch(() => undefined)
      streamRef.current?.getTracks().forEach(track => track.stop())
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  const syncCanvasSize = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.floor(rect.width * ratio))
    canvas.height = Math.max(1, Math.floor(rect.height * ratio))
  }

  const drawWaveform = () => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current

    if (!canvas || !analyser) return

    const context = canvas.getContext('2d')
    if (!context) return

    const width = canvas.width
    const height = canvas.height
    const data = new Uint8Array(analyser.fftSize)

    analyser.getByteTimeDomainData(data)

    context.clearRect(0, 0, width, height)
    context.fillStyle = '#09090b'
    context.fillRect(0, 0, width, height)

    context.lineWidth = 2
    context.strokeStyle = isLowTime ? '#f97316' : '#38bdf8'
    context.beginPath()

    const sliceWidth = width / data.length
    let x = 0

    for (let index = 0; index < data.length; index += 1) {
      const amplitude = data[index] / 128.0
      const y = amplitude * (height / 2)

      if (index === 0) {
        context.moveTo(x, y)
      } else {
        context.lineTo(x, y)
      }

      x += sliceWidth
    }

    context.lineTo(width, height / 2)
    context.stroke()

    frameRef.current = window.requestAnimationFrame(drawWaveform)
  }

  const stopVisualizer = () => {
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    audioContextRef.current?.close().catch(() => undefined)
    audioContextRef.current = null
    analyserRef.current = null
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }

  const resetRecording = () => {
    stopRecording()
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    mediaRecorderRef.current = null
    chunksRef.current = []
    stopVisualizer()
    setPhase('idle')
    setRecordingSeconds(0)
    setErrorMessage(null)

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    setUploadedValue(null)
    onChange?.(null)
  }

  const uploadRecording = async (blob: Blob, durationSeconds: number, mimeType: string) => {
    setPhase('uploading')
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('file', new File([blob], `speaking-${Date.now()}.webm`, { type: mimeType }))
    if (attemptId) formData.append('attemptId', attemptId)

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload.error || 'Upload failed')
    }

    const nextValue = {
      audioUrl: payload.file.url as string,
      durationSeconds,
      mimeType: payload.file.type as string,
      key: payload.file.key as string | undefined,
    }

    setUploadedValue(nextValue)
    setPhase('done')
    onChange?.(nextValue)
  }

  const handleRecorderStop = async () => {
    const blob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || pickMimeType() })
    chunksRef.current = []

    if (blob.size === 0) {
      setPhase('error')
      setErrorMessage('Không ghi được âm thanh hợp lệ.')
      return
    }

    const previewUrl = URL.createObjectURL(blob)
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = previewUrl

    setPhase('processing')

    try {
      await uploadRecording(blob, recordingSeconds || maxSeconds, mediaRecorderRef.current?.mimeType || blob.type)
      setErrorMessage(null)
    } catch (error) {
      setPhase('error')
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
      onChange?.({
        audioUrl: previewUrl,
        durationSeconds: recordingSeconds || maxSeconds,
        mimeType: mediaRecorderRef.current?.mimeType || blob.type,
      })
    } finally {
      streamRef.current?.getTracks().forEach(track => track.stop())
      streamRef.current = null
      stopVisualizer()
    }
  }

  const startRecording = async () => {
    if (readOnly) return
    setErrorMessage(null)
    setPermissionState('requesting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = pickMimeType()
      const recorder = new MediaRecorder(stream, { mimeType })

      streamRef.current = stream
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      syncCanvasSize()
      drawWaveform()

      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        void handleRecorderStop()
      }

      recorder.start()
      setPermissionState('ready')
      setPhase('recording')
      setRecordingSeconds(0)

      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => {
          const next = prev + 1
          if (next >= maxSeconds) {
            stopRecording()
            return maxSeconds
          }
          return next
        })
      }, 1000)
    } catch (error) {
      setPermissionState('denied')
      setPhase('error')
      setErrorMessage(error instanceof Error ? error.message : 'Không thể truy cập microphone')
    }
  }

  useEffect(() => {
    syncCanvasSize()
    const handleResize = () => syncCanvasSize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (phase !== 'recording' && timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [phase])

  const statusLabel =
    phase === 'recording'
      ? 'Đang ghi âm'
      : phase === 'uploading'
        ? 'Đang tải lên R2'
        : phase === 'processing'
          ? 'Đang xử lý'
          : phase === 'done'
            ? 'Đã lưu'
            : 'Sẵn sàng ghi âm'

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <Mic className="h-4 w-4 text-sky-500" />
            Speaking Recorder
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Cho phép micro, ghi âm câu trả lời và tải thẳng lên Cloudflare R2.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <span className={`h-2 w-2 rounded-full ${phase === 'recording' ? 'bg-emerald-500' : phase === 'error' ? 'bg-red-500' : 'bg-sky-500'}`} />
          {statusLabel}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-950 p-3 dark:border-zinc-800">
        <canvas ref={canvasRef} className="h-24 w-full rounded-lg bg-zinc-950" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
          <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Thời gian ghi</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{formatTime(recordingSeconds)}</div>
        </div>
        <div className={`rounded-xl p-3 ${isLowTime ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-zinc-50 dark:bg-zinc-900/60'}`}>
          <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Còn lại</div>
          <div className={`mt-1 text-2xl font-semibold ${isLowTime ? 'text-amber-700 dark:text-amber-300' : 'text-zinc-900 dark:text-zinc-100'}`}>{formatTime(remainingSeconds)}</div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {uploadedValue?.audioUrl && (
        <div className="space-y-2 rounded-xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-900/40 dark:bg-sky-950/20">
          <div className="flex items-center gap-2 text-sm font-medium text-sky-800 dark:text-sky-200">
            <Volume2 className="h-4 w-4" />
            Bản ghi hiện tại
          </div>
          <audio controls src={uploadedValue.audioUrl} className="w-full" />
          <div className="text-xs text-sky-700/80 dark:text-sky-200/80">Độ dài: {formatTime(uploadedValue.durationSeconds)}</div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {phase !== 'recording' ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={readOnly || phase === 'uploading' || phase === 'processing'}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Mic className="h-4 w-4" />
            {uploadedValue?.audioUrl ? 'Ghi lại' : 'Bắt đầu ghi'}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
          >
            <Square className="h-4 w-4" />
            Dừng ghi
          </button>
        )}

        <button
          type="button"
          onClick={resetRecording}
          disabled={readOnly || (phase !== 'done' && phase !== 'error' && phase !== 'idle')}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <RotateCcw className="h-4 w-4" />
          Ghi lại từ đầu
        </button>

        {permissionState === 'denied' && (
          <div className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            Cần cấp quyền micro để ghi âm.
          </div>
        )}
      </div>

      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        Microphone permission: {permissionState === 'denied' ? 'Bị từ chối' : permissionState === 'requesting' ? 'Đang xin quyền' : permissionState === 'ready' ? 'Đã sẵn sàng' : 'Chưa yêu cầu'}
      </div>
    </div>
  )
}