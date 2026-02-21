import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, HandCoins } from "lucide-react"

interface PlayerData {
    name: string
    cash: number
    netWorth: number
    portfolio: Record<string, number>
    isSelf?: boolean
    hasUsedLoan?: boolean
    isReady?: boolean
}

interface PlayerLedgerCardProps {
    player: PlayerData
    onRequestLoan?: () => void
}

export function PlayerLedgerCard({ player, onRequestLoan }: PlayerLedgerCardProps) {
    const loanDisabled = player.hasUsedLoan || player.isReady;
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold">{player.name}</CardTitle>
                        <CardDescription>{player.isSelf ? "Your Ledger" : "Player Ledger"}</CardDescription>
                    </div>
                    {player.hasUsedLoan && (
                        <div className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded border border-amber-200 uppercase tracking-tighter shadow-sm">
                            Loan Taken
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <HandCoins className="h-4 w-4" /> Available Cash
                    </p>
                    <p className="text-3xl font-bold text-green-500">${player.cash.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> Net Worth (Est.)
                    </p>
                    <p className="text-xl font-bold">${player.netWorth.toFixed(2)}</p>
                </div>

                <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium">Portfolio</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(player.portfolio).map(([stock, amount]) => (
                            amount > 0 && (
                                <div key={stock} className="flex justify-between p-2 rounded-md bg-muted/50 border">
                                    <span className="font-medium">{stock}</span>
                                    <span>{amount}</span>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
