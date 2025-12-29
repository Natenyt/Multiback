"use client"

import * as React from "react"
import { sendMessage, type Message } from "@/dash_department/lib/api"
import { ArrowRight, Image as ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface CaseMessageInputProps {
  sessionUuid: string
  onMessageSent: (message: Message) => void
}

export function CaseMessageInput({ sessionUuid, onMessageSent }: CaseMessageInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [selectedImages, setSelectedImages] = React.useState<File[]>([])
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select image files only",
        variant: "destructive",
      })
      return
    }

    // Limit to 5 images max
    const newImages = [...selectedImages, ...imageFiles].slice(0, 5)
    setSelectedImages(newImages)

    // Create previews
    const newPreviews = newImages.map(file => URL.createObjectURL(file))
    setImagePreviews(newPreviews)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    
    // Revoke old URL to free memory
    URL.revokeObjectURL(imagePreviews[index])
    
    setSelectedImages(newImages)
    setImagePreviews(newPreviews)
  }

  const handleSend = async () => {
    if ((!inputValue.trim() && selectedImages.length === 0) || isSending) return

    setIsSending(true)
    try {
      const response = await sendMessage(sessionUuid, {
        text: inputValue.trim() || undefined,
        files: selectedImages.length > 0 ? selectedImages : undefined,
      })
      onMessageSent(response.message)
      setInputValue("")
      
      // Clear images and revoke URLs
      imagePreviews.forEach(url => URL.revokeObjectURL(url))
      setSelectedImages([])
      setImagePreviews([])
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Cleanup preview URLs on unmount
  React.useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url))
    }
  }, [imagePreviews])

  return (
    <div className="p-4">
      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-end rounded-lg border-2 border-border dark:border-border bg-background dark:bg-background shadow-md hover:shadow-lg focus-within:border-primary dark:focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 dark:focus-within:ring-primary/40 focus-within:shadow-lg transition-all duration-200">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          multiple
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          type="button"
          size="icon"
          variant="ghost"
          className="absolute left-2 bottom-2 h-8 w-8 rounded-md hover:bg-accent"
          disabled={isSending || selectedImages.length >= 5}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Xabaringizni kiriting"
          className="flex-1 min-h-[40px] max-h-[120px] py-3 pl-12 pr-14 border-0 bg-transparent resize-none focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={(!inputValue.trim() && selectedImages.length === 0) || isSending}
          size="icon"
          className="absolute right-2 bottom-2 h-8 w-8 rounded-md bg-blue-500 dark:bg-white dark:text-black hover:bg-blue-600 dark:hover:bg-white/90 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <ArrowRight className="h-4 w-4 text-white dark:text-black" />
        </Button>
      </div>
    </div>
  )
}

