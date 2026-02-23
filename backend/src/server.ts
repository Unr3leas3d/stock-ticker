import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import { GameEngine, MAX_PLAYERS } from './gameEngine.js';
import type { TradeType, StockSymbol } from './types.js';

dotenv.config();

const app = express();

// Hardened CORS: Support comma-separated list of origins from environment or default
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim().replace(/\/$/, '')); // Trim whitespace and trailing slashes

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`Blocked by CORS: origin ${origin} not in [${ALLOWED_ORIGINS.join(', ')}]`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true
}));

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['polling', 'websocket'] // Explicitly allow polling -> websocket upgrade
});

const PORT = process.env.PORT || 3001;

// --- Zod Schemas for Input Validation ---
const JoinRoomSchema = z.object({
    roomId: z.string().min(1).max(10).toUpperCase(),
    name: z.string().min(1).max(20).trim(),
    avatar: z.string().max(100).optional()
});

const TradeSchema = z.object({
    type: z.enum(['BUY', 'SELL']),
    stock: z.enum(['Gold', 'Silver', 'Oil', 'Industrial', 'Bonds', 'Grain']),
    amount: z.number().int().positive().max(10000)
});

const SettingsSchema = z.object({
    initialCash: z.number().min(100).max(100000).optional(),
    maxRounds: z.number().min(1).max(100).optional(),
    tradingInterval: z.number().min(1).max(20).optional(),
    enableLoans: z.boolean().optional()
});

// Multi-room storage
const rooms = new Map<string, GameEngine>();

// Store which room each socket belongs to for easy lookup
const socketToRoom = new Map<string, string>();

// Simple in-memory rate limiting map (socketId -> lastActionTimestamp)
const lastAction = new Map<string, number>();
const RATE_LIMIT_MS = 200; // 5 actions per second

const getRoom = (roomId: string): GameEngine => {
    let engine = rooms.get(roomId);
    if (!engine) {
        engine = new GameEngine(roomId);

        // Hook engine events to room-specific socket broadcasts
        engine.onStateSync = (state, eventName, payload) => {
            io.to(roomId).emit('STATE_SYNC', state);
            if (eventName && payload) {
                io.to(roomId).emit(eventName, payload);
            }
        };

        engine.onMarketUpdated = (market) => {
            io.to(roomId).emit('MARKET_UPDATED', market);
        };

        engine.onTickerLog = (msg) => {
            io.to(roomId).emit('TICKER_LOG', msg);
        };

        rooms.set(roomId, engine);
    }
    return engine;
};

// Look up an existing room without creating one — used for action events
const findRoom = (roomId: string): GameEngine | undefined => {
    return rooms.get(roomId);
};

// --- Inactivity Cleanup ---
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

setInterval(() => {
    const now = Date.now();
    for (const [roomId, engine] of rooms.entries()) {
        const state = engine.getState();
        if (state.currentPhase === 'END_GAME' && now - state.lastActivityAt > 5 * 60 * 1000) {
            console.log(`🧹 Purging finished game room: ${roomId}`);
            io.to(roomId).emit('TICKER_LOG', 'Game results expired. Room closed.');
            engine.cleanup();
            io.in(roomId).disconnectSockets(true);
            rooms.delete(roomId);
        } else if (now - state.lastActivityAt > INACTIVITY_TIMEOUT) {
            console.log(`🧹 Purging inactive room: ${roomId}`);
            io.to(roomId).emit('TICKER_LOG', 'Room closed due to 30 minutes of inactivity.');
            engine.cleanup();
            io.in(roomId).disconnectSockets(true);
            rooms.delete(roomId);
        }
    }
}, 5 * 60 * 1000); // Run check every 5 minutes

// Placeholder Socket.io auth middleware — accepts any non-empty token.
// TODO: Replace with JWT or session-based auth if player identity verification is needed.
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('Authentication failed: Missing token'));
    }
    next();
});

