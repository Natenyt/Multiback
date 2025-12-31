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
  escalatedNotifications: Notification[] // Escalated session notifications
  assignedSessions: Set<string> // Track newly assigned session UUIDs
  closedSessions: Set<string> // Track newly closed session UUIDs
  escalatedSessions: Set<string> // Track newly escalated session UUIDs
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void
  addEscalatedNotification: (notification: Omit<Notification, 'id' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  markEscalatedAsRead: () => void
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
  addEscalatedSession: (sessionUuid: string) => void
  removeEscalatedSession: (sessionUuid: string) => void
  hasEscalatedSessions: () => boolean
  clearEscalatedSessions: () => void
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined)

const NOTIFICATIONS_STORAGE_KEY = 'unassigned_session_notifications'

const ASSIGNED_SESSIONS_STORAGE_KEY = 'assigned_sessions'
const CLOSED_SESSIONS_STORAGE_KEY = 'closed_sessions'
const ESCALATED_SESSIONS_STORAGE_KEY = 'escalated_sessions'
const ESCALATED_NOTIFICATIONS_STORAGE_KEY = 'escalated_notifications'

// Performance: Limit stored notifications to prevent large localStorage operations
const MAX_STORED_NOTIFICATIONS = 100 // Store only last 100 notifications

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [escalatedNotifications, setEscalatedNotifications] = React.useState<Notification[]>([])
  const [assignedSessions, setAssignedSessions] = React.useState<Set<string>>(new Set())
  const [closedSessions, setClosedSessions] = React.useState<Set<string>>(new Set())
  const [escalatedSessions, setEscalatedSessions] = React.useState<Set<string>>(new Set())

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

    // Load escalated sessions from localStorage
    try {
      const storedEscalated = localStorage.getItem(ESCALATED_SESSIONS_STORAGE_KEY)
      if (storedEscalated) {
        const parsed = JSON.parse(storedEscalated) as string[]
        setEscalatedSessions(new Set(parsed))
      }
    } catch (error) {
      console.error("Failed to load escalated sessions from localStorage:", error)
    }
  }, [])

  // Save notifications to localStorage whenever they change
  // Performance: Only store last N notifications to prevent large localStorage operations
  React.useEffect(() => {
    try {
      // Limit stored notifications to prevent large localStorage operations
      const notificationsToStore = notifications.slice(0, MAX_STORED_NOTIFICATIONS)
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notificationsToStore))
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

  // Save escalated sessions to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem(ESCALATED_SESSIONS_STORAGE_KEY, JSON.stringify(Array.from(escalatedSessions)))
    } catch (error) {
      console.error("Failed to save escalated sessions to localStorage:", error)
    }
  }, [escalatedSessions])

  // Save escalated notifications to localStorage whenever they change
  // Performance: Only store last N notifications to prevent large localStorage operations
  React.useEffect(() => {
    try {
      // Limit stored notifications to prevent large localStorage operations
      const notificationsToStore = escalatedNotifications.slice(0, MAX_STORED_NOTIFICATIONS)
      localStorage.setItem(ESCALATED_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notificationsToStore))
    } catch (error) {
      console.error("Failed to save escalated notifications to localStorage:", error)
    }
  }, [escalatedNotifications])

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

  const addEscalatedNotification = React.useCallback(
    (notification: Omit<Notification, 'id' | 'read'>) => {
      const id = `escalated-${notification.session_uuid}-${Date.now()}`
      const newNotification: Notification = {
        ...notification,
        id,
        read: false,
      }
      setEscalatedNotifications((prev) => {
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
    setEscalatedNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = React.useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setEscalatedNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const markEscalatedAsRead = React.useCallback(() => {
    setEscalatedNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const getUnreadCount = React.useCallback(() => {
    return notifications.filter((n) => !n.read).length + escalatedNotifications.filter((n) => !n.read).length
  }, [notifications, escalatedNotifications])

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

  const addEscalatedSession = React.useCallback((sessionUuid: string) => {
    setEscalatedSessions((prev) => new Set([...prev, sessionUuid]))
  }, [])

  const removeEscalatedSession = React.useCallback((sessionUuid: string) => {
    setEscalatedSessions((prev) => {
      const newSet = new Set(prev)
      newSet.delete(sessionUuid)
      return newSet
    })
  }, [])

  const hasEscalatedSessions = React.useCallback(() => {
    return escalatedSessions.size > 0
  }, [escalatedSessions])

  const clearEscalatedSessions = React.useCallback(() => {
    setEscalatedSessions(new Set())
    setEscalatedNotifications([])
    try {
      localStorage.removeItem(ESCALATED_SESSIONS_STORAGE_KEY)
      localStorage.removeItem(ESCALATED_NOTIFICATIONS_STORAGE_KEY)
    } catch (error) {
      console.error("Failed to clear escalated sessions from localStorage:", error)
    }
  }, [])

  // Performance: Convert Sets to sorted arrays for stable comparison
  // Sets are compared by reference, so new Set instances cause unnecessary re-renders
  // Converting to sorted arrays allows proper value-based comparison
  const assignedSessionsArray = React.useMemo(
    () => Array.from(assignedSessions).sort(),
    [assignedSessions]
  )
  const closedSessionsArray = React.useMemo(
    () => Array.from(closedSessions).sort(),
    [closedSessions]
  )
  const escalatedSessionsArray = React.useMemo(
    () => Array.from(escalatedSessions).sort(),
    [escalatedSessions]
  )

  // Only include state values in dependencies, not callbacks
  // Callbacks are already memoized with useCallback and are stable
  // Including them would cause unnecessary re-renders
  // Performance: Use arrays instead of Sets for stable comparison
  const value = React.useMemo(
    () => ({
      notifications,
      escalatedNotifications,
      assignedSessions,
      closedSessions,
      escalatedSessions,
      addNotification,
      addEscalatedNotification,
      markAsRead,
      markAllAsRead,
      markEscalatedAsRead,
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
      addEscalatedSession,
      removeEscalatedSession,
      hasEscalatedSessions,
      clearEscalatedSessions,
    }),
    // Only include state values that actually change
    // Callbacks are stable (memoized with useCallback with empty deps or proper deps)
    // Performance: Use arrays for Sets to enable value-based comparison instead of reference comparison
    [notifications, escalatedNotifications, assignedSessionsArray, closedSessionsArray, escalatedSessionsArray]
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

