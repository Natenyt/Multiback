"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { useNotifications } from "@/contexts/notification-context"
import { formatTimeAgo } from "@/lib/time-utils"

export function HeaderActions() {
  const router = useRouter()
  const { notifications, getUnreadCount, markAllAsRead } = useNotifications()
  const unreadCount = getUnreadCount()

  // Mark all notifications as read when dropdown opens
  const handleDropdownOpenChange = (open: boolean) => {
    if (open) {
      markAllAsRead()
    }
  }

  // Handle notification click - navigate to session detail
  const handleNotificationClick = (sessionUuid: string) => {
    router.push(`/dashboard/unassigned/${sessionUuid}`)
  }

  // Get unread notifications (show all notifications, but mark unread ones)
  const unreadNotifications = notifications.filter((n) => !n.read)
  const allNotifications = notifications.slice(0, 20) // Show latest 20

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
            <DropdownMenuLabel>Xabarnomalar</DropdownMenuLabel>
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
                  onClick={() => handleNotificationClick(notification.session_uuid)}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="text-sm font-medium">Yangi Murojaat</span>
                      <span className="text-xs text-muted-foreground">
                        Fuqoro: {notification.citizen_name}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(notification.created_at)}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

      {/* Theme Toggle */}
      <ThemeToggle />
    </div>
  )
}

