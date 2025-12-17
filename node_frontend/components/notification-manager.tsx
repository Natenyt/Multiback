"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useNotifications } from "@/contexts/notification-context"
import { useToast } from "@/hooks/use-toast"
import { formatTimeAgo } from "@/lib/time-utils"
import { getAuthToken } from "@/dash_department/lib/api"
import { getStaffProfile } from "@/dash_department/lib/api"

// Get WS URL from API URL (replace /api with empty, and http with ws)
// WebSocket URL - needs to be public since WebSockets require direct connection
// Set NEXT_PUBLIC_WS_URL in Vercel (e.g., ws://185.247.118.219:8000)
const getWsBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
}

const SHOWN_TOAST_SESSIONS_KEY = 'shown_toast_sessions'

export const NotificationManager: React.FC = () => {
  const pathname = usePathname()
  const { notifications, addNotification } = useNotifications()
  const { toast } = useToast()
  const wsRef = React.useRef<WebSocket | null>(null)
  const departmentIdRef = React.useRef<number | null>(null)
  const shownToastSessionsRef = React.useRef<Set<string>>(new Set())

  // Load shown toast sessions from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(SHOWN_TOAST_SESSIONS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        shownToastSessionsRef.current = new Set(parsed)
      }
    } catch (error) {
      console.error("Failed to load shown toast sessions from localStorage:", error)
    }
  }, [])

  // Track which notifications we've already shown as toasts (one toast per session_uuid)
  React.useEffect(() => {
    // Find notifications that haven't shown a toast yet
    const newNotifications = notifications.filter(
      (n) => !shownToastSessionsRef.current.has(n.session_uuid)
    )

    // Show toast for each new notification (only once per session_uuid)
    newNotifications.forEach((notification) => {
      // Mark this session_uuid as having shown a toast
      shownToastSessionsRef.current.add(notification.session_uuid)
      
      // Save to localStorage
      try {
        localStorage.setItem(SHOWN_TOAST_SESSIONS_KEY, JSON.stringify(Array.from(shownToastSessionsRef.current)))
      } catch (error) {
        console.error("Failed to save shown toast sessions to localStorage:", error)
      }
      
      toast({
        title: "Yangi Murojaat",
        description: `Fuqoro: ${notification.citizen_name}\n${formatTimeAgo(notification.created_at)}`,
        playSound: true,
        duration: 5000,
      })
    })
  }, [notifications, toast])

  // WebSocket connection for real-time notifications
  React.useEffect(() => {
    let mounted = true

    async function setupWebSocket() {
      try {
        // Get department ID
        if (!departmentIdRef.current) {
          const profile = await getStaffProfile()
          departmentIdRef.current = profile.department_id
        }

        const token = getAuthToken()
        const departmentId = departmentIdRef.current

        if (!token || !departmentId || !mounted) {
          return
        }

        // Construct websocket URL with token in query string
        const wsBaseUrl = getWsBaseUrl()
        const wsUrl = `${wsBaseUrl}/ws/department/${departmentId}/?token=${encodeURIComponent(token)}`
        
        console.log("NotificationManager: Connecting to department WebSocket:", wsUrl.replace(token, "***"))
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          console.log("NotificationManager: Department WebSocket connected for department:", departmentId)
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log("NotificationManager: WebSocket message received:", data)

            // Handle session.created events (new unassigned sessions)
            if (data.type === "session.created" && data.session) {
              const newSession = data.session
              // Only add if the session is unassigned
              if (newSession.status === 'unassigned') {
                // Only add notification if staff is NOT currently on the unassigned page
                const isOnUnassignedPage = pathname === '/dashboard/unassigned'
                if (!isOnUnassignedPage && mounted) {
                  addNotification({
                    session_uuid: newSession.session_uuid,
                    citizen_name: newSession.citizen?.full_name || newSession.citizen?.phone_number || 'Unknown',
                    created_at: newSession.created_at,
                  })
                }
              }
            }
          } catch (error) {
            console.error("NotificationManager: Error parsing websocket message:", error)
          }
        }

        ws.onerror = (error) => {
          console.error("NotificationManager: WebSocket error:", error)
        }

        ws.onclose = (event) => {
          console.log("NotificationManager: WebSocket closed:", event.code, event.reason)
          // Attempt to reconnect after a delay if not intentionally closed
          if (event.code !== 1000 && mounted) {
            setTimeout(() => {
              if (mounted && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
                setupWebSocket()
              }
            }, 3000)
          }
        }
      } catch (error) {
        console.error("NotificationManager: Failed to setup WebSocket:", error)
      }
    }

    setupWebSocket()

    return () => {
      mounted = false
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close(1000, "Component unmounting")
        }
        wsRef.current = null
      }
    }
  }, [pathname, addNotification])

  return null
}
