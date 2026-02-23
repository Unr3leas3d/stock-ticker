"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useGameState } from "@/hooks/useGameState"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { QuotationBoard } from "@/components/game/QuotationBoard"
import { ActionCenter } from "@/components/game/ActionCenter"
import { MarketEventLog } from "@/components/game/MarketEventLog"
import { Loader2, History, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const router = useRouter()
  const { gameState, selfPlayer } = useGameState()
  const [isLogOpen, setIsLogOpen] = useState(false)

  useEffect(() => {
    if (gameState?.currentPhase === 'END_GAME') {
      router.push('/end-game')
      return
    }

    if (!gameState || !selfPlayer || gameState.currentPhase === 'LOBBY') {
      router.push('/lobby')
      return
    }
  }, [gameState?.currentPhase, selfPlayer, router])

  if (!gameState || !selfPlayer || gameState.currentPhase === 'LOBBY') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-muted/40 relative">
      <DashboardShell className="flex-1 min-w-0 transition-all duration-300">
        <div className="flex flex-col h-full gap-4 pb-4">
          {/* Top Section: The Market */}
          <section className="shrink-0 pt-4">
            <QuotationBoard />
          </section>

          {/* Middle Section: Player Actions & Leaderboard */}
          <section className="flex-1 min-h-0">
            <ActionCenter />
          </section>
        </div>
      </DashboardShell>

      {/* Floating Toggle Button (visible when panel is closed) */}
      <Button
        onClick={() => setIsLogOpen(true)}
        className={`fixed top-1/2 right-0 -translate-y-1/2 rounded-l-2xl rounded-r-none h-24 w-10 shadow-2xl z-40 transition-transform duration-300 ${isLogOpen ? 'translate-x-full' : 'translate-x-0'} border border-r-0 border-primary`}
      >
        <div className="flex flex-col items-center gap-2 text-white">
          <History className="h-5 w-5" />
        </div>
      </Button>

      {/* Sliding Right Panel for Market Event Log */}
      <div className={`fixed inset-y-0 right-0 w-96 sm:w-[450px] bg-background shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-500 ease-in-out ${isLogOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <MarketEventLog onClose={() => setIsLogOpen(false)} />
      </div>

      {/* Optional Backdrop to close the panel on mobile */}
      {isLogOpen && (
        <div
          className="xl:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsLogOpen(false)}
        />
      )}
    </div>
  );
}
