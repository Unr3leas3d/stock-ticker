"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useGameState } from "@/hooks/useGameState"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { QuotationBoard } from "@/components/game/QuotationBoard"
import { ActionCenter } from "@/components/game/ActionCenter"
import { MarketEventLog } from "@/components/game/MarketEventLog"
import { Loader2 } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { gameState, selfPlayer } = useGameState()

  useEffect(() => {
    if (!gameState || !selfPlayer) {
      router.push('/lobby')
      return
    }

    if (gameState.currentPhase === 'LOBBY') {
      router.push('/lobby')
    } else if (gameState.currentPhase === 'END_GAME') {
      router.push('/end-game')
    }
  }, [gameState?.currentPhase, selfPlayer, router])

  if (!gameState || !selfPlayer || gameState.currentPhase === 'LOBBY') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8 pb-8">
        {/* Top Section: The Market */}
        <section>
          <QuotationBoard />
        </section>

        {/* Middle Section: Player Actions & Leaderboard */}
        <section>
          <ActionCenter />
        </section>

        {/* Bottom Section: Market Event Log (Footer) */}
        <section>
          <MarketEventLog />
        </section>
      </div>
    </DashboardShell>
  );
}
