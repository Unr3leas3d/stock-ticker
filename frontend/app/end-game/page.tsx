"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Home, Medal, Crown, Loader2 } from "lucide-react"
import Link from "next/link"
import { useGameState } from "@/hooks/useGameState"
import { useRouter } from "next/navigation"
import { StockSymbol } from "@/types/game"

export default function EndGamePage() {
    const { gameState, playerId } = useGameState()
    const router = useRouter()

    useEffect(() => {
        if (!gameState) {
            router.push('/lobby')
        }
    }, [gameState, router])

    if (!gameState) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Calculate final net worth for all players
    const finalPlayers = Object.values(gameState.players).map(player => {
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
    }).sort((a, b) => b.netWorth - a.netWorth)

    const winner = finalPlayers[0]

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 py-12">
            <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 my-auto">
                {/* Winner Header */}
                <div className="text-center space-y-4">
                    <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center shadow-inner mb-6 relative">
                        <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full animate-pulse" />
                        <Crown className="h-12 w-12 text-yellow-600 relative z-10" />
                    </div>
                    <h1 className="text-5xl font-black tracking-tight text-slate-900 uppercase">Game Over</h1>
                    <p className="text-xl text-slate-500 font-medium tracking-wide">
                        <span className="text-primary font-bold">{winner?.name}</span> dominates the market!
                    </p>
                </div>

                <Card className="border-primary/10 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

                    <CardHeader className="bg-muted/30 border-b pb-6">
                        <CardTitle className="text-2xl flex items-center gap-2 justify-center">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                            Final Standings
                        </CardTitle>
                        <CardDescription className="text-center">Great Game Everyone!</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y relative z-10 bg-card rounded-b-lg">
                            {finalPlayers.map((player, index) => (
                                <div
                                    key={player.id}
                                    className={`flex items-center justify-between p-6 transition-colors ${index === 0 ? 'bg-yellow-500/10' :
                                        player.id === playerId ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 flex justify-center text-muted-foreground font-bold">
                                            {index === 0 ? <Crown className="h-6 w-6 text-yellow-600 drop-shadow-sm" /> :
                                                index === 1 ? <Medal className="h-6 w-6 text-slate-400 drop-shadow-sm" /> :
                                                    index === 2 ? <Medal className="h-6 w-6 text-amber-700 drop-shadow-sm" /> :
                                                        <span className="text-lg opacity-50">#{index + 1}</span>}
                                        </div>

                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <p className={`text-lg font-bold leading-none ${player.id === playerId ? 'text-primary' : index === 0 ? 'text-yellow-700' : ''}`}>
                                                    {player.name}
                                                </p>
                                            </div>
                                            {player.id === playerId && (
                                                <p className="text-[10px] text-muted-foreground mt-1 tracking-wider uppercase font-bold">You</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <p className={`text-2xl font-black tabular-nums tracking-tight ${index === 0 ? 'text-yellow-700' : ''}`}>
                                            ${player.netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Final Net Worth</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/10 border-t p-6 flex justify-center">
                        <div className="flex flex-col gap-4 w-full">
                            <Button size="lg" variant="outline" className="w-full text-base h-12" onClick={() => window.location.href = '/'}>
                                Play Again
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
