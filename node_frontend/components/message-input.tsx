"use client"

import * as React from "react"
import { Paperclip, Mic, Image, Video, Camera, File, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { VoiceRecorder } from "./voice-recorder"

interface MessageInputProps {
  onSend: (text: string, files?: File[]) => void
  onVoiceSend: (blob: Blob) => void
  disabled?: boolean
}

export function MessageInput({ onSend, onVoiceSend, disabled }: MessageInputProps) {
  const [text, setText] = React.useState("")
  const [isVoiceMode, setIsVoiceMode] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const cameraInputRef = React.useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim())
      setText("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      onSend("", fileArray)
    }
  }

  const handleAttachmentClick = (type: "photo" | "video" | "camera" | "file" | "location") => {
    switch (type) {
      case "photo":
        fileInputRef.current?.setAttribute("accept", "image/*")
        fileInputRef.current?.click()
        break
      case "video":
        fileInputRef.current?.setAttribute("accept", "video/*")
        fileInputRef.current?.click()
        break
      case "camera":
        cameraInputRef.current?.setAttribute("accept", "image/*")
        cameraInputRef.current?.setAttribute("capture", "environment")
        cameraInputRef.current?.click()
        break
      case "file":
        fileInputRef.current?.removeAttribute("accept")
        fileInputRef.current?.click()
        break
      case "location":
        // TODO: Implement location sharing
        console.log("Location sharing not yet implemented")
        break
    }
  }

  const handleVoiceSend = (blob: Blob) => {
    onVoiceSend(blob)
    setIsVoiceMode(false)
  }

  const handleVoiceCancel = () => {
    setIsVoiceMode(false)
  }

  if (isVoiceMode) {
    return (
      <VoiceRecorder onSend={handleVoiceSend} onCancel={handleVoiceCancel} />
    )
  }

  return (
    <div className="flex items-center gap-2 p-2 border-t" style={{ paddingLeft: '18px', paddingRight: '18px', backgroundColor: '#F8F9FA', borderColor: '#D1D5DB' }}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Attachment dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            disabled={disabled}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => handleAttachmentClick("photo")}>
            <Image className="mr-2 h-4 w-4" />
            Photo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAttachmentClick("video")}>
            <Video className="mr-2 h-4 w-4" />
            Video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAttachmentClick("camera")}>
            <Camera className="mr-2 h-4 w-4" />
            Camera
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAttachmentClick("file")}>
            <File className="mr-2 h-4 w-4" />
            File
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAttachmentClick("location")}>
            <MapPin className="mr-2 h-4 w-4" />
            Location
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Text input */}
      <Input
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        className="flex-1"
      />

      {/* Voice button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setIsVoiceMode(true)}
        disabled={disabled}
      >
        <Mic className="h-5 w-5" />
      </Button>

      {/* Send button */}
      <Button
        type="button"
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        size="sm"
      >
        Send
      </Button>
    </div>
  )
}

