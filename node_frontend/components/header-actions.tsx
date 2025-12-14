"use client"

import * as React from "react"
import { Bell, Globe } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"

const dummyNotifications = [
  {
    id: 1,
    title: "Yangi murojaat",
    message: "Sizga yangi murojaat tayinlandi",
    time: "5 daqiqa oldin",
  },
  {
    id: 2,
    title: "Xabar yangilandi",
    message: "Murojaat holati o'zgardi",
    time: "1 soat oldin",
  },
  {
    id: 3,
    title: "Eslatma",
    message: "Yakunlanish muddati yaqinlashmoqda",
    time: "2 soat oldin",
  },
  {
    id: 4,
    title: "Yangi xabar",
    message: "Fuqaro sizga xabar yubordi",
    time: "3 soat oldin",
  },
]

export function HeaderActions() {
  const [language, setLanguage] = React.useState<"UZ" | "RU">("UZ")
  const [unreadCount] = React.useState(3)

  return (
    <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-1.5 py-1 border border-border/30">
      {/* Notification Bell */}
        <DropdownMenu>
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
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Xabarnomalar</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {dummyNotifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-1 p-3 cursor-pointer"
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {notification.message}
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{notification.time}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Language Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button suppressHydrationWarning className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-muted/50 transition-colors">
            <span className="text-sm font-medium text-muted-foreground">{language}</span>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setLanguage("UZ")}
            className="cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>UZ</span>
              {language === "UZ" && <span className="text-xs">✓</span>}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setLanguage("RU")}
            className="cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>RU</span>
              {language === "RU" && <span className="text-xs">✓</span>}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Toggle */}
      <ThemeToggle />
    </div>
  )
}

