"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface InteractiveTerminalProps {
  command: string
  autoExecute?: boolean
  variant?: "dark" | "light"
  repeat?: boolean
  icon?: React.ReactNode
  steps: string[]
  finalMessage?: string
  stepDelay?: number
  className?: string
}

const DEFAULT_STEP_DELAY = 800

const InteractiveTerminal: React.FC<InteractiveTerminalProps> = ({
  command,
  autoExecute = false,
  variant = "dark",
  repeat = false,
  icon,
  steps,
  finalMessage,
  stepDelay = DEFAULT_STEP_DELAY,
  className,
}) => {
  const [typedCommand, setTypedCommand] = React.useState("")
  const [currentStepIndex, setCurrentStepIndex] = React.useState(-1)
  const [showFinalMessage, setShowFinalMessage] = React.useState(false)

  // Typewriter effect for the command line
  React.useEffect(() => {
    if (!autoExecute) return

    let cancelled = false
    let timeoutId: number | undefined

    const typeCommand = (index: number) => {
      if (cancelled) return
      if (index > command.length) {
        // Start showing steps after command is fully typed
        startSteps()
        return
      }
      setTypedCommand(command.slice(0, index))
      timeoutId = window.setTimeout(() => typeCommand(index + 1), 60)
    }

    const startSteps = () => {
      setCurrentStepIndex(0)
    }

    typeCommand(0)

    return () => {
      cancelled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExecute, command])

  // Progress through steps and final message
  React.useEffect(() => {
    if (currentStepIndex < 0) return
    if (currentStepIndex >= steps.length) {
      // All steps done
      if (finalMessage) {
        setShowFinalMessage(true)
      }
      if (repeat) {
        const timeoutId = window.setTimeout(() => {
          setTypedCommand("")
          setCurrentStepIndex(-1)
          setShowFinalMessage(false)
        }, stepDelay * 2)
        return () => clearTimeout(timeoutId)
      }
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCurrentStepIndex((prev) => (prev < steps.length ? prev + 1 : prev))
    }, stepDelay)

    return () => clearTimeout(timeoutId)
  }, [currentStepIndex, steps.length, stepDelay, repeat, finalMessage])

  const isDark = variant === "dark"

  return (
    <div
      className={cn(
        "w-full rounded-lg border bg-black/95 text-xs text-green-200 font-mono overflow-hidden",
        isDark ? "border-slate-800 shadow-lg" : "bg-slate-950 border-slate-800",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2 bg-black/80">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        </div>
        <span className="ml-2 text-[11px] text-slate-400">asadbekaidev@narpay:~</span>
      </div>
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center">
          <span className="text-emerald-400 mr-2">$</span>
          <span className="flex items-center">
            {icon}
            <span className="whitespace-pre text-slate-50">{typedCommand}</span>
            <span className="ml-0.5 h-4 w-0.5 bg-emerald-400 animate-pulse" />
          </span>
        </div>

        <div className="mt-2 space-y-1">
          {steps.slice(0, Math.max(0, currentStepIndex)).map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
              <span className="text-emerald-500">›</span>
              <span className="whitespace-pre-wrap">{step}</span>
            </div>
          ))}

          {showFinalMessage && finalMessage && (
            <pre className="mt-3 whitespace-pre-wrap text-[11px] text-emerald-300">
              {finalMessage}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

export default InteractiveTerminal


