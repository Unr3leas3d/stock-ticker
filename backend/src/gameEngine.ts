import type { GameState, MarketState, Phase, Player, StockSymbol, TradeType, RollResult, GameSettings } from './types.js';
import * as crypto from 'crypto';

const INITIAL_STOCK_PRICE = 1.00;
const DEFAULT_INITIAL_CASH = 5000.00;
const DEFAULT_MAX_ROUNDS = 20;
const LOAN_AMOUNT = 1000.00;

const createInitialMarket = (): MarketState => {
    const stocks: StockSymbol[] = ['Gold', 'Silver', 'Oil', 'Industrial', 'Bonds', 'Grain'];
    const market = {} as MarketState;
    for (const stock of stocks) {
        market[stock] = {
            currentValue: INITIAL_STOCK_PRICE,
            history: [INITIAL_STOCK_PRICE],
            status: 'NORMAL'
        };
    }
    return market;
};

// Multiple rooms support: This class is now exported to be instantiated per room.
export class GameEngine {
    private state: GameState;
    private timer: any = null;

    // Callback when state changes significantly so the server can broadcast
    public onStateSync?: (state: GameState, eventName?: string, payload?: any) => void;
    public onMarketUpdated?: (market: MarketState) => void;
    public onTickerLog?: (msg: string) => void;

    constructor(roomId: string) {
        this.state = this.createInitialState(roomId);
    }

    private createInitialState(roomId: string): GameState {
        const settings = {
            initialCash: DEFAULT_INITIAL_CASH,
            maxRounds: DEFAULT_MAX_ROUNDS,
            tradingInterval: 1, // Unlock market every 1 round for faster testing
            enableLoans: true
        };

        return {
            roomId: roomId,
            roundLength: settings.maxRounds,
            tradingInterval: settings.tradingInterval,
            currentPhase: 'LOBBY',
            currentPlayerIndex: 0,
            completedRounds: 0,
            marketTimer: 0,
            settings,
            market: createInitialMarket(),
            players: {},
            tickerLog: [`Game Created in room ${roomId}. Waiting for players...`],
            lastActivityAt: Date.now()
        };
    }

    public getState(): GameState {
        return this.state;
    }

    public markActivity() {
        this.state.lastActivityAt = Date.now();
    }

    private addLog(msg: string) {
        // Keep last 50 logs
        this.state.tickerLog.push(msg);
        if (this.state.tickerLog.length > 50) {
            this.state.tickerLog.shift();
        }
        if (this.onTickerLog) this.onTickerLog(msg);
    }

    public joinPlayer(socketId: string, name: string, avatar: string): Player {
        if (this.state.players[socketId]) {
            this.state.players[socketId].connectionStatus = 'ONLINE';
            this.state.players[socketId].name = name;
            this.state.players[socketId].avatar = avatar;
            this.addLog(`${name} reconnected.`);
        } else {
            const newPlayer: Player = {
                id: socketId,
                name,
                avatar,
                cash: this.state.settings.initialCash,
                portfolio: { Gold: 0, Silver: 0, Oil: 0, Industrial: 0, Bonds: 0, Grain: 0 },
                avgBuyPrices: { Gold: 0, Silver: 0, Oil: 0, Industrial: 0, Bonds: 0, Grain: 0 },
                hasUsedLoan: false,
                isBankrupt: false,
                isReady: false,
                connectionStatus: 'ONLINE'
            };
            this.state.players[socketId] = newPlayer;
            this.addLog(`${name} joined the game.`);
        }
        this.syncState();
        return this.state.players[socketId];
    }

    public disconnectPlayer(socketId: string) {
        if (this.state.players[socketId]) {
            this.state.players[socketId].connectionStatus = 'DISCONNECTED';
            this.addLog(`${this.state.players[socketId].name} disconnected.`);
            this.syncState();
        }
    }

