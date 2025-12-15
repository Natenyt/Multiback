"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { getTickets, type TicketListItem } from "@/dash_department/lib/api"
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()
  const [tickets, setTickets] = React.useState<TicketListItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [neighborhoodId, setNeighborhoodId] = React.useState<number | undefined>()
  const [sortField, setSortField] = React.useState<"session_id" | "created_at">("created_at")
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc")

  const fetchTickets = async () => {
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
    } finally {
      setIsLoading(false)
    }
  }

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

  React.useEffect(() => {
    fetchTickets()
  }, [status, search, neighborhoodId, refreshTrigger])

  // Separate effect for polling (only when no search/filter)
  React.useEffect(() => {
    // Only poll if no search/filter is active (to avoid disrupting user's view)
    if (!search && !neighborhoodId && tickets.length > 0) {
      // Poll for new tickets every 10 seconds, but only append new ones
      const interval = setInterval(() => {
        fetchNewTickets()
      }, 10000)
      
      return () => clearInterval(interval)
    }
  }, [search, neighborhoodId, tickets.length, fetchNewTickets])

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading tickets...</p>
      </div>
    )
  }

  if (sortedTickets.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground text-lg mb-2">No tickets found</p>
        <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="ID yoki ism bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
      </div>

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
              <TableHead className="w-[50px]"></TableHead>
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
                  <TableCell>{ticket.neighborhood?.name || ticket.neighborhood || "N/A"}</TableCell>
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
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

