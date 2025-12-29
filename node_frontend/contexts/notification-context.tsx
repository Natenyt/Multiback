"use client"

import * as React from "react"

export interface Notification {
  id: string
  session_uuid: string
  citizen_name: string
  created_at: string // ISO timestamp
  read: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  assignedSessions: Set<string> // Track newly assigned session UUIDs
  closedSessions: Set<string> // Track newly closed session UUIDs
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  getUnreadCount: () => number
  clearNotifications: () => void
  addAssignedSession: (sessionUuid: string) => void
  removeAssignedSession: (sessionUuid: string) => void
  hasAssignedSessions: () => boolean
  clearAssignedSessions: () => void
  addClosedSession: (sessionUuid: string) => void
  removeClosedSession: (sessionUuid: string) => void
  hasClosedSessions: () => boolean
  clearClosedSessions: () => void
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined)

const NOTIFICATIONS_STORAGE_KEY = 'unassigned_session_notifications'

const ASSIGNED_SESSIONS_STORAGE_KEY = 'assigned_sessions'
const CLOSED_SESSIONS_STORAGE_KEY = 'closed_sessions'

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [assignedSessions, setAssignedSessions] = React.useState<Set<string>>(new Set())
  const [closedSessions, setClosedSessions] = React.useState<Set<string>>(new Set())

  // Load notifications from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Notification[]
        setNotifications(parsed)
      }
    } catch (error) {
      console.error("Failed to load notifications from localStorage:", error)
    }

    // Load assigned sessions from localStorage
    try {
      const storedAssigned = localStorage.getItem(ASSIGNED_SESSIONS_STORAGE_KEY)
      if (storedAssigned) {
        const parsed = JSON.parse(storedAssigned) as string[]
        setAssignedSessions(new Set(parsed))
      }
    } catch (error) {
      console.error("Failed to load assigned sessions from localStorage:", error)
    }

    // Load closed sessions from localStorage
    try {
      const storedClosed = localStorage.getItem(CLOSED_SESSIONS_STORAGE_KEY)
      if (storedClosed) {
        const parsed = JSON.parse(storedClosed) as string[]
        setClosedSessions(new Set(parsed))
      }
    } catch (error) {
      console.error("Failed to load closed sessions from localStorage:", error)
    }
  }, [])

  // Save notifications to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
    } catch (error) {
      console.error("Failed to save notifications to localStorage:", error)
    }
  }, [notifications])

  // Save assigned sessions to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem(ASSIGNED_SESSIONS_STORAGE_KEY, JSON.stringify(Array.from(assignedSessions)))
    } catch (error) {
      console.error("Failed to save assigned sessions to localStorage:", error)
    }
  }, [assignedSessions])

  // Save closed sessions to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem(CLOSED_SESSIONS_STORAGE_KEY, JSON.stringify(Array.from(closedSessions)))
    } catch (error) {
      console.error("Failed to save closed sessions to localStorage:", error)
    }
  }, [closedSessions])

  const addNotification = React.useCallback(
    (notification: Omit<Notification, 'id' | 'read'>) => {
      const id = `${notification.session_uuid}-${Date.now()}`
      const newNotification: Notification = {
        ...notification,
        id,
        read: false,
      }
      setNotifications((prev) => {
        // Check if notification for this session already exists (avoid duplicates)
        const exists = prev.some((n) => n.session_uuid === notification.session_uuid && !n.read)
        if (exists) {
          return prev
        }
        // Prepend new notification (newest first)
        return [newNotification, ...prev]
      })
    },
    []
  )

  const markAsRead = React.useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = React.useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const getUnreadCount = React.useCallback(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  const clearNotifications = React.useCallback(() => {
    setNotifications([])
    try {
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY)
    } catch (error) {
      console.error("Failed to clear notifications from localStorage:", error)
    }
  }, [])

  const addAssignedSession = React.useCallback((sessionUuid: string) => {
    setAssignedSessions((prev) => new Set([...prev, sessionUuid]))
  }, [])

  const removeAssignedSession = React.useCallback((sessionUuid: string) => {
    setAssignedSessions((prev) => {
      const newSet = new Set(prev)
      newSet.delete(sessionUuid)
      return newSet
    })
  }, [])

  const hasAssignedSessions = React.useCallback(() => {
    return assignedSessions.size > 0
  }, [assignedSessions])

  const clearAssignedSessions = React.useCallback(() => {
    setAssignedSessions(new Set())
    try {
      localStorage.removeItem(ASSIGNED_SESSIONS_STORAGE_KEY)
    } catch (error) {
      console.error("Failed to clear assigned sessions from localStorage:", error)
    }
  }, [])

  const addClosedSession = React.useCallback((sessionUuid: string) => {
    setClosedSessions((prev) => new Set([...prev, sessionUuid]))
  }, [])

  const removeClosedSession = React.useCallback((sessionUuid: string) => {
    setClosedSessions((prev) => {
      const newSet = new Set(prev)
      newSet.delete(sessionUuid)
      return newSet
    })
  }, [])

  const hasClosedSessions = React.useCallback(() => {
    return closedSessions.size > 0
  }, [closedSessions])

  const clearClosedSessions = React.useCallback(() => {
    setClosedSessions(new Set())
    try {
      localStorage.removeItem(CLOSED_SESSIONS_STORAGE_KEY)
    } catch (error) {
      console.error("Failed to clear closed sessions from localStorage:", error)
    }
  }, [])

  const value = React.useMemo(
    () => ({
      notifications,
      assignedSessions,
      closedSessions,
      addNotification,
      markAsRead,
      markAllAsRead,
      getUnreadCount,
      clearNotifications,
      addAssignedSession,
      removeAssignedSession,
      hasAssignedSessions,
      clearAssignedSessions,
      addClosedSession,
      removeClosedSession,
      hasClosedSessions,
      clearClosedSessions,
    }),
    [notifications, assignedSessions, closedSessions, addNotification, markAsRead, markAllAsRead, getUnreadCount, clearNotifications, addAssignedSession, removeAssignedSession, hasAssignedSessions, clearAssignedSessions, addClosedSession, removeClosedSession, hasClosedSessions, clearClosedSessions]
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }
  return context
}

