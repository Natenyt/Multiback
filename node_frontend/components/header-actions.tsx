"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { Bell, Volume2, VolumeX } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useNotifications } from "@/contexts/notification-context"
import { formatTimeAgo } from "@/lib/time-utils"
import { setSoundPreference } from "@/hooks/use-toast"

export function HeaderActions() {
  const router = useRouter()
  const pathname = usePathname()
  const { 
    notifications, 
    escalatedNotifications,
    getUnreadCount, 
    markAllAsRead 
  } = useNotifications()
  const unreadCount = getUnreadCount()
  
  // Sound preference state
  const [soundEnabled, setSoundEnabled] = React.useState(true)
  
  // Load sound preference on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('notification-sound-enabled')
      setSoundEnabled(stored === null ? true : stored === 'true')
    }
  }, [])
  
  // Toggle sound preference
  const toggleSound = React.useCallback(() => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    setSoundPreference(newValue)
  }, [soundEnabled])

  // Mark all notifications as read when dropdown opens
  const handleDropdownOpenChange = (open: boolean) => {
    if (open) {
      markAllAsRead()
    }
  }

  // Handle notification click - navigate to session detail
  const handleNotificationClick = (sessionUuid: string, isEscalated: boolean = false) => {
    if (isEscalated) {
      router.push(`/train/${sessionUuid}`)
    } else {
      router.push(`/dashboard/unassigned/${sessionUuid}`)
    }
  }

  // Combine regular notifications and escalated notifications
  const allNotifications = React.useMemo(() => {
    const regular = notifications.map(n => ({
      ...n,
      isEscalated: false
    }))
    
    const escalated = escalatedNotifications.map(n => ({
      ...n,
      isEscalated: true
    }))
    
    // Sort by created_at (newest first) and take latest 20
    return [...regular, ...escalated]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)
  }, [notifications, escalatedNotifications])

  const unreadInDropdown = allNotifications.filter(n => !n.read).length

  return (
    <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-1.5 py-1 border border-border/30">
      {/* Notification Bell */}
        <DropdownMenu onOpenChange={handleDropdownOpenChange}>
          <DropdownMenuTrigger asChild>
            <button suppressHydrationWarning className="relative flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-medium text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0">Xabarnomalar</DropdownMenuLabel>
              {unreadInDropdown > 0 && (
                <span className="text-xs text-muted-foreground">
                  {unreadInDropdown} o'qilmagan
                </span>
              )}
            </div>
            <DropdownMenuSeparator />
            {allNotifications.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                Xabarnomalar yo'q
              </div>
            ) : (
              allNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  onClick={() => handleNotificationClick(notification.session_uuid, notification.isEscalated)}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="text-sm font-medium">
                        {notification.isEscalated ? 'Escalated Murojaat' : 'Yangi Murojaat'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Fuqoro: {notification.citizen_name}
                      </span>
                    </div>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-primary ml-2 mt-1" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(notification.created_at)}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

      {/* Sound Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={toggleSound}
        title={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
      >
        {soundEnabled ? (
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        ) : (
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {/* Theme Toggle */}
      <ThemeToggle />
    </div>
  )
}

