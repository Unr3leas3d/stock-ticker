import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, HandCoins } from "lucide-react"

interface PlayerData {
    name: string
    cash: number
    netWorth: number
    portfolio: Record<string, number>
    avgBuyPrices: Record<string, number>
    isSelf?: boolean
    hasUsedLoan?: boolean
    isReady?: boolean
}

interface PlayerLedgerCardProps {
    player: PlayerData
    market?: Record<string, { currentValue: number }>
}

export function PlayerLedgerCard({ player, market }: PlayerLedgerCardProps) {
    const loanDisabled = player.hasUsedLoan || player.isReady;
    return (
        <Card className="flex flex-col min-h-[50vh]">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold">{player.name}</CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold tracking-wider">{player.isSelf ? "Your Ledger" : "Player Ledger"}</CardDescription>
                    </div>
                    {player.hasUsedLoan && (
                        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 uppercase tracking-tighter shadow-sm">
                            Loan Taken
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
                <div className="flex justify-between items-end border-b pb-4">
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <HandCoins className="h-3 w-3" /> Cash
                        </p>
                        <p className="text-2xl font-black text-green-500 tracking-tight">${player.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="space-y-0.5 text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 justify-end">
                            <Briefcase className="h-3 w-3" /> Net Worth
                        </p>
                        <p className="text-xl font-bold tracking-tight">
                            ${(player.netWorth - (player.hasUsedLoan ? 1500 : 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="space-y-2 pr-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Portfolio Performance</p>
                    <div className="space-y-2">
                        {Object.entries(player.portfolio).map(([stock, amount]) => {
                            if (amount <= 0) return null;
                            const avgPrice = player.avgBuyPrices[stock] || 0;
                            const currentPrice = market?.[stock]?.currentValue || 0;
                            const isProfitable = currentPrice >= avgPrice;
                            const plAmount = (currentPrice - avgPrice) * amount;
                            const plPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice * 100) : 0;

                            return (
                                <div key={stock} className="group p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm uppercase tracking-tight">{stock}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium">{amount.toLocaleString()} Shares</span>
                                        </div>
                                        <div className="text-right flex flex-col">
                                            <span className={`text-xs font-black ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                                                {isProfitable ? '+' : ''}${Math.abs(plAmount).toFixed(2)}
                                            </span>
                                            <span className={`text-[9px] font-bold ${isProfitable ? 'text-green-600/70' : 'text-red-600/70'}`}>
                                                {isProfitable ? '+' : ''}{plPercent.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/60 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                                        <span>Avg: ${avgPrice.toFixed(2)}</span>
                                        <span>Mkt: ${currentPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
