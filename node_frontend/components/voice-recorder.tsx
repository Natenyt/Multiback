"use client"

import * as React from "react"
import { Mic, Trash2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoiceRecorderProps {
  onSend: (blob: Blob) => void
  onCancel: () => void
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = React.useState(true) // Start recording immediately
  const [audioLevels, setAudioLevels] = React.useState<number[]>([])
  const [duration, setDuration] = React.useState(0)
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = React.useState<Blob[]>([])
  const [audioContext, setAudioContext] = React.useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = React.useState<AnalyserNode | null>(null)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = React.useRef<number | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)

  // Initialize audio context and start recording on mount
  React.useEffect(() => {
    startRecording()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      const chunks: Blob[] = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
          setAudioChunks([...chunks])
        }
      }
      
      recorder.onstop = () => {
        setAudioChunks([...chunks])
      }
      
      streamRef.current = stream
      
      recorder.start()
      setMediaRecorder(recorder)

      // Create AudioContext for waveform visualization
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyserNode = ctx.createAnalyser()
      analyserNode.fftSize = 256
      source.connect(analyserNode)
      
      setAudioContext(ctx)
      setAnalyser(analyserNode)

      // Start timer
      setDuration(0)
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)

      // Start waveform animation
      const dataArray = new Uint8Array(analyserNode.frequencyBinCount)
      const updateWaveform = () => {
        if (analyserNode) {
          analyserNode.getByteFrequencyData(dataArray)
          // Take every 4th value to get ~16 bars
          const levels = Array.from(dataArray).filter((_, i) => i % 4 === 0).slice(0, 16)
          setAudioLevels(levels)
          animationFrameRef.current = requestAnimationFrame(updateWaveform)
        }
      }
      updateWaveform()
    } catch (error) {
      console.error('Error starting recording:', error)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const handleCancel = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    setAudioChunks([])
    setDuration(0)
    setAudioLevels([])
    onCancel()
  }

  const handleSend = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      // Request final data chunk
      mediaRecorder.requestData()
      mediaRecorder.stop()
      
      // Wait for onstop to fire and create blob
      const checkAndSend = () => {
        if (audioChunks.length > 0) {
          const blob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' })
          onSend(blob)
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
          }
          setAudioChunks([])
          setDuration(0)
          setAudioLevels([])
        } else {
          // Retry after a short delay if chunks aren't ready yet
          setTimeout(checkAndSend, 50)
        }
      }
      setTimeout(checkAndSend, 100)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Generate default waveform bars if no audio levels
  const waveformBars = audioLevels.length > 0 
    ? audioLevels 
    : Array(16).fill(10) // Default small bars

  return (
    <div className="flex items-center gap-2 w-full bg-blue-500 rounded-lg px-4 py-3">
      {/* Trash button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-white hover:bg-blue-600"
        onClick={handleCancel}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Waveform */}
      <div className="flex-1 flex items-center justify-center gap-1 h-8">
        {waveformBars.map((level, index) => (
          <div
            key={index}
            className="bg-white rounded-sm transition-all duration-75"
            style={{
              width: '3px',
              height: `${Math.max(4, (level / 255) * 24)}px`,
              minHeight: '4px',
            }}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="text-white font-mono text-sm tabular-nums min-w-[45px] text-center">
        {formatTime(duration)}
      </div>

      {/* Send button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-white hover:bg-blue-600"
        onClick={handleSend}
        disabled={audioChunks.length === 0}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}