    public forfeitGame(socketId: string) {
        const player = this.state.players[socketId];
        if (!player) return;

        // Only allow forfeiting during active gameplay phases
        const activePhases = ['INITIAL_BUY_IN', 'ROLLING', 'RESOLVING_ROLL', 'PAYING_DIVIDENDS', 'STOCK_EVENT_PHASE', 'OPEN_MARKET'];
        if (!activePhases.includes(this.state.currentPhase)) return;

        const playerName = player.name;
        const playerKeys = Object.keys(this.state.players);
        const playerIndex = playerKeys.indexOf(socketId);

        // Remove the player
        delete this.state.players[socketId];
        this.addLog(`${playerName} has forfeited the game.`);

        const remainingCount = Object.keys(this.state.players).length;

        // If no players remain, reset to lobby
        if (remainingCount === 0) {
            this.stopTimer();
            this.state.currentPhase = 'LOBBY';
            this.state.completedRounds = 0;
            this.state.currentPlayerIndex = 0;
            this.addLog('All players left. Game reset.');
            this.syncState();
            return;
        }

        // If the forfeiting player was the current roller during ROLLING phase,
        // adjust the index so the game doesn't get stuck
        if (this.state.currentPhase === 'ROLLING' && playerIndex === this.state.currentPlayerIndex) {
            // The player was removed, so the next player slides into this index.
            // If the removed player was the last in the list, wrap around.
            if (this.state.currentPlayerIndex >= remainingCount) {
                this.state.currentPlayerIndex = 0;
                // A full round just completed
                this.state.completedRounds += 1;
                if (this.state.completedRounds >= this.state.roundLength) {
                    this.setPhase('END_GAME');
                    this.addLog('Game Over!');
                    this.syncState();
                    return;
                }
            }
        } else if (playerIndex < this.state.currentPlayerIndex) {
            // Player was before the current roller in the list, shift index back
            this.state.currentPlayerIndex = Math.max(0, this.state.currentPlayerIndex - 1);
        }

        // Ensure index is still valid
        if (this.state.currentPlayerIndex >= remainingCount) {
            this.state.currentPlayerIndex = 0;
        }

        this.syncState();
    }

    public startGame(socketId: string) {
        if (this.state.currentPhase !== 'LOBBY' && this.state.currentPhase !== 'END_GAME') return;

        // Only the host (first player) can start the game
        const playerIds = Object.keys(this.state.players);
        if (playerIds.length > 0 && playerIds[0] !== socketId) {
            console.warn(`Unauthorized START_GAME attempt by ${socketId}`);
            return;
        }

        // Apply any final settings-based adjustments
        this.state.roundLength = this.state.settings.maxRounds;
        this.state.tradingInterval = this.state.settings.tradingInterval;

        // Preserve players and custom settings
        const existingPlayers = { ...this.state.players };
        const customSettings = { ...this.state.settings };

        for (const [id, player] of Object.entries(existingPlayers)) {
            existingPlayers[id] = {
                ...player,
                cash: customSettings.initialCash,
                portfolio: { Gold: 0, Silver: 0, Oil: 0, Industrial: 0, Bonds: 0, Grain: 0 },
                avgBuyPrices: { Gold: 0, Silver: 0, Oil: 0, Industrial: 0, Bonds: 0, Grain: 0 },
                hasUsedLoan: false,
                isBankrupt: false,
                isReady: false
            };
        }

        // Reset state for new game
        const currentRoomId = this.state.roomId;
        this.state = this.createInitialState(currentRoomId);
        this.state.players = existingPlayers;
        this.state.settings = customSettings;
        this.state.roundLength = customSettings.maxRounds;
        this.state.tradingInterval = customSettings.tradingInterval;

        this.setPhase('INITIAL_BUY_IN');
        this.addLog('Game Started! Initial Buy-in Phase.');
    }

    public updateSettings(socketId: string, settings: Partial<GameSettings>) {
        if (this.state.currentPhase !== 'LOBBY') return;

        // Only the host (first player) can update settings
        const playerIds = Object.keys(this.state.players);
        if (playerIds.length > 0 && playerIds[0] !== socketId) {
            console.warn(`Unauthorized UPDATE_SETTINGS attempt by ${socketId}`);
            return;
        }

        this.state.settings = { ...this.state.settings, ...settings };
        this.state.roundLength = this.state.settings.maxRounds;
        this.state.tradingInterval = this.state.settings.tradingInterval;
        this.syncState();
    }

