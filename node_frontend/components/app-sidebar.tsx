"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Inbox,
  CheckCircle2,
  Archive,
  Search,
  LogOut,
  User,
  Bell,
  ChevronsUpDown,
  BarChart3,
  Check,
  GraduationCap,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNotifications } from "@/contexts/notification-context"
import { useAuthError } from "@/contexts/auth-error-context"
import { useStaffProfile } from "@/contexts/staff-profile-context"
import { clearAuthTokens, clearTokenExpirationCache } from "@/dash_department/lib/api"
import { clearAllDashboardCaches } from "@/hooks/use-dashboard-data"

// Menu items with Lucide icons
const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard/dashboard",
  },
  {
    title: "Yangi Murojatlar",
    icon: Inbox,
    href: "/dashboard/unassigned",
  },
  {
    title: "Faol Murojaatlar",
    icon: CheckCircle2,
    href: "/dashboard/assigned",
  },
  {
    title: "Arxiv",
    icon: Archive,
    href: "/dashboard/archive",
  },
  {
    title: "Asadbek AI",
    icon: null,
    href: "/dashboard/ai",
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const { getUnreadCount, hasAssignedSessions, clearAssignedSessions, hasClosedSessions, clearClosedSessions, escalatedNotifications, clearNotifications, clearEscalatedSessions } = useNotifications()
  const { setAuthError } = useAuthError()
  const { staffProfile, isLoading, error, clearProfile } = useStaffProfile()
  const [escalatedCount, setEscalatedCount] = React.useState(0)
  const unreadCount = getUnreadCount()
  const hasAssigned = hasAssignedSessions()
  const hasClosed = hasClosedSessions()
  
  // Fetch total escalated count for VIP members
  React.useEffect(() => {
    if (staffProfile?.role === 'VIP') {
      const fetchEscalatedCount = async () => {
        try {
          const { getTickets } = await import("@/dash_department/lib/api")
          // Fetch escalated tickets with a reasonable page size
          // Since we need the total count, we'll fetch a large batch
          // In production, you might want to add a count endpoint
          const tickets = await getTickets('escalated', { page_size: 500 })
          setEscalatedCount(tickets.length)
        } catch (error) {
          console.error("Failed to fetch escalated count:", error)
          // Fallback to 0 if fetch fails
          setEscalatedCount(0)
        }
      }
      fetchEscalatedCount()
      
      // Refresh count periodically (every 30 seconds)
      const interval = setInterval(fetchEscalatedCount, 30000)
      return () => clearInterval(interval)
    } else {
      setEscalatedCount(0)
    }
  }, [staffProfile?.role])
  const isOnUnassignedPage = pathname === '/dashboard/unassigned' || pathname?.startsWith('/dashboard/unassigned/')
  const isOnAssignedPage = pathname === '/dashboard/assigned' || pathname?.startsWith('/dashboard/assigned/')
  const isOnArchivePage = pathname === '/dashboard/archive' || pathname?.startsWith('/dashboard/archive/') || pathname?.startsWith('/dashboard/closed/')
  const isOnTrainingPage = pathname === '/train' || pathname?.startsWith('/train/')
  const isOnStatisticsPage = pathname === '/statistics' || pathname?.startsWith('/statistics/')
  
  // Determine current workspace from pathname
  const getCurrentWorkspace = React.useCallback(() => {
    if (isOnTrainingPage) return "Training"
    if (isOnStatisticsPage) return "Statistics"
    return "Dashboard"
  }, [isOnTrainingPage, isOnStatisticsPage])
  
  const currentWorkspace = getCurrentWorkspace()

  // Handle workspace navigation
  const handleWorkspaceNavigation = React.useCallback((path: string) => {
    // Navigate immediately without loading animation
    router.push(path)
  }, [router])


  // Clear assigned sessions when viewing assigned page
  React.useEffect(() => {
    if (isOnAssignedPage) {
      clearAssignedSessions()
    }
  }, [isOnAssignedPage, clearAssignedSessions])

  // Clear closed sessions when viewing archive/closed page
  React.useEffect(() => {
    if (isOnArchivePage) {
      clearClosedSessions()
    }
  }, [isOnArchivePage, clearClosedSessions])

  React.useEffect(() => {
    // Surface authentication-related errors from the staff profile context to the auth error handler
    if (error) {
      setAuthError(error)
    }
  }, [error, setAuthError])

  const handleLogout = () => {
    // Clear auth tokens immediately (needed for security)
    // This is safe to do synchronously as it only affects localStorage
    clearAuthTokens()
    
    // Navigate to login page IMMEDIATELY for instant logout experience
    // Using router.replace for faster navigation (no history entry)
    router.replace("/login")
    
    // Clear non-visible caches immediately (no UI impact)
    clearTokenExpirationCache()
    
    // Revoke all blob URLs to free memory (no UI impact)
    if (typeof window !== 'undefined' && (window as any).__blobUrls) {
      try {
        (window as any).__blobUrls.forEach((url: string) => {
          try {
            URL.revokeObjectURL(url)
          } catch (e) {
            // Silently fail if URL is already revoked
          }
        })
        ;(window as any).__blobUrls.clear()
      } catch (error) {
        console.error("Failed to revoke blob URLs:", error)
      }
    }
    
    // Clear dashboard caches in the background (no UI impact)
    clearAllDashboardCaches()
    
    // For profile and notifications, wait until we're actually on login page
    // This prevents visible flash even with slow internet connections
    const clearVisibleState = () => {
      // Clear all notification caches (localStorage + state)
      clearNotifications()
      clearAssignedSessions()
      clearClosedSessions()
      clearEscalatedSessions()
      
      // Clear profile state - this must happen to clear job_title, department_name, etc.
      clearProfile()
    }
    
    // Poll to check if we're on login page before clearing visible state
    // This handles slow internet connections where navigation might take several seconds
    let pollCount = 0
    const maxPolls = 100 // Maximum 10 seconds (100 * 100ms)
    const pollInterval = 100 // Check every 100ms
    
    const checkAndClear = () => {
      if (typeof window === 'undefined') {
        // Fallback: clear after timeout if window is not available
        setTimeout(clearVisibleState, 1000)
        return
      }
      
      const currentPath = window.location.pathname
      
      if (currentPath === '/login') {
        // We're on login page, safe to clear visible state
        // Polling stops here - no more setTimeout calls
        clearVisibleState()
        return // Explicitly stop polling
      } else if (pollCount < maxPolls) {
        // Not on login page yet, keep polling
        pollCount++
        setTimeout(checkAndClear, pollInterval)
      } else {
        // Maximum polls reached, clear anyway as fallback
        // This ensures caches are cleared even if navigation somehow fails
        // Polling stops here - no more setTimeout calls
        clearVisibleState()
        return // Explicitly stop polling
      }
    }
    
    // Start polling after a short initial delay
    // Polling automatically stops when we reach /login or max polls
    setTimeout(checkAndClear, pollInterval)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button suppressHydrationWarning className="flex w-full items-center gap-2 rounded-md px-2 py-4 hover:bg-sidebar-accent group-data-[collapsible=icon]:hover:bg-transparent group/logo group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 !transition-none">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-hover/logo:bg-sidebar-primary/90 group-data-[collapsible=icon]:group-hover/logo:bg-sidebar-primary !transition-none">
                {currentWorkspace === "Dashboard" ? (
                  <Image
                    src="/logo.svg"
                    alt="NTMP Logo"
                    width={14}
                    height={14}
                    className="object-contain dark:invert-0"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                ) : currentWorkspace === "Training" ? (
                  <GraduationCap className="h-4 w-4" />
                ) : currentWorkspace === "Statistics" ? (
                  <BarChart3 className="h-4 w-4" />
                ) : (
                  <Image
                    src="/logo.svg"
                    alt="Logo"
                    width={14}
                    height={14}
                    className="object-contain dark:invert-0"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                )}
              </div>
              <div className="flex flex-1 items-center gap-2 group-data-[collapsible=icon]:hidden">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold group-hover/logo:text-sidebar-foreground/80 whitespace-nowrap text-left">
                    {currentWorkspace === "Dashboard" ? "NTMP" : currentWorkspace}
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[200px]"
            side="right"
          >
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                handleWorkspaceNavigation("/dashboard/dashboard")
              }}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-primary">
                  <Image
                    src="/logo.svg"
                    alt="Dashboard"
                    width={14}
                    height={14}
                    className="object-contain dark:invert-0"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </div>
                <span className="flex-1">Dashboard</span>
                {currentWorkspace === "Dashboard" && <Check className="h-4 w-4" />}
              </div>
            </DropdownMenuItem>
            {staffProfile?.role === 'VIP' && (
              <DropdownMenuItem
                onClick={() => {
                  handleWorkspaceNavigation("/statistics")
                }}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <span className="flex-1">Statistics</span>
                  {currentWorkspace === "Statistics" && <Check className="h-4 w-4" />}
                </div>
              </DropdownMenuItem>
            )}
            {staffProfile?.role === 'VIP' && (
              <DropdownMenuItem
                onClick={() => {
                  handleWorkspaceNavigation("/train")
                }}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <span className="flex-1">Training</span>
                  <div className="flex items-center gap-1.5">
                    {escalatedCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                        {escalatedCount > 9 ? "9+" : escalatedCount}
                      </span>
                    )}
                    {currentWorkspace === "Training" && <Check className="h-4 w-4" />}
                  </div>
                </div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-[5px]">
              {isOnTrainingPage ? (
                // Training workspace: Only show Escalated Murojaatlar
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={true} className="!transition-none">
                    <Link
                      href="/train"
                      className="flex items-center !transition-none relative gap-2 px-2 bg-sidebar-accent/80 dark:bg-sidebar-accent/80 text-sidebar-accent-foreground font-semibold shadow-md border-l-4 border-sidebar-primary"
                    >
                      <span className="shrink-0 !transition-none">
                        <Inbox className="h-[18px] w-[18px]" />
                      </span>
                      <span className="group-data-[collapsible=icon]:hidden">
                        Escalated Murojaatlar
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                menuItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
                const showGreenCircle = item.href === "/dashboard/unassigned" && unreadCount > 0 && !isOnUnassignedPage
                const showBlueCircle = item.href === "/dashboard/assigned" && hasAssigned && !isOnAssignedPage
                const showGrayCircle = item.href === "/dashboard/archive" && hasClosed && !isOnArchivePage
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className="!transition-none">
                      <Link
                        href={item.href}
                        className={`flex items-center !transition-none relative ${
                          isCollapsed
                            ? "justify-center px-2"
                            : "gap-2 px-2"
                        } ${
                          isActive 
                            ? "bg-sidebar-accent/80 dark:bg-sidebar-accent/80 text-sidebar-accent-foreground font-semibold shadow-md border-l-4 border-sidebar-primary" 
                            : ""
                        }`}
                      >
                      <span className={`shrink-0 !transition-none ${isCollapsed ? 'relative' : ''}`}>
                        {item.title === "Asadbek AI" ? (
                          <Image
                            src="/AI.svg"
                            alt="AI"
                            width={18}
                            height={18}
                            className="object-contain [filter:brightness(0)] dark:[filter:brightness(0)_invert(1)]"
                          />
                        ) : item.icon ? (
                          <item.icon className="h-[18px] w-[18px]" />
                        ) : null}
                        {/* Circles positioned on top-right of icon when collapsed */}
                        {isCollapsed && showGreenCircle && (
                          <span className="absolute h-2 w-2 rounded-full bg-green-500 -top-0.5 -right-0.5" />
                        )}
                        {isCollapsed && showBlueCircle && (
                          <span className="absolute h-2 w-2 rounded-full bg-blue-500 -top-0.5 -right-0.5" />
                        )}
                        {isCollapsed && showGrayCircle && (
                          <span className="absolute h-2 w-2 rounded-full bg-gray-500 -top-0.5 -right-0.5" />
                        )}
                      </span>
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {/* Circles positioned on right side when expanded */}
                        {!isCollapsed && showGreenCircle && (
                          <span 
                            className="absolute right-2 h-4 w-4 rounded-full bg-green-500"
                            style={{ 
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                          />
                        )}
                        {!isCollapsed && showBlueCircle && (
                          <span 
                            className="absolute right-2 h-4 w-4 rounded-full bg-blue-500"
                            style={{ 
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                          />
                        )}
                        {!isCollapsed && showGrayCircle && (
                          <span 
                            className="absolute right-2 h-4 w-4 rounded-full bg-gray-500"
                            style={{ 
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {isLoading ? (
          <div className="px-2 py-4">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 !transition-none">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-sidebar-primary animate-pulse" />
              <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
                <div className="h-3 w-20 bg-sidebar-primary/20 rounded animate-pulse" />
                <div className="h-2 w-32 bg-sidebar-primary/20 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ) : staffProfile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button suppressHydrationWarning className="flex w-full items-center gap-2 rounded-md px-2 py-2 hover:bg-sidebar-accent group-data-[collapsible=icon]:hover:bg-transparent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 !transition-none">
                <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                  {staffProfile.avatar_url ? (
                    <AvatarImage src={staffProfile.avatar_url} alt={staffProfile.full_name} />
                  ) : null}
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg">
                    {getInitials(staffProfile.full_name || "User")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col gap-0.5 overflow-hidden text-left group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium truncate text-left">
                    {staffProfile.full_name || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate text-left">
                    {staffProfile.email || "emailnot@registered.com"}
                  </span>
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[200px] max-w-[300px]"
              side="right"
            >
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    {staffProfile.avatar_url ? (
                      <AvatarImage src={staffProfile.avatar_url} alt={staffProfile.full_name} />
                    ) : null}
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg">
                      {getInitials(staffProfile.full_name || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">
                      {staffProfile.full_name || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {staffProfile.email || "emailnot@registered.com"}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full block">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onSelect={(e) => {
                          e.preventDefault()
                        }}
                        className="w-full cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Account</span>
                      </DropdownMenuItem>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="left" 
                    align="center"
                    className="bg-popover dark:bg-popover text-popover-foreground dark:text-popover-foreground border border-border dark:border-border shadow-lg z-[9999]"
                  >
                    <p>Bu xususiyat hozir ishlab chiqilmoqda</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full block">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onSelect={(e) => {
                          e.preventDefault()
                        }}
                        className="w-full cursor-pointer"
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        <span>Notifications</span>
                      </DropdownMenuItem>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="left" 
                    align="center"
                    className="bg-popover dark:bg-popover text-popover-foreground dark:text-popover-foreground border border-border dark:border-border shadow-lg z-[9999]"
                  >
                    <p>Bu xususiyat hozir ishlab chiqilmoqda</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="px-2 py-4">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 !transition-none">
              <div className="flex h-8 w-8 shrink-0 rounded-lg items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="text-xs">U</span>
              </div>
              <div className="flex flex-col gap-0.5 text-left group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium text-left">User</span>
                <span className="text-xs text-muted-foreground text-left">emailnot@registered.com</span>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
    </>
  )
}

