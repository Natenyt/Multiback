"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useNotifications } from "@/contexts/notification-context"
import { useToast } from "@/hooks/use-toast"
import { formatTimeAgo } from "@/lib/time-utils"
import { getAuthToken, getValidAuthToken } from "@/dash_department/lib/api"
import { getStaffProfile } from "@/dash_department/lib/api"
import { logInfo, logError, logWarn } from "@/lib/logger"

import { getWsBaseUrl } from "@/lib/websocket-utils"

const SHOWN_TOAST_SESSIONS_KEY = 'shown_toast_sessions'

export const NotificationManager: React.FC = () => {
  const { notifications, addNotification, addEscalatedSession, addEscalatedNotification } = useNotifications()
  const { toast } = useToast()
  const pathname = usePathname()
  const wsRef = React.useRef<WebSocket | null>(null)
  const vipWsRef = React.useRef<WebSocket | null>(null)
  const departmentIdRef = React.useRef<number | null>(null)
  const staffRoleRef = React.useRef<string | null>(null)
  const shownToastSessionsRef = React.useRef<Set<string>>(new Set())
  const shownEscalatedToastSessionsRef = React.useRef<Set<string>>(new Set())
  // Store timeout IDs for proper cleanup
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const vipReconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Load shown toast sessions from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(SHOWN_TOAST_SESSIONS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        shownToastSessionsRef.current = new Set(parsed)
      }
      } catch (error) {
        // Silently fail - localStorage access errors are non-critical
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
          // Silently fail - localStorage access errors are non-critical
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
        // Get department ID and role
        if (!departmentIdRef.current || !staffRoleRef.current) {
          const profile = await getStaffProfile()
          departmentIdRef.current = profile.department_id
          staffRoleRef.current = profile.role
        }

        // Get valid token (will refresh if needed)
        const token = await getValidAuthToken()
        const departmentId = departmentIdRef.current
        const staffRole = staffRoleRef.current

        if (!token || !departmentId || !mounted) {
          return
        }

        // Construct websocket URL with token in query string
        const wsBaseUrl = getWsBaseUrl()
        const wsUrl = `${wsBaseUrl}/ws/department/${departmentId}/?token=${encodeURIComponent(token)}`
        
        logInfo('WEBSOCKET', 'Connecting to department WebSocket', { 
          departmentId,
          url: wsUrl.replace(token, "***")
        }, { component: 'NotificationManager' });
        
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          logInfo('WEBSOCKET', 'Department WebSocket connected', { departmentId }, { component: 'NotificationManager' });
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            // Only log important WebSocket messages (not every message to avoid log bloat)
            if (data.type === "session.created" || data.type === "session.escalated") {
              logInfo('WEBSOCKET', 'Important WebSocket message received', { 
                type: data.type,
                session_uuid: data.session?.session_uuid 
              }, { component: 'NotificationManager' });
            }

            // Handle session.created events (new unassigned sessions)
            if (data.type === "session.created" && data.session) {
              const newSession = data.session
              // Only add if the session is unassigned
              if (newSession.status === "unassigned" && mounted) {
                addNotification({
                  session_uuid: newSession.session_uuid,
                  citizen_name:
                    newSession.citizen?.full_name ||
                    newSession.citizen?.phone_number ||
                    "Unknown",
                  created_at: newSession.created_at,
                })
              }
            }
          } catch (error) {
            logError('WEBSOCKET', 'Error parsing websocket message', error, { component: 'NotificationManager' });
          }
        }

        ws.onerror = (error) => {
          logError('WEBSOCKET', 'Department WebSocket error', error, { 
            departmentId,
            component: 'NotificationManager' 
          });
        }

        ws.onclose = (event) => {
          logWarn('WEBSOCKET', 'Department WebSocket closed', { 
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            departmentId 
          }, { component: 'NotificationManager' });
          // Attempt to reconnect after a delay if not intentionally closed
          if (event.code !== 1000 && mounted) {
            // Clear any existing reconnect timeout
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current)
            }
            // Store timeout ID for cleanup
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null // Clear ref after timeout fires
              if (mounted && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
                setupWebSocket()
              }
            }, 3000)
          }
        }

        // Setup VIP websocket for escalated sessions (if user is VIP)
        if (staffRole === 'VIP') {
          const setupVIPWebSocket = (authToken: string) => {
            const vipWsUrl = `${wsBaseUrl}/ws/vip/?token=${encodeURIComponent(authToken)}`
            logInfo('WEBSOCKET', 'Connecting to VIP WebSocket', { 
              url: vipWsUrl.replace(authToken, "***")
            }, { component: 'NotificationManager' });
            
            const vipWs = new WebSocket(vipWsUrl)
            vipWsRef.current = vipWs

            vipWs.onopen = () => {
              logInfo('WEBSOCKET', 'VIP WebSocket connected', {}, { component: 'NotificationManager' });
            }

            vipWs.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data)
                // Only log important VIP WebSocket messages
                if (data.type === "session.escalated" || data.type === "session.rerouted") {
                  logInfo('WEBSOCKET', 'Important VIP WebSocket message received', { 
                    type: data.type,
                    session_uuid: data.session?.session_uuid 
                  }, { component: 'NotificationManager' });
                }

                // Handle session.escalated events
                if (data.type === "session.escalated" && data.session && mounted) {
                  const escalatedSession = data.session
                  const sessionUuid = escalatedSession.session_uuid
                  
                  // Only show notification if we haven't shown it yet
                  if (!shownEscalatedToastSessionsRef.current.has(sessionUuid)) {
                    shownEscalatedToastSessionsRef.current.add(sessionUuid)
                    
                    // Add to escalated sessions set
                    addEscalatedSession(sessionUuid)
                    
                    // Add escalated notification
                    addEscalatedNotification({
                      session_uuid: sessionUuid,
                      citizen_name: escalatedSession.citizen?.full_name || escalatedSession.citizen?.phone_number || "Unknown",
                      created_at: escalatedSession.created_at || new Date().toISOString(),
                    })
                    
                    // Determine if we're in Training workspace
                    const isInTrainingWorkspace = pathname === '/train' || pathname?.startsWith('/train/')
                    
                    // Show toast notification
                    const workspaceText = isInTrainingWorkspace ? "" : " (Training)"
                    toast({
                      title: `Escalated Murojaat${workspaceText}`,
                      description: `Fuqoro: ${escalatedSession.citizen?.full_name || escalatedSession.citizen?.phone_number || "Unknown"}\n${formatTimeAgo(escalatedSession.created_at || new Date().toISOString())}`,
                      playSound: true,
                      duration: 5000,
                    })
                  }
                }

                // Handle session.rerouted events
                if (data.type === "session.rerouted" && data.session && mounted) {
                  const reroutedSession = data.session
                  const sessionUuid = reroutedSession.session_uuid
                  const departmentName = data.department_name || "Unknown Department"
                  
                  // Determine current workspace
                  const isInDashboardWorkspace = pathname === '/dashboard/dashboard' || pathname?.startsWith('/dashboard/')
                  
                  // Only show notification if not in dashboard workspace
                  if (!isInDashboardWorkspace) {
                    // Add notification to dashboard
                    addNotification({
                      session_uuid: sessionUuid,
                      citizen_name: reroutedSession.citizen?.full_name || reroutedSession.citizen?.phone_number || "Unknown",
                      created_at: reroutedSession.created_at || new Date().toISOString(),
                    })
                    
                    // Show toast notification with workspace info
                    toast({
                      title: "Murojaat qayta yo'naltirildi (Dashboard)",
                      description: `Fuqoro: ${reroutedSession.citizen?.full_name || reroutedSession.citizen?.phone_number || "Unknown"}\nBo'lim: ${departmentName}\n${formatTimeAgo(reroutedSession.created_at || new Date().toISOString())}`,
                      playSound: true,
                      duration: 5000,
                    })
                  }
                }
              } catch (error) {
                logError('WEBSOCKET', 'Error parsing VIP websocket message', error, { component: 'NotificationManager' });
              }
            }

            vipWs.onerror = (error) => {
              logError('WEBSOCKET', 'VIP WebSocket error', error, { component: 'NotificationManager' });
            }

            vipWs.onclose = (event) => {
              logWarn('WEBSOCKET', 'VIP WebSocket closed', { 
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean 
              }, { component: 'NotificationManager' });
              // Attempt to reconnect after a delay if not intentionally closed
              if (event.code !== 1000 && mounted) {
                // Clear any existing reconnect timeout
                if (vipReconnectTimeoutRef.current) {
                  clearTimeout(vipReconnectTimeoutRef.current)
                }
                // Store timeout ID for cleanup
                vipReconnectTimeoutRef.current = setTimeout(async () => {
                  vipReconnectTimeoutRef.current = null // Clear ref after timeout fires
                  if (mounted && (!vipWsRef.current || vipWsRef.current.readyState === WebSocket.CLOSED)) {
                    // Reconnect VIP websocket
                    try {
                      const newToken = await getValidAuthToken()
                      if (newToken && mounted) {
                        setupVIPWebSocket(newToken)
                      }
                    } catch (error) {
                      logError('WEBSOCKET', 'Failed to reconnect VIP WebSocket', error, { component: 'NotificationManager' });
                    }
                  }
                }, 3000)
              }
            }
          }

          setupVIPWebSocket(token)
        }
      } catch (error) {
        logError('WEBSOCKET', 'Failed to setup WebSocket', error, { component: 'NotificationManager' });
      }
    }

    setupWebSocket()

    return () => {
      mounted = false
      // Clear any pending reconnection timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (vipReconnectTimeoutRef.current) {
        clearTimeout(vipReconnectTimeoutRef.current)
        vipReconnectTimeoutRef.current = null
      }
      // Close WebSocket connections
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close(1000, "Component unmounting")
        }
        wsRef.current = null
      }
      if (vipWsRef.current) {
        if (vipWsRef.current.readyState === WebSocket.OPEN || vipWsRef.current.readyState === WebSocket.CONNECTING) {
          vipWsRef.current.close(1000, "Component unmounting")
        }
        vipWsRef.current = null
      }
    }
  }, [addNotification, addEscalatedSession, addEscalatedNotification, pathname])

  return null
}