    public setPhase(phase: Phase) {
        this.state.currentPhase = phase;
        this.state.marketTimer = phase === 'OPEN_MARKET' ? 60 : 0; // 60s timer for market

        // Manage timer for the Open Market phase
        if (phase === 'OPEN_MARKET') {
            this.startTimer();
        } else {
            this.stopTimer();
        }

        // Reset all ready states when entering a new phase
        Object.values(this.state.players).forEach(p => p.isReady = false);

        this.syncState('PHASE_CHANGED', phase);
    }

    private startTimer() {
        this.stopTimer(); // Ensure no duplicate timers
        this.timer = setInterval(() => {
            if (this.state.marketTimer > 0) {
                this.state.marketTimer -= 1;
                if (this.state.marketTimer % 5 === 0 || this.state.marketTimer <= 5) {
                    // Sync every 5 seconds or every second when low
                    this.syncState();
                }
            } else {
                this.stopTimer();
                this.advanceTurn();
            }
        }, 1000);
    }

    private stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    public setPlayerReady(socketId: string, isReady: boolean) {
        const player = this.state.players[socketId];
        if (player) {
            player.isReady = isReady;
            this.syncState();
            this.checkAllReady();
        }
    }

    private checkAllReady() {
        const activePlayers = Object.values(this.state.players).filter(p => p.connectionStatus === 'ONLINE');
        if (activePlayers.length === 0) return;

        const allReady = activePlayers.every(p => p.isReady);

        if (allReady) {
            if (this.state.currentPhase === 'INITIAL_BUY_IN') {
                this.addLog('Initial buys locked in. Rolling phase starting.');
                this.setPhase('ROLLING');
            } else if (this.state.currentPhase === 'OPEN_MARKET') {
                this.addLog('All players ready. Trading closed early.');
                this.setPhase('ROLLING');
            }
        }
    }

    public rollDice(socketId: string) {
        if (this.state.currentPhase !== 'ROLLING') return;

        // Determine current player
        const activePlayers = Object.values(this.state.players);
        const currentPlayer = activePlayers[this.state.currentPlayerIndex % activePlayers.length];

        if (currentPlayer && currentPlayer.id !== socketId) {
            // It's not this player's turn 
            console.warn(`Unauthorized ROLL_DICE attempt by ${socketId}. Expected ${currentPlayer.id}`);
            return; 
        }

        this.setPhase('RESOLVING_ROLL');

        // Cryptographically secure dice roll based on dice.js
        const stockFaces: StockSymbol[] = ["Gold", "Silver", "Oil", "Industrial", "Bonds", "Grain"];
        const directionFaces: Array<'UP' | 'DOWN' | 'DIVIDEND'> = ["UP", "DOWN", "DIVIDEND", "UP", "DOWN", "DIVIDEND"];
        const amountFaces = [5, 10, 20, 5, 10, 20];

        const rollSingleDie = <T>(faces: T[]): T => {
            const index = crypto.randomInt(0, faces.length);
            return faces[index]!;
        };

        const stockRolled = rollSingleDie(stockFaces);
        const directionFace = rollSingleDie(directionFaces);
        const amountFace = rollSingleDie(amountFaces);

        // Convert faces to internal values
        const amountValue = amountFace / 100; // 5 -> 0.05

        const rollResult: RollResult = {
            stock: stockRolled,
            direction: directionFace,
            amount: amountFace
        };

        this.state.lastRoll = rollResult;

        // Notify clients about the roll
        if (this.onStateSync) {
            this.onStateSync(this.state, 'DICE_ROLLED', {
                player: this.state.players[socketId]?.name,
                ...rollResult,
                amountValue // Extra helpful for backend logic
            });
        }

        // Give clients 5.5 seconds to animate the roll and digest the result before processing
        setTimeout(() => {
            this.processRollResult(stockRolled, directionFace, amountValue);
        }, 5500);
    }

