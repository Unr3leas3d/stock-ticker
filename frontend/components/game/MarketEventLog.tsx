"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History } from "lucide-react"
import { useGameState } from "@/hooks/useGameState"

export function MarketEventLog() {
    const { gameState } = useGameState()

    // Get log from state, fallback to empty
    const tickerLog = gameState?.tickerLog || []

    const getColorForEvent = (log: string) => {
        const lowerLog = log.toLowerCase()
        if (lowerLog.includes('up') || lowerLog.includes('bought') || lowerLog.includes('surge') || lowerLog.includes('profit')) {
            return 'text-green-600 dark:text-green-400'
        }
        if (lowerLog.includes('down') || lowerLog.includes('sold') || lowerLog.includes('plummet') || lowerLog.includes('bankrupt')) {
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
        if (lowerLog.includes('down') || lowerLog.includes('sold') || lowerLog.includes('plummet') || lowerLog.includes('bankrupt')) {
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
        <Card className="w-full">
            <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <History className="h-4 w-4" /> Market Event Log
                </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
                <ScrollArea className="h-32 w-full pr-4">
                    <div className="space-y-3">
                        {tickerLog.length === 0 ? (
                            <div className="text-xs text-muted-foreground italic p-2">
                                Waiting for market activity...
                            </div>
                        ) : [...tickerLog].reverse().map((log, index) => (
                            <div key={index} className="flex gap-4 items-start text-sm pb-2 border-b last:border-0 relative">
                                <span className={`relative flex h-2 w-2 mt-1 flex-none rounded-full ${getDotColorForEvent(log)}`} />
                                <p className={`leading-relaxed font-medium ${getColorForEvent(log)}`}>{log}</p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
