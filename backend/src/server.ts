import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { GameEngine } from './gameEngine.js';
import type { Player, TradeType, StockSymbol } from './types.js';

dotenv.config();

const app = express();
app.use(cors());

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3001;

// Multi-room storage
const rooms = new Map<string, GameEngine>();

// Store which room each socket belongs to for easy lookup
const socketToRoom = new Map<string, string>();

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

io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // --- Client -> Server Event Listeners ---

    socket.on('JOIN_ROOM', ({ roomId, name, avatar }) => {
        const id = roomId || 'GLOBAL_ROOM';
        socket.join(id);
        socketToRoom.set(socket.id, id);

        const engine = getRoom(id);
        const player = engine.joinPlayer(socket.id, name || 'Anonymous Player', avatar || '');

        // Confirm join to client and send initial state
        socket.emit('PLAYER_JOINED', player);
        socket.emit('STATE_SYNC', engine.getState());

        console.log(`Player ${name} joined room: ${id}`);
    });

    socket.on('START_GAME', () => {
        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            getRoom(roomId).startGame();
        }
    });

    socket.on('UPDATE_SETTINGS', (settings) => {
        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            getRoom(roomId).updateSettings(settings);
        }
    });

    socket.on('ROLL_DICE', () => {
        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            getRoom(roomId).rollDice(socket.id);
        }
    });

    socket.on('EXECUTE_TRADE', ({ type, stock, amount }: { type: TradeType, stock: StockSymbol, amount: number }) => {
        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            getRoom(roomId).executeTrade(socket.id, type, stock, amount);
        }
    });

    socket.on('REQUEST_LOAN', () => {
        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            getRoom(roomId).requestLoan(socket.id);
        }
    });

    socket.on('SET_READY', (ready: boolean) => {
        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            getRoom(roomId).setPlayerReady(socket.id, ready);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        const roomId = socketToRoom.get(socket.id);
        if (roomId) {
            getRoom(roomId).disconnectPlayer(socket.id);
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

server.listen(PORT, () => {
    console.log(`🚀 Stock Ticker WebSocket Server running on port ${PORT}`);
});
