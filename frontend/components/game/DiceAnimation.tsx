"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RollResult, StockSymbol } from '@/types/game'
import { TrendingUp, TrendingDown, Coins, HelpCircle } from 'lucide-react'

interface DiceAnimationProps {
    rollResult: RollResult | null
    onComplete?: () => void
}

const STOCK_COLORS: Record<StockSymbol, string> = {
    'Gold': 'bg-yellow-500',
    'Silver': 'bg-slate-300',
    'Oil': 'bg-neutral-800',
    'Industrial': 'bg-blue-600',
    'Bonds': 'bg-indigo-600',
    'Grain': 'bg-amber-600'
}

export const DiceAnimation: React.FC<DiceAnimationProps> = ({ rollResult, onComplete }) => {
    const [visibleDice, setVisibleDice] = useState({ stock: false, amount: false, direction: false })
    const [displayValues, setDisplayValues] = useState<Partial<RollResult>>({})

    const stocks: StockSymbol[] = ["Gold", "Silver", "Oil", "Industrial", "Bonds", "Grain"]
    const amounts = [5, 10, 20]
    const directions: Array<'UP' | 'DOWN' | 'DIVIDEND'> = ["UP", "DOWN", "DIVIDEND"]

    useEffect(() => {
        if (!rollResult) return

        setVisibleDice({ stock: false, amount: false, direction: false })

        const timers: any[] = []

        // 1. Amount Die Sequence (Reveal first)
        const amountInterval = setInterval(() => {
            setDisplayValues(prev => ({ ...prev, amount: amounts[Math.floor(Math.random() * amounts.length)] }))
        }, 100)
        timers.push(amountInterval)

        timers.push(setTimeout(() => {
            clearInterval(amountInterval)
            setDisplayValues(prev => ({ ...prev, amount: rollResult.amount }))
            setVisibleDice(prev => ({ ...prev, amount: true }))
        }, 800))

        // 2. Action Die Sequence (Reveal second)
        timers.push(setTimeout(() => {
            const directionInterval = setInterval(() => {
                setDisplayValues(prev => ({ ...prev, direction: directions[Math.floor(Math.random() * directions.length)] }))
            }, 100)
            timers.push(directionInterval)

            timers.push(setTimeout(() => {
                clearInterval(directionInterval)
                setDisplayValues(prev => ({ ...prev, direction: rollResult.direction }))
                setVisibleDice(prev => ({ ...prev, direction: true }))
            }, 1000)) // 1.0s duration for action
        }, 600)) // Starts at 0.6s

        // 3. Commodity Die Sequence (The Big Reveal - Suspense)
        timers.push(setTimeout(() => {
            const stockInterval = setInterval(() => {
                setDisplayValues(prev => ({ ...prev, stock: stocks[Math.floor(Math.random() * stocks.length)] }))
            }, 100)
            timers.push(stockInterval)

            timers.push(setTimeout(() => {
                clearInterval(stockInterval)
                setDisplayValues(prev => ({ ...prev, stock: rollResult.stock }))
                setVisibleDice(prev => ({ ...prev, stock: true }))
                if (onComplete) onComplete()
            }, 2000)) // Prolonged suspense (2.0s)
        }, 1400)) // Starts at 1.4s

        return () => {
            timers.forEach(t => {
                clearInterval(t)
                clearTimeout(t)
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rollResult])

    const renderDie = (type: 'stock' | 'amount' | 'direction', value: any, isVisible: boolean, label: string) => {
        const isSettled = isVisible

        return (
            <motion.div
                className="flex flex-col items-center gap-3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div
                    className={`h-24 w-24 sm:h-32 sm:w-32 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden border-4 ${isSettled
                        ? (type === 'stock' ? 'border-white/50' : 'border-primary/20 bg-card')
                        : 'border-dashed border-muted-foreground/30 bg-muted/20'
                        }`}
                    animate={!isSettled ? {
                        rotate: [0, -10, 10, -10, 10, 0],
                        scale: [1, 1.05, 0.95, 1.05, 1],
                    } : {
                        scale: [1, 1.1, 1],
                        transition: { duration: 0.3 }
                    }}
                    transition={!isSettled ? { repeat: Infinity, duration: 0.4 } : {}}
                >
                    {/* Interior Background for Stock */}
                    {type === 'stock' && isSettled && (
                        <motion.div
                            className={`absolute inset-0 ${STOCK_COLORS[value as StockSymbol] || 'bg-primary'}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />
                    )}

                    <div className="relative z-10">
                        {type === 'stock' && (
                            <span className={`text-sm sm:text-lg font-black uppercase tracking-tighter ${isSettled ? 'text-white drop-shadow-md' : 'text-muted-foreground'}`}>
                                {value || '?'}
                            </span>
                        )}
                        {type === 'amount' && (
                            <span className={`text-4xl sm:text-5xl font-black ${isSettled ? 'text-primary' : 'text-muted-foreground'}`}>
                                {value || '?'}
                            </span>
                        )}
                        {type === 'direction' && (
                            <div className={isSettled ? '' : 'text-muted-foreground'}>
                                {value === 'UP' && <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-green-500" strokeWidth={3} />}
                                {type === 'direction' && value === 'DOWN' && <TrendingDown className="h-12 w-12 sm:h-16 sm:w-16 text-red-500" strokeWidth={3} />}
                                {type === 'direction' && value === 'DIVIDEND' && <Coins className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-500" strokeWidth={2.5} />}
                                {!value && <HelpCircle className="h-12 w-12 sm:h-16 sm:w-16 animate-pulse" strokeWidth={1} />}
                            </div>
                        )}
                    </div>

                    {/* Gloss effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                </motion.div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</span>
            </motion.div>
        )
    }

    return (
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 py-8">
            {renderDie('amount', displayValues.amount, visibleDice.amount, 'Amount')}
            {renderDie('direction', displayValues.direction, visibleDice.direction, 'Action')}
            {renderDie('stock', displayValues.stock, visibleDice.stock, 'Commodity')}
        </div>
    )
}
