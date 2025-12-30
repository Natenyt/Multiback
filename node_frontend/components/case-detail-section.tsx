"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { type SessionData, escalateTicket, closeTicket, holdTicket, updateTicketDescription } from "@/dash_department/lib/api"
import { useToast } from "@/hooks/use-toast"
import { X, Paperclip, AlignLeft, AlignCenter, AlignRight, ArrowRight, ChevronDown, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CaseDetailSectionProps {
  session: SessionData
  sessionUuid: string
  onSessionUpdate?: (updatedSession: SessionData) => void
}

export function CaseDetailSection({ session, sessionUuid, onSessionUpdate }: CaseDetailSectionProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [description, setDescription] = React.useState(session.description || "")
  const [currentSession, setCurrentSession] = React.useState<SessionData>(session)
  const [isEscalating, setIsEscalating] = React.useState(false)

  // Update local session when prop changes
  React.useEffect(() => {
    setCurrentSession(session)
  }, [session])

  // Expose update function to parent via ref or callback
  React.useEffect(() => {
    if (onSessionUpdate) {
      // Store the callback to be called when session updates
      const updateSession = (updatedSession: SessionData) => {
        setCurrentSession(updatedSession)
      }
      // This is a workaround - we'll call setCurrentSession directly from parent
    }
  }, [onSessionUpdate])

  // Debug: Log session data to verify assigned_staff
  React.useEffect(() => {
    console.log("Session assigned_staff:", session.assigned_staff)
  }, [session])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const handleEscalate = async () => {
    setIsEscalating(true)
    try {
      await escalateTicket(sessionUuid)
      // Invalidate dashboard stats cache (but no sound for escalate)
      const { invalidateDashboardStats } = await import("@/hooks/use-dashboard-data")
      invalidateDashboardStats()
      // Wait 4 seconds to show the message
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      // Determine redirect path based on current pathname
      const redirectPath = pathname?.includes('/unassigned/') 
        ? '/dashboard/unassigned'
        : '/dashboard/assigned'
      
      router.push(redirectPath)
    } catch (error) {
      setIsEscalating(false)
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Murojaatni ko'tarib bo'lmadi",
        variant: "destructive",
      })
    }
  }

  const handleClose = async () => {
    try {
      await closeTicket(sessionUuid)
      // Invalidate dashboard stats cache
      const { invalidateDashboardStats } = await import("@/hooks/use-dashboard-data")
      invalidateDashboardStats()
      toast({
        title: "Success",
        description: "Murojaat tugallandi",
        playSound: true,
      })
      router.back()
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Murojaatni yopib bo'lmadi",
        variant: "destructive",
      })
    }
  }

  const handleHold = async () => {
    try {
      await holdTicket(sessionUuid)
      // Invalidate dashboard stats cache
      const { invalidateDashboardStats } = await import("@/hooks/use-dashboard-data")
      invalidateDashboardStats()
      toast({
        title: "Success",
        description: "Murojaat hold qilindi",
        playSound: true,
      })
      // Optionally refresh the page or update state
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Murojaatni uzaytirib bo'lmadi",
        variant: "destructive",
      })
    }
  }

  const handleSaveDescription = async () => {
    try {
      await updateTicketDescription(sessionUuid, description)
      toast({
        title: "Success",
        description: "Description saved",
      })
    } catch (error) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Tavsifni saqlab bo'lmadi",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {/* Escalation Overlay */}
      {isEscalating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            <p className="text-lg font-medium text-foreground text-center max-w-md" style={{ fontFamily: 'Segoe UI Symbol, sans-serif' }}>
              Bu murojaat eskalatsiya qilinmoqda va Superuser xabardor qilinadi. Rahmat!
            </p>
          </div>
        </div>
      )}
      <div 
        className="w-[55%] h-full bg-card dark:bg-card/80 overflow-hidden flex flex-col border-r border-border" 
        style={{ fontFamily: 'Segoe UI Symbol, sans-serif' }}
      >
      <div className="pt-6 pr-6 pb-6 pl-[29px] space-y-4 overflow-y-auto flex-1">
        {/* Header */}
        <div>
          <h1 className="text-[36px] font-semibold text-foreground">Murojaat</h1>
          <p 
            className="text-[15px] font-medium text-muted-foreground mt-1 cursor-pointer hover:text-foreground transition-colors ml-[3px]"
            style={{ fontFamily: 'System, sans-serif' }}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(sessionUuid)
                toast({
                  title: "Copied",
                  description: "Session ID copied to clipboard",
                })
              } catch (error) {
                console.error("Failed to copy:", error)
              }
            }}
          >
            sID {sessionUuid.slice(0, 8)}
          </p>
        </div>

        {/* Info Fields */}
        <div className="space-y-2 ml-[3px] mt-6">
          <div className="flex">
            <span className="text-muted-foreground w-32 text-[15px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>Murojaat turi:</span>
            <span className="text-foreground text-[15px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>{session.intent_label || "N/A"}</span>
          </div>
          <div className="flex">
            <span className="text-muted-foreground w-32 text-[15px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>Sana:</span>
            <span className="text-foreground text-[15px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>{formatDate(session.created_at)}</span>
          </div>
          <div className="flex">
            <span className="text-muted-foreground w-32 text-[15px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>Javobgar:</span>
            <span className="text-foreground text-[15px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>
              {currentSession.assigned_staff ? currentSession.assigned_staff.full_name : "N/A"}
            </span>
          </div>
          <div className="flex">
            <span className="text-muted-foreground w-32 text-[15px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>Tashkilot:</span>
            <span className="text-foreground text-[15px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>
              {session.department_name || "N/A"}
            </span>
          </div>
        </div>

        {/* Description Section */}
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-foreground">Tavsif</label>
          <div className="border rounded-md bg-background dark:bg-muted/30 shadow-sm min-h-[80px]">
            {/* Toolbar above input */}
            <div className="flex items-center px-2 py-1.5 gap-0">
              <button className="p-1 hover:bg-muted rounded flex items-center justify-center" title="Text formatting">
                <span className="text-xs font-medium">Ao</span>
              </button>
              <div className="h-4 w-px bg-border mx-0.5"></div>
              <button className="p-1 hover:bg-muted rounded flex items-center justify-center" title="Bold">
                <span className="text-xs font-medium">B</span>
              </button>
              <div className="h-4 w-px bg-border mx-0.5"></div>
              <button className="p-1 hover:bg-muted rounded flex items-center justify-center" title="Attach">
                <Paperclip className="h-3 w-3" />
              </button>
              <div className="h-4 w-px bg-border mx-0.5"></div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-muted rounded flex items-center justify-center gap-0.5" title="Align">
                    <div className="flex flex-col gap-0.5">
                      <div className="h-[1px] w-3 bg-current"></div>
                      <div className="h-[1px] w-3 bg-current"></div>
                      <div className="h-[1px] w-3 bg-current"></div>
                    </div>
                    <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>
                    <AlignLeft className="h-4 w-4" strokeWidth={1.5} />
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <AlignCenter className="h-4 w-4" strokeWidth={1.5} />
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <AlignRight className="h-4 w-4" strokeWidth={1.5} />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Input field and send button */}
            <div className="flex items-center px-2 pb-1.5">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyPress={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    await handleSaveDescription()
                  }
                }}
                placeholder="Murojaat tavsifini yoki muhim eslatmalarni qo'shing"
                className="flex-1 border-0 focus:outline-none focus:ring-0 bg-transparent placeholder:text-muted-foreground ml-[3px] text-[11px]"
                style={{ fontFamily: 'System, sans-serif' }}
              />
              <button
                type="button"
                  className="h-6 w-6 rounded-full bg-black dark:bg-white dark:text-black text-white flex items-center justify-center hover:bg-black/80 dark:hover:bg-white/90 hover:scale-105 active:scale-95 transition-all duration-200 ml-2 shrink-0"
                title="Send"
                  onClick={handleSaveDescription}
              >
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Request Details Section */}
        <div className="space-y-2">
          <h2 className="text-[20px] font-semibold text-foreground" style={{ fontFamily: 'Segoe UI Symbol, sans-serif' }}>Murojaat ma'lumotlari</h2>
          <div className="space-y-1.5 ml-[8px]">
            <div className="flex">
              <span className="text-muted-foreground w-40 text-[14px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>Ism Familiya:</span>
              <span className="text-foreground text-[15px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>{session.citizen?.full_name || "N/A"}</span>
            </div>
            <div className="flex">
              <span className="text-muted-foreground w-40 text-[14px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>Telefon Raqam:</span>
              <span className="text-foreground text-[15px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>
                {session.phone_number || session.citizen?.phone_number || "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="text-muted-foreground w-40 text-[14px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>Mahalla:</span>
              <span className="text-foreground text-[15px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>
                {session.neighborhood?.name || session.citizen?.neighborhood?.name || "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="text-muted-foreground w-40 text-[14px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>Manzil:</span>
              <span className="text-foreground text-[15px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>
                {session.location || session.citizen?.location || "N/A"}
              </span>
            </div>
            <div className="flex">
              <span className="text-muted-foreground w-40 text-[14px] font-medium" style={{ fontFamily: 'System, sans-serif' }}>Platforma:</span>
              <span className="text-foreground text-[15px] font-medium capitalize" style={{ fontFamily: 'System, sans-serif' }}>{session.origin || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Action Section - Hide for closed sessions and escalated sessions */}
        {currentSession.status !== "closed" && currentSession.status !== "escalated" && !pathname?.startsWith('/train/') && (
        <div className="space-y-2">
            <h2 className="text-[20px] font-semibold text-foreground">Harakat</h2>
          <div className="flex flex-col gap-2 items-start">
              <Tooltip>
                <TooltipTrigger asChild>
            <Button
              onClick={handleEscalate}
                    className="bg-black dark:bg-white dark:text-black text-white hover:bg-black/80 dark:hover:bg-white/90 hover:scale-105 active:scale-95 transition-all duration-200 text-[13px] font-medium h-8 px-3 w-[120px]"
            >
              Escalate
            </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Agar murojaat sizning tashkilotingizga tegishli bo'lmasa, bosing</p>
                </TooltipContent>
              </Tooltip>
              {currentSession.assigned_staff && (
                <>
            <Button
              onClick={handleClose}
                    className="bg-black dark:bg-white dark:text-black text-white hover:bg-black/80 dark:hover:bg-white/90 hover:scale-105 active:scale-95 transition-all duration-200 text-[13px] font-medium h-8 px-3 w-[120px]"
            >
              Tugallash
            </Button>
            <Button
              onClick={handleHold}
                    className="bg-black dark:bg-white dark:text-black text-white hover:bg-black/80 dark:hover:bg-white/90 hover:scale-105 active:scale-95 transition-all duration-200 text-[13px] font-medium h-8 px-3 w-[120px]"
            >
              Uzaytirish
            </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

