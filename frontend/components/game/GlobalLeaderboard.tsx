"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Crown, Medal } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { PlayerLedgerCard } from "@/components/game/PlayerLedgerCard"
import { useGameState } from "@/hooks/useGameState"
import { StockSymbol } from "@/types/game"

export function GlobalLeaderboard() {
    const { gameState, playerId } = useGameState()

    if (!gameState) return null

    // Calculate net worth for all players based on current market prices
    const playersWithNetWorth = Object.values(gameState.players).map(player => {
        let portfolioValue = 0
        Object.entries(player.portfolio).forEach(([symbol, quantity]) => {
            const stockData = gameState.market[symbol as StockSymbol]
            if (stockData) {
                portfolioValue += stockData.currentValue * quantity
            }
        })

        return {
            ...player,
            netWorth: player.cash + portfolioValue
        }
    })

    // Sort by net worth descending
    const sortedPlayers = [...playersWithNetWorth].sort((a, b) => b.netWorth - a.netWorth)

    return (
        <Card className="flex flex-col border-primary/10 shadow-md relative min-h-[50vh]">
            {/* Subtle Gradient Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="px-4 py-3 border-b bg-muted/20">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Global Leaderboard
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="divide-y text-sm">
                    {sortedPlayers.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground italic">
                            No players in game.
                        </div>
                    ) : sortedPlayers.map((player, index) => (
                        <Dialog key={player.id}>
                            <DialogTrigger asChild>
                                <div
                                    className={`flex items-center justify-between p-4 transition-colors hover:bg-muted/50 cursor-pointer ${player.id === playerId ? 'bg-primary/5' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Rank Indicator */}
                                        <div className="w-6 flex justify-center text-muted-foreground font-bold">
                                            {index === 0 ? <Crown className="h-5 w-5 text-yellow-500" /> :
                                                index === 1 ? <Medal className="h-5 w-5 text-slate-400" /> :
                                                    index === 2 ? <Medal className="h-5 w-5 text-amber-700" /> :
                                                        `#${index + 1}`}
                                        </div>

                                        <div className="flex flex-col pl-1">
                                            <div className="flex items-center gap-2">
                                                <p className={`text-sm font-semibold leading-none ${player.id === playerId ? 'text-primary' : ''}`}>
                                                    {player.name}
                                                </p>
                                                <span
                                                    className={`h-2.5 w-2.5 rounded-full ${player.connectionStatus === 'ONLINE' ? 'bg-green-500' : 'bg-slate-300'}`}
                                                    title={player.connectionStatus === 'ONLINE' ? "Online" : "Offline"}
                                                />
                                            </div>
                                            {player.id === playerId && (
                                                <p className="text-[10px] text-muted-foreground mt-1 tracking-wider uppercase">You</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5">
                                        <p className="text-base font-bold tabular-nums tracking-tight">
                                            ${player.netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        {player.isReady ? (
                                            <div className="flex items-center gap-1 bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase">
                                                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                Ready
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase">
                                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                Wait
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md p-0 border-none bg-transparent shadow-none">
                                <DialogTitle className="sr-only">{player.name}'s Ledger</DialogTitle>
                                <PlayerLedgerCard
                                    player={{ ...player, isSelf: player.id === playerId }}
                                    market={gameState.market}
                                />
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
