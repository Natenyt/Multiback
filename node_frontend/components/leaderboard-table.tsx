"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getLeaderboard, fetchAuthenticatedImage } from "@/dash_department/lib/api"
import type { LeaderboardEntry } from "@/dash_department/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LeaderboardTable() {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [avatarUrls, setAvatarUrls] = React.useState<Record<number, string>>({})

  React.useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const data = await getLeaderboard()
        if (data && data.leaderboard) {
          setLeaderboard(data.leaderboard)
          
          // Pre-fetch avatars for entries that have avatar URLs
          const avatarPromises = data.leaderboard
            .map((entry, index) => {
              if (entry.avatar_url) {
                return fetchAuthenticatedImage(entry.avatar_url)
                  .then(blobUrl => ({ index, blobUrl }))
                  .catch(err => {
                    console.error(`Failed to fetch avatar for ${entry.full_name}:`, err)
                    return { index, blobUrl: null }
                  })
              }
              return Promise.resolve({ index, blobUrl: null })
            })
          
          Promise.all(avatarPromises).then(results => {
            const urls: Record<number, string> = {}
            results.forEach(({ index, blobUrl }) => {
              if (blobUrl) {
                urls[index] = blobUrl
              }
            })
            setAvatarUrls(urls)
          })
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
                <th className="py-4 pr-8 text-sm font-medium text-muted-foreground">
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
                          {avatarUrls[index] ? (
                            <AvatarImage src={avatarUrls[index]} alt={entry.full_name} />
                          ) : entry.avatar_url ? (
                            // Fallback: try direct URL if authenticated fetch hasn't completed yet
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

