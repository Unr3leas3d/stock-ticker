"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Trophy, Coins, Dice5, History, Briefcase, HandCoins, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { GlobalLeaderboard } from "@/components/game/GlobalLeaderboard"
import { PlayerLedgerCard } from "@/components/game/PlayerLedgerCard"
import { DiceAnimation } from "./DiceAnimation"
import { useGameState } from "@/hooks/useGameState"
import { StockSymbol, TradeType } from "@/types/game"

export function ActionCenter() {
    const { gameState, selfPlayer, actions, playerId, currentRoomId } = useGameState()
    const [tradeAmount, setTradeAmount] = useState(0)
    const [selectedStock, setSelectedStock] = useState<StockSymbol>("Gold")

    if (!gameState || !selfPlayer) return null

    const currentPhase = gameState.currentPhase
    const activePlayersArray = Object.values(gameState.players)
    const currentPlayer = activePlayersArray[gameState.currentPlayerIndex % activePlayersArray.length]
    const isMyTurn = currentPlayer?.id === playerId

    // Calculate net worth for the ledger card
    let portfolioValue = 0
    Object.entries(selfPlayer.portfolio).forEach(([symbol, quantity]) => {
        const stockData = gameState.market[symbol as StockSymbol]
        if (stockData) {
            portfolioValue += stockData.currentValue * quantity
        }
    })
    const myNetWorth = selfPlayer.cash + portfolioValue

    const handleTrade = (type: TradeType) => {
        actions.executeTrade(type, selectedStock, tradeAmount)
        setTradeAmount(0)
    }

    const handleRoll = () => {
        actions.rollDice()
    }

    const handleReady = () => {
        actions.setReady()
    }

    // Determine if trading is allowed
    const canTrade = currentPhase === 'OPEN_MARKET' || currentPhase === 'INITIAL_BUY_IN'

    // Determine bankruptcy for loan availability
    const hasSellableStocks = Object.entries(selfPlayer.portfolio).some(([sym, qty]) => {
        return qty > 0 && (gameState.market[sym as StockSymbol]?.currentValue || 0) > 0
    })
    const isActuallyBankrupt = selfPlayer.cash <= 0 && !hasSellableStocks

    // Determine the phase message
    const getPhaseMessage = () => {
        switch (currentPhase) {
            case 'LOBBY': return "Waiting for players to join..."
            case 'INITIAL_BUY_IN': return "Initial Investment Phase"
            case 'ROLLING': return isMyTurn ? "Your turn to roll!" : `Waiting for ${currentPlayer?.name} to roll...`
            case 'RESOLVING_ROLL': return "Market processing result..."
            case 'PAYING_DIVIDENDS': return "Distributing dividends..."
            case 'STOCK_EVENT_PHASE': return "Market Event Triggered!"
            case 'OPEN_MARKET': return "Trading Floor is OPEN!"
            case 'END_GAME': return "Game Over - Final Standings"
            default: return currentPhase
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 w-full pr-2">

            {/* Player Ledger */}
            <div className="md:col-span-4 lg:col-span-3">
                <PlayerLedgerCard
                    player={{ ...selfPlayer, netWorth: myNetWorth, isSelf: true }}
                    market={gameState.market}
                    onRequestLoan={actions.requestLoan}
                />
            </div>

            {/* Trading Desk & Phase Controls */}
            <div className="md:col-span-4 lg:col-span-6 flex flex-col gap-6">

                {/* Phase Action Bar */}
                <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
                    <CardHeader className="py-4 relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <p className="text-sm font-medium opacity-80">Current Phase</p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none text-[10px] font-bold">
                                            ROOM: {currentRoomId}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-primary-foreground/10 text-primary-foreground border-none text-[10px] font-bold">
                                            ROUND: {gameState.completedRounds + 1} / {gameState.settings.maxRounds}
                                        </Badge>
                                        {(currentPhase === 'ROLLING' || currentPhase === 'OPEN_MARKET') && (
                                            <div className="hidden sm:flex items-center gap-1.5 bg-black/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                <span className="relative flex h-2 w-2 flex-none rounded-full bg-green-400 animate-pulse" />
                                                Live
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-end justify-between mt-1">
                                    <CardTitle className="text-xl uppercase tracking-wider">{getPhaseMessage()}</CardTitle>
                                    {gameState.lastRoll && currentPhase !== 'RESOLVING_ROLL' && (
                                        <div className="flex items-center gap-2 bg-black/10 px-3 py-1 rounded-md border border-white/5">
                                            <span className="text-[10px] uppercase font-black opacity-60">Last Roll</span>
                                            <span className="text-xs font-bold tracking-tight">
                                                {gameState.lastRoll.stock} {gameState.lastRoll.direction} {gameState.lastRoll.amount}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {gameState.marketTimer > 0 && (
                                <div className="text-right">
                                    <p className="text-2xl font-bold tabular-nums">{gameState.marketTimer}s</p>
                                    <p className="text-xs opacity-80 uppercase tracking-tighter">Market Timer</p>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    {currentPhase === 'OPEN_MARKET' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                            <Progress value={(gameState.marketTimer / 60) * 100} className="h-full rounded-none bg-transparent" indicatorClassName="bg-white" />
                        </div>
                    )}
                </Card>

                {/* Main Interaction Area */}
                <div className="flex-1 flex flex-col">
                    {currentPhase === 'ROLLING' || currentPhase === 'RESOLVING_ROLL' ? (
                        <Card className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center overflow-hidden relative border-primary/20 shadow-lg min-h-[300px]">
                            {/* Decorative background gradients */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

                            <div className="relative z-10 w-full max-w-2xl flex flex-col items-center space-y-4">
                                {currentPhase === 'RESOLVING_ROLL' ? (
                                    <DiceAnimation rollResult={gameState.lastRoll || null} />
                                ) : (
                                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-8 ring-primary/5">
                                        {isMyTurn ? (
                                            <Dice5 className="h-12 w-12 text-primary" strokeWidth={1.5} />
                                        ) : (
                                            <Loader2 className="h-12 w-12 text-primary animate-spin" strokeWidth={1.5} />
                                        )}
                                    </div>
                                )}

                                <div className="space-y-3 w-full">
                                    <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                                        {currentPhase === 'RESOLVING_ROLL' ? "Dice are Rolling..." : isMyTurn ? "Your turn to roll!" : "Waiting for Roll"}
                                    </h3>
                                    <p className="text-muted-foreground text-base sm:text-lg px-4">
                                        {currentPhase === 'RESOLVING_ROLL' ? "The dealer is shaking the cup. Watch the market board!" : isMyTurn ? "Roll the action, quantity, and stock dice to influence the market." : `Please wait for ${currentPlayer?.name} to complete their turn.`}
                                    </p>
                                </div>
                                {isMyTurn && currentPhase === 'ROLLING' && (
                                    <Button onClick={handleRoll} size="lg" className="w-full sm:w-72 h-16 text-xl rounded-2xl shadow-xl transition-all hover:scale-105 group font-bold">
                                        <Dice5 className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                                        Roll Dice Now
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ) : (
                        <Card className="flex-1 flex flex-col">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Coins className="h-5 w-5" /> Trading Desk
                                        </CardTitle>
                                        <CardDescription>
                                            {canTrade ? "Execute trades based on current market prices." : "Trading is closed during this phase."}
                                        </CardDescription>
                                    </div>
                                    {canTrade && (
                                        <Button
                                            onClick={handleReady}
                                            variant={selfPlayer.isReady ? "default" : "outline"}
                                            className={selfPlayer.isReady ? "bg-green-600" : ""}
                                            disabled={selfPlayer.isReady && currentPhase !== 'OPEN_MARKET' && currentPhase !== 'INITIAL_BUY_IN'}
                                        >
                                            {selfPlayer.isReady ? "Ready ✓" : "End Turn"}
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <Tabs defaultValue="buy" className="w-full opacity-100 transition-opacity">
                                    <TabsList className={`grid w-full grid-cols-2 mb-6 ${(!canTrade || selfPlayer.isReady) && "opacity-50 grayscale pointer-events-none"}`}>
                                        <TabsTrigger value="buy">Buy Shares</TabsTrigger>
                                        <TabsTrigger value="sell">Sell Shares</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="buy" className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium leading-none">Select Stock</label>
                                            <Select value={selectedStock} onValueChange={(v) => setSelectedStock(v as StockSymbol)} disabled={!canTrade || selfPlayer.isReady}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a stock" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(gameState.market).map(([sym, data]) => (
                                                        <SelectItem key={sym} value={sym} disabled={data.status === 'BANKRUPT'}>
                                                            {sym} (${data.currentValue.toFixed(2)})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3 pt-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium leading-none">Quantity</label>
                                                {selfPlayer.cash < (gameState.market[selectedStock]?.currentValue * tradeAmount) && (
                                                    <span className="text-[10px] text-red-500 font-bold uppercase">Insufficient Cash</span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        value={tradeAmount}
                                                        onChange={(e) => setTradeAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                                        className="text-lg font-bold h-11"
                                                        disabled={!canTrade || selfPlayer.isReady}
                                                    />
                                                    <div className="flex gap-1.5 w-[140px] shrink-0">
                                                        <Button
                                                            variant="outline"
                                                            className="h-11 flex-1 text-[10px] font-bold uppercase tracking-wider bg-green-50 hover:bg-green-100 hover:text-green-700 text-green-600 border-green-200"
                                                            onClick={() => {
                                                                const price = gameState.market[selectedStock]?.currentValue;
                                                                if (price > 0) {
                                                                    setTradeAmount(Math.floor(selfPlayer.cash / price));
                                                                }
                                                            }}
                                                            disabled={!canTrade || selfPlayer.isReady || (gameState.market[selectedStock]?.currentValue || 0) <= 0}
                                                        >
                                                            Max
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="h-11 px-3 text-xs font-bold font-mono text-muted-foreground shrink-0"
                                                            onClick={() => setTradeAmount(0)}
                                                            disabled={!canTrade || selfPlayer.isReady}
                                                        >
                                                            CLR
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {[100, 500, 1000, 2000, 5000].map(val => (
                                                        <Button
                                                            key={`buy-${val}`}
                                                            variant="secondary"
                                                            size="sm"
                                                            className="flex-1 h-8 text-[11px] font-bold tracking-tight bg-slate-100 hover:bg-slate-200 text-slate-700"
                                                            onClick={() => setTradeAmount(prev => prev + val)}
                                                            disabled={!canTrade || selfPlayer.isReady}
                                                        >
                                                            +{val}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground text-right font-medium">
                                                Estimated Cost: <span className="text-foreground">${(gameState.market[selectedStock]?.currentValue * tradeAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-slate-100">
                                            {gameState.settings.enableLoans && (
                                                <Button
                                                    variant={selfPlayer.hasUsedLoan ? "secondary" : "outline"}
                                                    size="sm"
                                                    onClick={() => actions.requestLoan()}
                                                    disabled={selfPlayer.hasUsedLoan || selfPlayer.isReady || !isActuallyBankrupt}
                                                    className={`w-full text-[10px] font-black uppercase tracking-widest h-9 border-dashed ${!isActuallyBankrupt && !selfPlayer.hasUsedLoan ? 'opacity-50' : ''}`}
                                                >
                                                    {selfPlayer.hasUsedLoan ? "Emergency Loan Used" : isActuallyBankrupt ? "Request Emergency Loan ($1000)" : "Loan Unavailable (Must be bankrupt)"}
                                                </Button>
                                            )}

                                            <Button
                                                className="w-full font-bold h-12"
                                                disabled={!canTrade || selfPlayer.isReady || (selfPlayer.cash < (gameState.market[selectedStock]?.currentValue * tradeAmount))}
                                                onClick={() => handleTrade('BUY')}
                                            >
                                                Execute Buy Order
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="sell" className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium leading-none">Select Stock to Sell</label>
                                            <Select value={selectedStock} onValueChange={(v) => setSelectedStock(v as StockSymbol)} disabled={!canTrade || selfPlayer.isReady}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a stock" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(selfPlayer.portfolio).map(([sym, qty]) => (
                                                        <SelectItem key={sym} value={sym} disabled={qty === 0}>
                                                            {sym} (Own: {qty})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3 pt-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium leading-none">Quantity</label>
                                                {(selfPlayer.portfolio[selectedStock] || 0) < tradeAmount && (
                                                    <span className="text-[10px] text-red-500 font-bold uppercase">Not enough shares</span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        value={tradeAmount}
                                                        onChange={(e) => setTradeAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                                        className="text-lg font-bold h-11"
                                                        disabled={!canTrade || selfPlayer.isReady}
                                                    />
                                                    <div className="flex gap-1.5 w-[140px] shrink-0">
                                                        <Button
                                                            variant="outline"
                                                            className="h-11 flex-1 text-[10px] font-bold uppercase tracking-wider bg-red-50 hover:bg-red-100 hover:text-red-700 text-red-600 border-red-200"
                                                            onClick={() => setTradeAmount(selfPlayer.portfolio[selectedStock] || 0)}
                                                            disabled={!canTrade || selfPlayer.isReady}
                                                        >
                                                            All
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="h-11 px-3 text-xs font-bold font-mono text-muted-foreground shrink-0"
                                                            onClick={() => setTradeAmount(0)}
                                                            disabled={!canTrade || selfPlayer.isReady}
                                                        >
                                                            CLR
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {[100, 500, 1000, 2000, 5000].map(val => (
                                                        <Button
                                                            key={`sell-${val}`}
                                                            variant="secondary"
                                                            size="sm"
                                                            className="flex-1 h-8 text-[11px] font-bold tracking-tight bg-slate-100 hover:bg-slate-200 text-slate-700"
                                                            onClick={() => setTradeAmount(prev => prev + val)}
                                                            disabled={!canTrade || selfPlayer.isReady}
                                                        >
                                                            +{val}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    Estimated Credit: <span className="text-foreground">${(gameState.market[selectedStock]?.currentValue * tradeAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </p>
                                                {tradeAmount > 0 && selfPlayer.avgBuyPrices[selectedStock] > 0 && (
                                                    <p className={`text-[10px] font-bold uppercase tracking-tight ${gameState.market[selectedStock].currentValue >= selfPlayer.avgBuyPrices[selectedStock] ? 'text-green-500' : 'text-red-500'}`}>
                                                        Est. {gameState.market[selectedStock].currentValue >= selfPlayer.avgBuyPrices[selectedStock] ? 'Profit' : 'Loss'}:
                                                        ${Math.abs((gameState.market[selectedStock].currentValue - selfPlayer.avgBuyPrices[selectedStock]) * tradeAmount).toFixed(2)}
                                                        ({((gameState.market[selectedStock].currentValue - selfPlayer.avgBuyPrices[selectedStock]) / selfPlayer.avgBuyPrices[selectedStock] * 100).toFixed(1)}%)
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="w-full font-bold border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white h-12 mt-4"
                                            disabled={!canTrade || selfPlayer.isReady || (selfPlayer.portfolio[selectedStock] || 0) < tradeAmount}
                                            onClick={() => handleTrade('SELL')}
                                        >
                                            Execute Sell Order
                                        </Button>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Leaderboard */}
            <div className="md:col-span-4 lg:col-span-3 flex flex-col">
                <GlobalLeaderboard />
            </div>

        </div>
    )
}
