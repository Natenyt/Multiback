"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/contexts/notification-context"
import { useAuthError } from "@/contexts/auth-error-context"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, ArrowUpDown } from "lucide-react"
import { getTickets, type TicketListItem, getStaffProfile, getAuthToken } from "@/dash_department/lib/api"
import { useToast } from "@/hooks/use-toast"

// Get WS URL from API URL (replace /api with empty, and http with ws)
// WebSocket URL - needs to be public since WebSockets require direct connection
// For HTTPS pages, must use wss:// (secure WebSocket)
// Set NEXT_PUBLIC_WS_URL in Vercel (e.g., wss://185.247.118.219:8000 for HTTPS)
const getWsBaseUrl = (): string => {
  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  
  // Auto-detect: if page is HTTPS, use wss://, otherwise ws://
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    // For HTTPS, use secure WebSocket (wss://)
    // Default to wss://185.247.118.219:8000 for production
    return 'wss://185.247.118.219:8000';
  }
  
  // For HTTP (local development), use ws://
  return 'ws://localhost:8000';
}

interface TicketsTableProps {
  status: "unassigned" | "assigned" | "closed" | "archive"
  onPreviewClick: (sessionId: string) => void
  onAssign: (sessionId: string) => void
  onEscalate: (sessionId: string) => void
  onClose?: (sessionId: string) => void
  refreshTrigger?: number // External trigger to refresh
}