    private processRollResult(stock: StockSymbol, action: string, amount: number) {
        if (action === 'UP' || action === 'DOWN') {
            let currentVal = this.state.market[stock].currentValue;
            currentVal = action === 'UP' ? currentVal + amount : currentVal - amount;

            // Fix precision issues
            currentVal = Math.round(currentVal * 100) / 100;

            this.state.market[stock].currentValue = currentVal;
            this.state.market[stock].history.push(currentVal);

            // Trim history
            if (this.state.market[stock].history.length > 50) {
                this.state.market[stock].history.shift();
            }

            // Check splits/bankruptcies
            if (currentVal >= 2.00) {
                this.state.market[stock].status = 'PENDING_SPLIT';
            } else if (currentVal <= 0.00) {
                this.state.market[stock].status = 'BANKRUPT';
            } else {
                this.state.market[stock].status = 'NORMAL';
            }

            if (this.onMarketUpdated) this.onMarketUpdated(this.state.market);

            if (this.state.market[stock].status !== 'NORMAL') {
                this.setPhase('STOCK_EVENT_PHASE');
                setTimeout(() => this.processStockEvents(), 2000);
                return;
            }

        } else if (action === 'DIVIDEND') {
            if (this.state.market[stock].currentValue > 1.00) {
                this.setPhase('PAYING_DIVIDENDS');
                // Pay out players who own this stock (e.g., matching the current value per share, or fixed amount)
                const payoutPerShare = amount;
                Object.values(this.state.players).forEach(p => {
                    const sharesOwned = p.portfolio[stock];
                    if (sharesOwned > 0) {
                        const payout = sharesOwned * payoutPerShare;
                        p.cash += payout;
                        this.addLog(`${p.name} earned $${payout.toFixed(2)} in dividends from ${stock}.`);
                    }
                });
            } else {
                this.addLog(`${stock} did not pay dividends because its value is not greater than $1.00.`);
            }
        }

        this.advanceTurn();
    }

    private processStockEvents() {
        // Process Bankruptcies and Splits
        for (const stock of Object.keys(this.state.market) as StockSymbol[]) {
            const data = this.state.market[stock];
            if (data.status === 'BANKRUPT') {
                this.addLog(`🚨 ${stock} IS BANKRUPT! All shares lost. Prices reset to $1.00. 🚨`);
                Object.values(this.state.players).forEach(p => p.portfolio[stock] = 0);
                data.currentValue = INITIAL_STOCK_PRICE;
                data.status = 'NORMAL';
                // Reset history and avg prices to start fresh after bankruptcy
                data.history = [INITIAL_STOCK_PRICE];
                Object.values(this.state.players).forEach(p => p.avgBuyPrices[stock] = 0);
            } else if (data.status === 'PENDING_SPLIT') {
                this.addLog(`🎉 ${stock} SPLIT! Shares doubled. Prices reset to $1.00. 🎉`);
                Object.values(this.state.players).forEach(p => {
                    if (p.portfolio[stock] > 0) {
                        p.portfolio[stock] *= 2;
                        p.avgBuyPrices[stock] /= 2;
                    }
                });
                data.currentValue = INITIAL_STOCK_PRICE;
                data.status = 'NORMAL';
                data.history.push(INITIAL_STOCK_PRICE);
            }
        }

        if (this.onMarketUpdated) this.onMarketUpdated(this.state.market);
        this.advanceTurn();
    }

