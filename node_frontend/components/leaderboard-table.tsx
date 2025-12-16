"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getLeaderboard } from "@/dash_department/lib/api"
import type { LeaderboardEntry } from "@/dash_department/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LeaderboardTable() {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchLeaderboard() {
      try {
        console.log("Fetching leaderboard data...")
        const data = await getLeaderboard()
        console.log("Leaderboard data received:", data)
        console.log("Leaderboard entries:", data.leaderboard)
        if (data && data.leaderboard) {
          setLeaderboard(data.leaderboard)
        } else {
          console.warn("Leaderboard data is missing or invalid:", data)
          setLeaderboard([])
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard data:", error)
        // If authentication error, redirect to login
        if (error instanceof Error && (
          error.message.includes('Authentication failed') ||
          error.message.includes('No authentication token') ||
          error.message.includes('token') ||
          error.message.includes('authentication')
        )) {
          console.log("Authentication error detected, redirecting to login...")
          router.push('/login')
          return
        }
        // For other errors, just show empty state
        console.warn("Setting empty leaderboard due to error")
        setLeaderboard([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchLeaderboard()
  }, [router])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Hamkasblaringiz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Hamkasblaringiz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Ma'lumot mavjud emas
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Hamkasblaringiz</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 pl-6 text-sm font-medium text-muted-foreground">
                  Index
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                  To'liq ism
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                  Bo'lim
                </th>
                <th className="py-4 pr-6 text-sm font-medium text-muted-foreground">
                  <div className="flex justify-end">
                    <div className="text-right" style={{ minWidth: '120px' }}>
                      Yechilgan murojaatlar soni
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => {
                return (
                  <tr
                    key={index}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 pl-6">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 text-foreground font-medium text-sm">
                        {entry.rank}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-lg">
                          {entry.avatar_url ? (
                            <AvatarImage src={entry.avatar_url} alt={entry.full_name} />
                          ) : null}
                          <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg">
                            {getInitials(entry.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">
                          {entry.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-foreground break-words whitespace-normal inline-block" style={{ maxWidth: '700px' }}>
                        {entry.department_name}
                      </span>
                    </td>
                    <td className="py-4 pr-6">
                      <div className="flex justify-end">
                        <div className="text-center" style={{ minWidth: '120px' }}>
                          <span className="text-sm font-medium text-foreground tabular-nums">
                            {entry.solved_total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

