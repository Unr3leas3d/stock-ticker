"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, Users, Play, Loader2 } from "lucide-react"
import { useGameState } from "@/hooks/useGameState"

export default function LobbyPage() {
    const router = useRouter()
    const { gameState, isConnected, actions, selfPlayer, currentRoomId } = useGameState()
    const [name, setName] = useState("")
    const [inputRoomId, setInputRoomId] = useState("")
    const [isHosting, setIsHosting] = useState(false)

    useEffect(() => {
        // If the game has already started, redirect to board
        if (gameState && gameState.currentPhase !== 'LOBBY') {
            router.push('/')
        }
    }, [gameState?.currentPhase, router])

    const generateRoomId = () => {
        return Math.random().toString(36).substring(2, 6).toUpperCase()
    }

    const handleJoin = () => {
        if (!name.trim() || !inputRoomId.trim()) return
        actions.joinRoom(inputRoomId.trim().toUpperCase(), name.trim())
    }

    const handleHost = () => {
        if (!name.trim()) return
        const newRoomId = generateRoomId()
        actions.joinRoom(newRoomId, name.trim())
    }

    const playersList = gameState ? Object.values(gameState.players) : []
    const hasJoined = !!selfPlayer
    const isHost = selfPlayer && playersList[0] && selfPlayer.id === playersList[0].id

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-md space-y-8">
                {/* Branding Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-yellow-100 rounded-full mb-4">
                        <Trophy className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Stock Ticker</h1>
                    <p className="text-slate-500">The classic market simulation game</p>
                </div>

                {/* Setup Card */}
                <Card className="border-primary/10 shadow-lg relative overflow-hidden">
                    {/* Connection Status indicator */}
                    <div className={`absolute top-0 left-0 w-full h-1 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />

                    <CardHeader>
                        <CardTitle className="text-2xl text-center">
                            {hasJoined ? `Lobby: ${currentRoomId}` : (isHosting ? "Host a New Game" : "Join a Game")}
                        </CardTitle>
                        <CardDescription className="text-center">
                            {isConnected ? (hasJoined ? "Waiting for the host to start" : "Enter details to get started") : "Connecting to server..."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!hasJoined ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-bold text-slate-700 uppercase tracking-wider">Your Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Gordon Gekko"
                                        className="h-12 text-lg text-center font-semibold bg-slate-50"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={!isConnected}
                                    />
                                </div>

                                {!isHosting ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="roomId" className="text-sm font-bold text-slate-700 uppercase tracking-wider">Room ID</Label>
                                        <Input
                                            id="roomId"
                                            placeholder="Enter 4-char ID"
                                            className="h-12 text-lg text-center font-bold tracking-widest bg-slate-50 uppercase"
                                            value={inputRoomId}
                                            onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                                            disabled={!isConnected}
                                            maxLength={6}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg text-center text-sm text-muted-foreground italic">
                                        Generating unique room code...
                                    </div>
                                )}

                                <div className="flex flex-col gap-3 pt-2">
                                    {!isHosting ? (
                                        <>
                                            <Button
                                                className="h-12 text-base font-bold"
                                                onClick={handleJoin}
                                                disabled={!isConnected || !name.trim() || !inputRoomId.trim()}
                                            >
                                                Join Room
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="text-primary font-bold"
                                                onClick={() => setIsHosting(true)}
                                            >
                                                Or Host a Private Game
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                className="h-12 text-base font-bold bg-green-600 hover:bg-green-700"
                                                onClick={handleHost}
                                                disabled={!isConnected || !name.trim()}
                                            >
                                                Create & Host Game
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setIsHosting(false)}
                                            >
                                                Back to Join
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-4 bg-green-50 text-green-700 rounded-lg text-center font-medium border border-green-200">
                                    Joined as <strong>{selfPlayer.name}</strong> in room <strong>{currentRoomId}</strong>
                                </div>

                                {/* Connected Players List */}
                                <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden min-h-[160px]">
                                    <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                                        <span className="font-semibold flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Players in Lobby
                                        </span>
                                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">{playersList.length}/6</span>
                                    </div>
                                    <div className="divide-y bg-slate-50/50">
                                        {playersList.length === 0 ? (
                                            <div className="p-6 text-center text-muted-foreground text-sm flex flex-col items-center justify-center">
                                                Waiting for players...
                                            </div>
                                        ) : playersList.map((player, idx) => (
                                            <div key={player.id} className="flex items-center justify-between p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                                        {player.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className={`font-medium flex items-center gap-2 ${player.id === selfPlayer?.id ? 'text-primary font-bold' : ''}`}>
                                                        {player.name} {player.id === selfPlayer?.id && '(You)'}
                                                        {player.connectionStatus === 'DISCONNECTED' && <span className="text-xs text-red-500 font-normal opacity-80">(Disconnected)</span>}
                                                    </span>
                                                </div>
                                                {idx === 0 && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded">Host</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Game Configuration (Host Only or Sync View) */}
                                {gameState?.settings && (
                                    <div className="space-y-4 p-5 rounded-xl bg-slate-100/50 border border-slate-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                                <Trophy className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold uppercase tracking-tight text-slate-800">Game metrics (Host)</h4>
                                                <p className="text-[10px] text-muted-foreground">{isHost ? "Tune these before starting" : "Configured by host"}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-slate-500">Initial Cash</Label>
                                                <Input
                                                    key={`cash-${gameState.settings.initialCash}`}
                                                    type="number"
                                                    defaultValue={gameState.settings.initialCash}
                                                    onBlur={(e) => actions.updateSettings({ initialCash: Number(e.target.value) })}
                                                    disabled={!isHost}
                                                    className="h-9 font-bold bg-white"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-slate-500">Max Rounds</Label>
                                                <Input
                                                    key={`rounds-${gameState.settings.maxRounds}`}
                                                    type="number"
                                                    defaultValue={gameState.settings.maxRounds}
                                                    onBlur={(e) => actions.updateSettings({ maxRounds: Number(e.target.value) })}
                                                    disabled={!isHost}
                                                    className="h-9 font-bold bg-white"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-slate-500">Trade Interval</Label>
                                                <Input
                                                    type="number"
                                                    value={gameState.settings.tradingInterval}
                                                    onChange={(e) => actions.updateSettings({ tradingInterval: Number(e.target.value) })}
                                                    disabled={!isHost}
                                                    className="h-9 font-bold bg-white"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-slate-500">Loans</Label>
                                                <Button
                                                    variant={gameState.settings.enableLoans ? "default" : "outline"}
                                                    size="sm"
                                                    disabled={!isHost}
                                                    onClick={() => actions.updateSettings({ enableLoans: !gameState.settings.enableLoans })}
                                                    className="h-9 w-full text-xs font-bold"
                                                >
                                                    {gameState.settings.enableLoans ? "On" : "Off"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <CardFooter className="flex flex-col gap-3 px-0">
                                    <Button
                                        size="lg"
                                        className="w-full text-lg h-14 font-bold"
                                        onClick={() => actions.startGame()}
                                        disabled={playersList.length === 0 || selfPlayer.id !== playersList[0]?.id}
                                    >
                                        <Play className="mr-2 h-5 w-5" /> Start Game
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground">
                                        {selfPlayer.id === playersList[0]?.id
                                            ? "You are the host. You can start the game once everyone is ready."
                                            : `Waiting for ${playersList[0]?.name} to start the game.`
                                        }
                                    </p>
                                </CardFooter>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
