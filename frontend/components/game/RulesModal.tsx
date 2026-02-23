"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { BookOpen, TrendingUp, Zap, Coins, Landmark, AlertTriangle } from "lucide-react"

export function RulesModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700 h-[36px] rounded-full px-4 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-xs uppercase tracking-wider">
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">How to Play</span>
                    <span className="sm:hidden">Rules</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] w-[95vw] h-[90dvh] p-0 flex flex-col border-none shadow-2xl overflow-hidden">
                <div className="bg-primary p-6 text-primary-foreground shrink-0 overflow-hidden relative">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-black/10 rounded-full blur-3xl" />

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            Game Rules
                        </DialogTitle>
                        <DialogDescription className="text-primary-foreground/70 font-medium">
                            Master the market and build your empire in Stock Ticker.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 min-h-0 relative flex flex-col">
                    <ScrollArea className="h-full w-full dark:bg-slate-900 bg-white">
                        <div className="p-6 space-y-8 pb-10">
                            {/* Section: Objective */}
                            <section className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Landmark className="h-5 w-5 text-primary" />
                                    <h3 className="font-bold text-lg uppercase tracking-tight">The Objective</h3>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                    The goal of Stock Ticker is to accumulate the highest <strong className="text-foreground">Net Worth</strong> by the end of the game. Your Net Worth is the sum of your <strong className="text-foreground">Cash</strong> and the current market value of your <strong className="text-foreground">Stock Portfolio</strong> (minus any outstanding debts).
                                </p>
                            </section>

                            {/* Section: Market Mechanics */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    <h3 className="font-bold text-lg uppercase tracking-tight">Market Mechanics</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50 space-y-2">
                                        <Badge className="bg-green-500 hover:bg-green-600">UP</Badge>
                                        <p className="text-xs font-semibold">Stock price increases by the rolled amount (5, 10, or 20 cents).</p>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50 space-y-2">
                                        <Badge variant="destructive">DOWN</Badge>
                                        <p className="text-xs font-semibold">Stock price decreases by the rolled amount. Prices cannot go below $0.00.</p>
                                    </div>
                                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50 space-y-2">
                                        <Badge className="bg-blue-500 hover:bg-blue-600">DIVIDEND</Badge>
                                        <p className="text-xs font-semibold">Pays cash to all owners. Only values <strong className="text-foreground">&gt; $1.00</strong> pay out.</p>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Splits & Bankruptcies */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-yellow-500" />
                                    <h3 className="font-bold text-lg uppercase tracking-tight">Market Events</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex gap-4 items-start p-4 rounded-xl border border-yellow-200/50 bg-yellow-50/30 dark:bg-yellow-900/10 shadow-sm">
                                        <div className="bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded-lg text-yellow-700 dark:text-yellow-400">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm uppercase">Stock Split ($2.00)</h4>
                                            <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">When a stock hits <strong className="text-foreground">$2.00</strong>, it splits! Your share count <strong className="text-foreground">doubles</strong>, and the price resets to <strong className="text-foreground">$1.00</strong>. This is how you grow big portfolios quickly.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start p-4 rounded-xl border border-red-200/50 bg-red-50/30 dark:bg-red-900/10 shadow-sm">
                                        <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-lg text-red-700 dark:text-red-400">
                                            <AlertTriangle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm uppercase">Bankruptcy ($0.00)</h4>
                                            <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">If a stock drops to <strong className="text-foreground">$0.00</strong>, it goes bankrupt. All shares of that stock are <strong className="text-foreground">wiped out</strong> (set to 0), and the price resets to <strong className="text-foreground">$1.00</strong>.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Finance */}
                            <section className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Coins className="h-5 w-5 text-amber-600" />
                                    <h3 className="font-bold text-lg uppercase tracking-tight">Finance & Trading</h3>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        </div>
                                        <p className="text-sm text-muted-foreground"><strong className="text-foreground">Open Market:</strong> Trading only occurs during the Open Market phase (determined by the Trading Interval setting).</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        </div>
                                        <p className="text-sm text-muted-foreground"><strong className="text-foreground">Emergency Loan:</strong> If you are completely bankrupt ($0 cash and no sellable assets), you can request a one-time <strong className="text-foreground">$1,000 loan</strong>. Note that <strong className="text-foreground">$1,500</strong> ($1,000 principal + $500 interest) will be deducted from your final Net Worth.</p>
                                    </li>
                                </ul>
                            </section>
                        </div>
                    </ScrollArea>
                </div>

                <div className="p-6 shrink-0 border-t bg-slate-50 dark:bg-slate-800/30">
                    <Button onClick={() => document.querySelector('[data-slot="dialog-close"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))} className="w-full h-12 font-bold uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all">
                        Got it, Let's Play!
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
