"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, TradeType, StockSymbol, Player, GameSettings } from '@/types/game';

// Replace with your actual backend URL, usually localhost:3001
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

interface GameStateContextValue {
    gameState: GameState | null;
    isConnected: boolean;
    playerId: string | null;
    currentRoomId: string | null;
    selfPlayer: Player | null; // Helper to specifically get the connected player's data
    actions: {
        joinRoom: (roomId: string, name: string) => void;
        executeTrade: (type: TradeType, symbol: StockSymbol, quantity: number) => void;
        setReady: () => void;
        rollDice: () => void;
        startGame: () => void;
        requestLoan: () => void;
        updateSettings: (settings: Partial<GameSettings>) => void;
    };
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

let socket: Socket | null = null;

export const GameStateProvider = ({ children }: { children: ReactNode }) => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

    useEffect(() => {
        // Initialize socket connection as a singleton
        if (!socket) {
            // Secure token generation for this session
            const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

            socket = io(SOCKET_URL, {
                reconnectionDelayMax: 10000,
                transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
                withCredentials: true,
                auth: {
                    token: sessionToken
                }
            });
        }

        const handleConnect = () => {
            setIsConnected(true);
            setPlayerId(socket?.id || null);
            console.log("Connected to game server with ID:", socket?.id);
        };

        const handleDisconnect = () => {
            setIsConnected(false);
            console.log("Disconnected from game server");
        };

        const handleStateSync = (newState: GameState) => {
            setGameState(newState);
            if (newState.roomId) setCurrentRoomId(newState.roomId);
        };

        const handleMarketUpdated = (market: any) => {
            setGameState(prev => prev ? { ...prev, market } : prev);
        };

        const handleTickerLog = (msg: string) => {
            setGameState(prev => {
                if (!prev) return prev;
                const newLog = [...prev.tickerLog, msg];
                if (newLog.length > 50) newLog.shift();
                return { ...prev, tickerLog: newLog };
            });
        };

        const handleError = (payload: { message: string }) => {
            console.error("Game Error:", payload.message);
            alert(payload.message)
        };

        // Attach listeners
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('STATE_SYNC', handleStateSync);
        socket.on('MARKET_UPDATED', handleMarketUpdated);
        socket.on('TICKER_LOG', handleTickerLog);
        socket.on('ERROR', handleError);

        // Cleanup on unmount
        return () => {
            if (socket) {
                socket.off('connect', handleConnect);
                socket.off('disconnect', handleDisconnect);
                socket.off('STATE_SYNC', handleStateSync);
                socket.off('MARKET_UPDATED', handleMarketUpdated);
                socket.off('TICKER_LOG', handleTickerLog);
                socket.off('ERROR', handleError);
            }
        };
    }, []);

    // --- Keep-Alive Ping for Render ---
    // Only pings when the game is active (not in LOBBY) to avoid unnecessary server uptime.
    useEffect(() => {
        if (!gameState || gameState.currentPhase === 'LOBBY' || !isConnected) return;

        console.log("Keep-alive ping interval started");

        const pingInterval = setInterval(async () => {
            try {
                const response = await fetch(`${SOCKET_URL}/health`);
                if (response.ok) {
                    console.log("Keep-alive ping successful");
                }
            } catch (err) {
                console.warn("Keep-alive ping failed:", err);
            }
        }, 10 * 60 * 1000); // 10 minutes

        return () => {
            console.log("Keep-alive ping interval cleared");
            clearInterval(pingInterval);
        };
    }, [gameState?.currentPhase, isConnected]);

    // Action Methods
    const joinRoom = useCallback((roomId: string, name: string) => {
        if (socket && isConnected) {
            socket.emit('JOIN_ROOM', { roomId, name });
            setCurrentRoomId(roomId);
        }
    }, [isConnected]);

    const executeTrade = useCallback((type: TradeType, symbol: StockSymbol, quantity: number) => {
        if (socket && isConnected) {
            socket.emit('EXECUTE_TRADE', { type, stock: symbol, amount: quantity });
        }
    }, [isConnected]);

    const setReady = useCallback(() => {
        if (socket && isConnected) {
            socket.emit('SET_READY', true);
        }
    }, [isConnected]);

    const rollDice = useCallback(() => {
        if (socket && isConnected) {
            socket.emit('ROLL_DICE', {});
        }
    }, [isConnected]);

    const startGame = useCallback(() => {
        if (socket && isConnected) {
            socket.emit('START_GAME', {});
        }
    }, [isConnected]);

    const requestLoan = useCallback(() => {
        if (socket && isConnected) {
            socket.emit('REQUEST_LOAN', {});
        }
    }, [isConnected]);

    const updateSettings = useCallback((settings: Partial<GameSettings>) => {
        if (socket && isConnected) {
            socket.emit('UPDATE_SETTINGS', settings);
        }
    }, [isConnected]);

    // Derive the specific player data from the global state
    const selfPlayer = gameState && gameState.players && playerId ? gameState.players[playerId] : null;

    const contextValue: GameStateContextValue = {
        gameState,
        isConnected,
        playerId,
        currentRoomId,
        selfPlayer,
        actions: {
            joinRoom,
            executeTrade,
            setReady,
            rollDice,
            startGame,
            requestLoan,
            updateSettings
        }
    };

    return (
        <GameStateContext.Provider value={contextValue}>
            {children}
        </GameStateContext.Provider>
    );
};

export const useGameState = () => {
    const context = useContext(GameStateContext);
    if (!context) {
        throw new Error('useGameState must be used within a GameStateProvider');
    }
    return context;
};