io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Update room activity on any client event + Rate Limiting
    socket.use(([event, ...args], next) => {
        const now = Date.now();
        const last = lastAction.get(socket.id) || 0;

        if (now - last < RATE_LIMIT_MS && event !== 'disconnect') {
            return next(new Error('Rate limit exceeded. Slow down!'));
        }
        lastAction.set(socket.id, now);

        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            const engine = rooms.get(roomId);
            if (engine) engine.markActivity();
        }
        next();
    });

    // --- Client -> Server Event Listeners ---

    socket.on('JOIN_ROOM', (data) => {
        const result = JoinRoomSchema.safeParse(data);
        if (!result.success) {
            return socket.emit('ERROR', { message: 'Invalid join data: ' + result.error.issues[0]?.message });
        }

        const { roomId, name, avatar } = result.data;
        socket.join(roomId);
        socketToRoom.set(socket.id, roomId);

        const engine = getRoom(roomId);
        const player = engine.joinPlayer(socket.id, name, avatar || '');

        if (!player) {
            // Join was rejected (room full or game in progress)
            return socket.emit('ERROR', { message: 'Cannot join: room is full or game is already in progress.' });
        }

        // Confirm join to client and send initial state
        socket.emit('PLAYER_JOINED', player);
        socket.emit('STATE_SYNC', engine.getState());

        console.log(`Player ${name} joined room: ${roomId}`);
    });

    socket.on('START_GAME', () => {
        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            findRoom(roomId)?.startGame(socket.id);
        }
    });

    socket.on('UPDATE_SETTINGS', (data) => {
        const result = SettingsSchema.safeParse(data);
        if (!result.success) {
            return socket.emit('ERROR', { message: 'Invalid settings: ' + result.error.issues[0]?.message });
        }

        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            // Filter out undefined values to satisfy exactOptionalPropertyTypes: true
            const settings = Object.fromEntries(
                Object.entries(result.data).filter(([_, v]) => v !== undefined)
            );
            findRoom(roomId)?.updateSettings(socket.id, settings);
        }
    });

    socket.on('ROLL_DICE', () => {
        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            findRoom(roomId)?.rollDice(socket.id);
        }
    });

    socket.on('EXECUTE_TRADE', (data) => {
        const result = TradeSchema.safeParse(data);
        if (!result.success) {
            return socket.emit('ERROR', { message: 'Invalid trade: ' + result.error.issues[0]?.message });
        }

        const { type, stock, amount } = result.data;
        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            findRoom(roomId)?.executeTrade(socket.id, type, stock, amount);
        }
    });

    socket.on('REQUEST_LOAN', () => {
        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            findRoom(roomId)?.requestLoan(socket.id);
        }
    });

    socket.on('FORFEIT_GAME', () => {
        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            findRoom(roomId)?.forfeitGame(socket.id);
            socket.emit('PLAYER_FORFEITED');
            socket.leave(roomId);
            socketToRoom.delete(socket.id);
            console.log(`Player ${socket.id} forfeited from room: ${roomId}`);
        }
    });

    socket.on('SET_READY', (ready) => {
        if (typeof ready !== 'boolean') return;
        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            findRoom(roomId)?.setPlayerReady(socket.id, ready);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        lastAction.delete(socket.id);
        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            findRoom(roomId)?.disconnectPlayer(socket.id);
            socketToRoom.delete(socket.id);
        }
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        roomsCount: rooms.size,
        totalPlayers: socketToRoom.size
    });
});

// --- Keep-Alive Self-Ping for Render ---
// This ensures that as long as there is at least one active room, 
// the server tries to stay awake by pinging its own health endpoint.
setInterval(async () => {
    if (rooms.size > 0) {
        const url = `http://localhost:${PORT}/health`;
        try {
            await fetch(url);
            console.log(`Self-ping to ${url} successful (Active rooms: ${rooms.size})`);
        } catch (err) {
            console.warn(`Self-ping to ${url} failed:`, err);
        }
    }
}, 10 * 60 * 1000); // 10 minutes

server.listen(PORT, () => {
    console.log(`🚀 Stock Ticker WebSocket Server running on port ${PORT}`);
});

// --- Process-level Error Handlers ---
// Prevent silent crashes by logging unhandled errors
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