export function TicketsTable({
  status,
  onPreviewClick,
  onAssign,
  onEscalate,
  onClose,
  refreshTrigger,
}: TicketsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { addNotification, notifications, assignedSessions, closedSessions } = useNotifications()
  const { setAuthError } = useAuthError()
  const [tickets, setTickets] = React.useState<TicketListItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState("") // Local input value
  const [search, setSearch] = React.useState("") // Debounced search value for API
  const [neighborhoodId, setNeighborhoodId] = React.useState<number | undefined>()
  const [sortField, setSortField] = React.useState<"session_id" | "created_at">("created_at")
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc")
  const wsRef = React.useRef<WebSocket | null>(null)
  const [departmentId, setDepartmentId] = React.useState<number | null>(null)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const fetchTickets = React.useCallback(async () => {
    try {
      setIsLoading(true)
      // Map 'archive' to 'closed' for API call
      const apiStatus = status === 'archive' ? 'closed' : status
      const data = await getTickets(apiStatus as 'unassigned' | 'assigned' | 'closed', {
        search: search || undefined,
        neighborhood_id: neighborhoodId,
        page: 1,
        page_size: 50,
        lang: "uz",
      })
      // Backend now properly filters by status, so no need for client-side filtering
      setTickets(data)
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
      // If authentication error, set error in context
      if (error instanceof Error && (
        error.message.includes('token') ||
        error.message.includes('authentication') ||
        error.message.includes('not valid') ||
        error.message.includes('Authentication failed')
      )) {
        setAuthError(error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [status, search, neighborhoodId])

  const fetchNewTickets = React.useCallback(async () => {
    try {
      // Map 'archive' to 'closed' for API call
      const apiStatus = status === 'archive' ? 'closed' : status
      const data = await getTickets(apiStatus as 'unassigned' | 'assigned' | 'closed', {
        page: 1,
        page_size: 50,
        lang: "uz",
      })

      // Backend now properly filters by status, so no need for client-side filtering
      // Use functional update to get current tickets and compare
      setTickets(currentTickets => {
        // Only process if we have existing tickets
        if (currentTickets.length === 0) {
          return data
        }

        // Find tickets that are new (not in existing list)
        const existingIds = new Set(currentTickets.map(t => t.session_id))
        const newTickets = data.filter(ticket => !existingIds.has(ticket.session_id))
        
        if (newTickets.length > 0) {
          // Prepend new tickets to the list (newest first)
          return [...newTickets, ...currentTickets]
        }
        
        return currentTickets
      })
    } catch (error) {
      console.error("Failed to fetch new tickets:", error)
      // Silently fail for polling - don't disrupt user experience
    }
  }, [status])

  // Debounce search input - update search state after user stops typing for 500ms
  React.useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set new timeout to update search after 500ms of no typing
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(searchInput)
    }, 500)
    
    // Cleanup timeout on unmount or when searchInput changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchInput])

  React.useEffect(() => {
    fetchTickets()
  }, [fetchTickets, refreshTrigger])

  // Fetch department_id from staff profile
  React.useEffect(() => {
    async function fetchDepartmentId() {
      try {
        const profile = await getStaffProfile()
        if (profile.department_id) {
          setDepartmentId(profile.department_id)
        }
      } catch (error) {
        console.error("Failed to fetch department ID:", error)
      }
    }
    fetchDepartmentId()
  }, [])

  // WebSocket connection for real-time updates (only for unassigned status)
  React.useEffect(() => {
    // Only connect WebSocket for unassigned status and when department_id is available
    if (status !== 'unassigned' || !departmentId) {
      return
    }

    const token = getAuthToken()
    if (!token) {
      console.error("No auth token available for websocket connection")
      return
    }

    // Construct websocket URL with token in query string
    const wsBaseUrl = getWsBaseUrl()
    const wsUrl = `${wsBaseUrl}/ws/department/${departmentId}/?token=${encodeURIComponent(token)}`
    
    console.log("Connecting to department WebSocket:", wsUrl.replace(token, "***"))
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("Department WebSocket connected for department:", departmentId)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log("Department WebSocket message received:", data)

        // Handle session.created events (new unassigned sessions)
        if (data.type === "session.created" && data.session) {
          const newSession = data.session
          // Only add if the session is unassigned
          if (newSession.status === 'unassigned') {
            // Convert session to TicketListItem format
            const neighborhoodObj = newSession.citizen?.neighborhood || newSession.neighborhood
            const newTicket: TicketListItem = {
              session_id: newSession.session_uuid,
              citizen_name: newSession.citizen?.full_name || 'Unknown',
              phone_number: newSession.citizen?.phone_number || newSession.phone_number || '',
              neighborhood: neighborhoodObj ? {
                id: neighborhoodObj.id,
                name_uz: neighborhoodObj.name_uz,
                name_ru: neighborhoodObj.name_ru || neighborhoodObj.name_uz,
                name: neighborhoodObj.name || neighborhoodObj.name_uz,
              } : null,
              created_at: newSession.created_at,
              status: 'unassigned',
              assigned_staff: newSession.assigned_staff || null,
              department_name: newSession.department_name || null,
              origin: newSession.origin || 'web',
              location: newSession.citizen?.location || newSession.location || '',
              intent_label: newSession.intent_label || null,
              preview_text: '', // Will be populated by backend, but empty for now
            }
            
            setTickets((prev) => {
              // Check if ticket already exists
              const exists = prev.some((t) => t.session_id === newTicket.session_id)
              if (exists) {
                return prev
              }
              // Prepend new ticket (newest first)
              return [newTicket, ...prev]
            })

            // Emit notification only if staff is NOT currently on the unassigned page
            const isOnUnassignedPage = pathname === '/dashboard/unassigned'
            if (!isOnUnassignedPage) {
              addNotification({
                session_uuid: newSession.session_uuid,
                citizen_name: newSession.citizen?.full_name || 'Unknown',
                created_at: newSession.created_at,
              })
            }
          }
        }

        // Handle session.assigned events (remove from unassigned list)
        if (data.type === "session.assigned" && data.session) {
          const assignedSession = data.session
          setTickets((prev) => {
            // Remove the session if it was in our list
            return prev.filter((t) => t.session_id !== assignedSession.session_uuid)
          })
        }
      } catch (error) {
        console.error("Error parsing websocket message:", error)
      }
    }

    ws.onerror = (error) => {
      console.error("Department WebSocket error:", error)
    }

    ws.onclose = (event) => {
      console.log("Department WebSocket closed:", event.code, event.reason)
      // Attempt to reconnect after 3 seconds if not a normal closure
      if (event.code !== 1000) {
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            // Trigger reconnect by re-running the effect
            // This is handled by the useEffect dependency on departmentId and status
          }
        }, 3000)
      }
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, "Component unmounting")
      }
      wsRef.current = null
    }
  }, [status, departmentId])

  // Separate effect for polling (only when no search/filter and no WebSocket for non-unassigned)
  React.useEffect(() => {
    // Only poll if no search/filter is active and status is not unassigned (unassigned uses WebSocket)
    // OR if WebSocket is not connected (fallback)
    if (!search && !neighborhoodId && tickets.length > 0 && status !== 'unassigned') {
      // Poll for new tickets every 10 seconds, but only append new ones
      const interval = setInterval(() => {
        fetchNewTickets()
      }, 10000)
      
      return () => clearInterval(interval)
    }
  }, [search, neighborhoodId, tickets.length, fetchNewTickets, status])

  const handleSort = (field: "session_id" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedTickets = [...tickets].sort((a, b) => {
    let comparison = 0
    if (sortField === "session_id") {
      comparison = a.session_id.localeCompare(b.session_id)
    } else {
      comparison =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    return sortDirection === "asc" ? comparison : -comparison
  })

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="ID yoki ism bo'yicha qidirish..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
          }}
          onKeyDown={(e) => {
            // Prevent form submission on Enter
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
          className="flex-1 px-3 py-2 border rounded-md"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading tickets...</p>
        </div>
      ) : sortedTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8">
          <p className="text-muted-foreground text-lg mb-2">No tickets found</p>
          <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-3"
                  onClick={() => handleSort("session_id")}
                >
                  Session ID
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-3"
                  onClick={() => handleSort("created_at")}
                >
                  Sana
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Ism Familiya</TableHead>
              <TableHead>Telefon Raqam</TableHead>
              <TableHead>Mahalla</TableHead>
              {status !== "closed" && status !== "archive" && <TableHead>Action</TableHead>}
              <TableHead className="w-[50px]">{status === 'unassigned' ? '' : ''}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTickets.map((ticket) => (
                <TableRow 
                  key={ticket.session_id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={(e) => {
                    // Don't navigate if clicking on buttons or interactive elements
                    const target = e.target as HTMLElement
                    if (
                      target.closest('button') ||
                      target.closest('[role="menuitem"]') ||
                      target.closest('[data-radix-dropdown-menu-trigger]')
                    ) {
                      return
                    }
                    let route: string
                    if (status === "unassigned") {
                      route = `/dashboard/unassigned/${ticket.session_id}`
                    } else if (status === "closed" || status === "archive") {
                      route = `/dashboard/closed/${ticket.session_id}`
                    } else {
                      route = `/dashboard/assigned/${ticket.session_id}`
                    }
                    router.push(route)
                  }}
                >
                  <TableCell 
                    className="cursor-pointer hover:text-foreground transition-colors"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(ticket.session_id)
                        toast({
                          title: "Copied",
                          description: "Session ID copied to clipboard",
                        })
                      } catch (error) {
                        console.error("Failed to copy:", error)
                      }
                    }}
                  >
                    {ticket.session_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{formatDate(ticket.created_at)}</TableCell>
                  <TableCell>{ticket.citizen_name || "N/A"}</TableCell>
                  <TableCell 
                    className="cursor-pointer hover:text-foreground transition-colors"
                    onClick={async () => {
                      if (ticket.phone_number) {
                        try {
                          await navigator.clipboard.writeText(ticket.phone_number)
                          toast({
                            title: "Copied",
                            description: "Phone number copied to clipboard",
                          })
                        } catch (error) {
                          console.error("Failed to copy:", error)
                        }
                      }
                    }}
                  >
                    {ticket.phone_number || "N/A"}
                  </TableCell>
                  <TableCell>{ticket.neighborhood?.name || "N/A"}</TableCell>
                  {status !== "closed" && status !== "archive" && (
                    <TableCell>
                      {status === "unassigned" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onAssign(ticket.session_id)
                          }}
                        >
                          Biriktirish
                        </Button>
                      )}
                      {status === "assigned" && onClose && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onClose(ticket.session_id)
                          }}
                        >
                          Tugallash
                        </Button>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEscalate(ticket.session_id)}>
                          Escalate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="w-[50px]">
                    {status === 'unassigned' && (() => {
                      // Check if this session has an unread notification
                      const hasUnreadNotification = notifications.some(
                        (n) => n.session_uuid === ticket.session_id && !n.read
                      )
                      // Also check if session was created within the last 5 minutes (considered "new")
                      const sessionCreatedAt = new Date(ticket.created_at)
                      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
                      const isRecentlyCreated = sessionCreatedAt > fiveMinutesAgo
                      
                      if (hasUnreadNotification || isRecentlyCreated) {
                        return (
                          <span className="h-4 w-4 rounded-full bg-green-500 inline-block" />
                        )
                      }
                      return null
                    })()}
                    {status === 'assigned' && (() => {
                      // Check if this session is in the assigned sessions set (newly assigned)
                      const isNewlyAssigned = assignedSessions.has(ticket.session_id)
                      
                      // Also check if session was assigned within the last 10 minutes
                      let isRecentlyAssigned = false
                      if (ticket.assigned_at) {
                        const assignedAt = new Date(ticket.assigned_at)
                        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
                        isRecentlyAssigned = assignedAt > tenMinutesAgo
                      }
                      
                      if (isNewlyAssigned || isRecentlyAssigned) {
                        return (
                          <span className="h-4 w-4 rounded-full bg-blue-500 inline-block" />
                        )
                      }
                      return null
                    })()}
                    {(status === 'closed' || status === 'archive') && (() => {
                      // Check if this session is in the closed sessions set (newly closed)
                      const isNewlyClosed = closedSessions.has(ticket.session_id)
                      
                      // Also check if session was closed within the last 10 minutes
                      let isRecentlyClosed = false
                      if (ticket.closed_at) {
                        const closedAt = new Date(ticket.closed_at)
                        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
                        isRecentlyClosed = closedAt > tenMinutesAgo
                      }
                      
                      if (isNewlyClosed || isRecentlyClosed) {
                        return (
                          <span className="h-4 w-4 rounded-full bg-gray-500 inline-block" />
                        )
                      }
                      return null
                    })()}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
        </>
      )}
    </div>
  )
}

