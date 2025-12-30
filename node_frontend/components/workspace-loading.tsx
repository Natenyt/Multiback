"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

export function WorkspaceLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Ish maydoni yuklanmoqda...</p>
      </div>
    </div>
  )
}