    private advanceTurn() {
        // Increment the current player index for the next roll
        this.state.currentPlayerIndex += 1;

        const activePlayers = Object.keys(this.state.players).length;
        const totalPlayers = activePlayers > 0 ? activePlayers : 1;

        // If the currentPlayerIndex reaches totalPlayers, one full "round" of rolling has completed
        if (this.state.currentPlayerIndex >= totalPlayers) {
            this.state.completedRounds += 1;
            this.state.currentPlayerIndex = 0; // Reset index back to the first player
        }

        // Check if we hit the limit
        if (this.state.completedRounds >= this.state.roundLength) {
            this.setPhase('END_GAME');
            this.addLog('Game Over!');
            return;
        }

        // Check if it's time for Open Market (tradingInterval reached)
        // Since we only increment completedRounds after ALL players have gone,
        // we just check if completedRounds is a multiple of tradingInterval,
        // but ONLY trigger it when a round just finished (currentPlayerIndex is 0).
        if (this.state.currentPlayerIndex === 0 && this.state.completedRounds > 0 && this.state.completedRounds % this.state.tradingInterval === 0) {
            this.addLog('Market is open for trading!');
            this.setPhase('OPEN_MARKET');
        } else {
            this.setPhase('ROLLING');
        }

        this.syncState();
    }

    public executeTrade(socketId: string, type: TradeType, stock: StockSymbol, amount: number) {
        const player = this.state.players[socketId];
        const marketPrice = this.state.market[stock].currentValue;
        if (!player || amount <= 0 || marketPrice <= 0) return;

        // Restrict trading phase usually to INITIAL or OPEN_MARKET, 
        // but some rules allow trading anytime. Let's enforce phase 
        if (this.state.currentPhase !== 'OPEN_MARKET' && this.state.currentPhase !== 'INITIAL_BUY_IN') {
            return;
        }

        const totalCost = marketPrice * amount;

        if (type === 'BUY') {
            if (player.cash >= totalCost) {
                const currentQty = player.portfolio[stock] || 0;
                const currentAvg = player.avgBuyPrices[stock] || 0;

                // Calculate new average: (total cost of old + cost of new) / total quantity
                const newAvg = ((currentAvg * currentQty) + (marketPrice * amount)) / (currentQty + amount);
                player.avgBuyPrices[stock] = Math.round(newAvg * 100) / 100;

                player.cash -= totalCost;
                player.portfolio[stock] = currentQty + amount;
                this.addLog(`${player.name} bought ${amount} ${stock} @ $${marketPrice.toFixed(2)}`);
                this.syncState();
            }
        } else if (type === 'SELL') {
            const currentQty = player.portfolio[stock] || 0;
            if (currentQty >= amount) {
                const avgBuyPrice = player.avgBuyPrices[stock] || 0;
                const profitPerShare = marketPrice - avgBuyPrice;
                const totalProfit = profitPerShare * amount;
                const marginPercent = avgBuyPrice > 0 ? (profitPerShare / avgBuyPrice) * 100 : 0;

                player.portfolio[stock] -= amount;
                player.cash += totalCost;

                // Reset average if all sold
                if (player.portfolio[stock] === 0) {
                    player.avgBuyPrices[stock] = 0;
                }

                const profitStr = totalProfit >= 0 ? `profit` : `loss`;
                const absProfit = Math.abs(totalProfit).toFixed(2);
                const marginStr = `${totalProfit >= 0 ? '+' : ''}${marginPercent.toFixed(1)}%`;

                this.addLog(`${player.name} sold ${amount} ${stock} @ $${marketPrice.toFixed(2)} (${profitStr}: $${absProfit}, ${marginStr})`);
                this.syncState();
            }
        }
    }

    public requestLoan(socketId: string) {
        const player = this.state.players[socketId];
        if (!player || player.hasUsedLoan) return;

        // Player is bankrupt if they have no cash AND no stocks of value they can sell
        const hasSellableStocks = Object.entries(player.portfolio).some(([sym, qty]) => {
            return qty > 0 && this.state.market[sym as StockSymbol]?.currentValue > 0;
        });

        if (player.cash <= 0 && !hasSellableStocks) {
            player.hasUsedLoan = true;
            player.cash += LOAN_AMOUNT;
            this.addLog(`${player.name} took an emergency loan of $${LOAN_AMOUNT} (Repayment + Interest: $1,500 at game end)`);
            this.syncState();
        } else {
            this.addLog(`${player.name} requested a loan but is not bankrupt yet.`);
        }
    }

    private syncState(event?: string, payload?: any) {
        if (this.onStateSync) {
            this.onStateSync(this.state, event, payload);
        }
    }
}

