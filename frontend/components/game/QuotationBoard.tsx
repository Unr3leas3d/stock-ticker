"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, Coins, Droplet, Factory, Landmark, Wheat } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGameState } from "@/hooks/useGameState"
import { StockSymbol } from "@/types/game"

const getStockIcon = (symbol: string) => {
    switch (symbol) {
        case 'Gold': return <Coins className="h-4 w-4 text-yellow-500" />
        case 'Silver': return <Coins className="h-4 w-4 text-slate-400" />
        case 'Oil': return <Droplet className="h-4 w-4 text-stone-700 dark:text-stone-300" />
        case 'Industrial': return <Factory className="h-4 w-4 text-orange-500" />
        case 'Bonds': return <Landmark className="h-4 w-4 text-blue-500" />
        case 'Grain': return <Wheat className="h-4 w-4 text-amber-500" />
        default: return <Coins className="h-4 w-4 text-slate-500" />
    }
}

// Custom Sparkline component using SVG
function Sparkline({ data, color }: { data: number[], color: string }) {
    if (data.length < 2) return <div className="h-8 w-full" />;

    const min = Math.min(...data, 0.5);
    const max = Math.max(...data, 2.0);
    const range = max - min || 1;
    const width = 100;
    const height = 30;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8 overflow-visible">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="transition-all duration-500"
            />
        </svg>
    );
}

export function QuotationBoard() {
    const { gameState } = useGameState()

    if (!gameState) return null

    const marketEntries = Object.entries(gameState.market)

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {marketEntries.map(([symbol, stock]) => {
                    // Determine trend from history
                    let trend: 'up' | 'down' | 'flat' = 'flat'
                    if (stock.history.length >= 2) {
                        const last = stock.history[stock.history.length - 1]
                        const prev = stock.history[stock.history.length - 2]
                        if (last > prev) trend = 'up'
                        else if (last < prev) trend = 'down'
                    }

                    const trendColor = trend === 'up' ? "rgb(34, 197, 94)" : trend === 'down' ? "rgb(239, 68, 68)" : "rgb(156, 163, 175)"

                    return (
                        <Card key={symbol} className={cn(
                            "relative overflow-hidden transition-all duration-300 hover:shadow-md border-primary/10",
                            stock.status === 'BANKRUPT' && "opacity-60 grayscale",
                            stock.status === 'PENDING_SPLIT' && "border-green-500 shadow-sm shadow-green-500/20"
                        )}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-wider opacity-70">
                                    {getStockIcon(symbol)}
                                    {symbol}
                                </CardTitle>
                                {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500 animate-pulse" />}
                                {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500 animate-pulse" />}
                            </CardHeader>
                            <CardContent className="pb-2">
                                <div className="text-xl font-black tracking-tight mb-3">
                                    ${stock.currentValue.toFixed(2)}
                                </div>

                                <div className="mt-2 opacity-80">
                                    <Sparkline data={stock.history} color={trendColor} />
                                </div>

                                {stock.status !== 'NORMAL' && (
                                    <div className="mt-3">
                                        <Badge variant={stock.status === 'BANKRUPT' ? "destructive" : "default"} className="text-[9px] w-full justify-center font-bold h-5">
                                            {stock.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                )}
                            </CardContent>

                            {/* Background Accent based on status */}
                            {stock.status === 'BANKRUPT' && <div className="absolute inset-0 bg-red-500/5 z-[-1]" />}
                            {stock.status === 'PENDING_SPLIT' && <div className="absolute inset-0 bg-green-500/5 z-[-1]" />}
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
