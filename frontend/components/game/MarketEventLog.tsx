"use client"

import React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, X } from "lucide-react"
import { useGameState } from "@/hooks/useGameState"
import { Button } from "@/components/ui/button"

interface MarketEventLogProps {
    onClose?: () => void;
}

export function MarketEventLog({ onClose }: MarketEventLogProps) {
    const { gameState } = useGameState()

    // Get log from state, fallback to empty
    const tickerLog = gameState?.tickerLog || []

    const getColorForEvent = (log: string) => {
        const lowerLog = log.toLowerCase()
        if (lowerLog.includes('up') || lowerLog.includes('bought') || lowerLog.includes('surge') || lowerLog.includes('profit')) {
            return 'text-green-600 dark:text-green-400'
        }
        if (lowerLog.includes('down') || lowerLog.includes('sold') || lowerLog.includes('plummet') || lowerLog.includes('bankrupt') || lowerLog.includes('loss')) {
            return 'text-red-600 dark:text-red-400'
        }
        if (lowerLog.includes('split')) {
            return 'text-blue-600 dark:text-blue-400'
        }
        if (lowerLog.includes('dividend')) {
            return 'text-yellow-600 dark:text-yellow-400'
        }
        return 'text-foreground opacity-80'
    }

    const getDotColorForEvent = (log: string) => {
        const lowerLog = log.toLowerCase()
        if (lowerLog.includes('up') || lowerLog.includes('bought') || lowerLog.includes('surge') || lowerLog.includes('profit')) {
            return 'bg-green-500'
        }
        if (lowerLog.includes('down') || lowerLog.includes('sold') || lowerLog.includes('plummet') || lowerLog.includes('bankrupt') || lowerLog.includes('loss')) {
            return 'bg-red-500'
        }
        if (lowerLog.includes('split')) {
            return 'bg-blue-500'
        }
        if (lowerLog.includes('dividend')) {
            return 'bg-yellow-500'
        }
        return 'bg-primary'
    }

    return (
        <div className="flex flex-col h-full w-full bg-background border-l border-border shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                    <History className="h-5 w-5 text-primary" /> Market Event Log
                </h2>
                {onClose && (
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full w-full px-6 py-4">
                    <div className="space-y-5 pb-8">
                        {tickerLog.length === 0 ? (
                            <div className="text-sm text-muted-foreground italic text-center mt-10">
                                Waiting for market activity...
                            </div>
                        ) : [...tickerLog].reverse().map((log, index) => (
                            <div key={index} className="flex gap-4 items-start text-sm pb-4 border-b border-border last:border-0 relative hover:bg-muted/50 p-2 rounded-lg transition-colors">
                                <span className={`relative flex h-2.5 w-2.5 mt-1.5 flex-none rounded-full shadow-sm ${getDotColorForEvent(log)}`} />
                                <p className={`leading-relaxed font-semibold text-[15px] ${getColorForEvent(log)}`}>{log}</p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
