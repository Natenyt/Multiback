"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
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
  const [currentWorkspace, setCurrentWorkspace] = React.useState("Dashboard")
  const { getUnreadCount, hasAssignedSessions, clearAssignedSessions, hasClosedSessions, clearClosedSessions } = useNotifications()
  const { setAuthError } = useAuthError()
  const { staffProfile, isLoading, error } = useStaffProfile()
  const unreadCount = getUnreadCount()
  const hasAssigned = hasAssignedSessions()
  const hasClosed = hasClosedSessions()
  const isOnUnassignedPage = pathname === '/dashboard/unassigned' || pathname?.startsWith('/dashboard/unassigned/')
  const isOnAssignedPage = pathname === '/dashboard/assigned' || pathname?.startsWith('/dashboard/assigned/')
  const isOnArchivePage = pathname === '/dashboard/archive' || pathname?.startsWith('/dashboard/archive/') || pathname?.startsWith('/dashboard/closed/')

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
    router.push("/login")
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button suppressHydrationWarning className="flex w-full items-center gap-2 rounded-md px-2 py-4 hover:bg-sidebar-accent group-data-[collapsible=icon]:hover:bg-transparent group/logo group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 !transition-none">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-hover/logo:bg-sidebar-primary/90 group-data-[collapsible=icon]:group-hover/logo:bg-sidebar-primary !transition-none">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={14}
                  height={14}
                  className="object-contain dark:invert-0"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <div className="flex flex-1 items-center gap-2 group-data-[collapsible=icon]:hidden">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold group-hover/logo:text-sidebar-foreground/80 whitespace-nowrap text-left">
                    NTMP
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
              onClick={() => setCurrentWorkspace("Dashboard")}
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
            <DropdownMenuItem
              onClick={() => setCurrentWorkspace("Statistics")}
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
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-[5px]">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
                const showGreenCircle = item.href === "/dashboard/unassigned" && unreadCount > 0 && !isOnUnassignedPage
                const showBlueCircle = item.href === "/dashboard/assigned" && hasAssigned && !isOnAssignedPage
                const showGrayCircle = item.href === "/dashboard/archive" && hasClosed && !isOnArchivePage
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className="!transition-none">
                      <a
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
                      <span className="shrink-0 !transition-none">
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
                      </span>
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {showGreenCircle && (
                          <span 
                            className="absolute right-2 h-4 w-4 rounded-full bg-green-500"
                            style={{ 
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                          />
                        )}
                        {showBlueCircle && (
                          <span 
                            className="absolute right-2 h-4 w-4 rounded-full bg-blue-500"
                            style={{ 
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                          />
                        )}
                        {showGrayCircle && (
                          <span 
                            className="absolute right-2 h-4 w-4 rounded-full bg-gray-500"
                            style={{ 
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                          />
                        )}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
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
              className="w-[200px]"
              side="right"
            >
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 rounded-lg">
                    {staffProfile.avatar_url ? (
                      <AvatarImage src={staffProfile.avatar_url} alt={staffProfile.full_name} />
                    ) : null}
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg">
                      {getInitials(staffProfile.full_name || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {staffProfile.full_name || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
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
  )
}

