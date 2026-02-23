export type Phase =
    | 'LOBBY'
    | 'INITIAL_BUY_IN'
    | 'ROLLING'
    | 'RESOLVING_ROLL'
    | 'PAYING_DIVIDENDS'
    | 'STOCK_EVENT_PHASE'
    | 'OPEN_MARKET'
    | 'END_GAME';

export type StockSymbol = 'Gold' | 'Silver' | 'Oil' | 'Industrial' | 'Bonds' | 'Grain';

export type StockStatus = 'NORMAL' | 'PENDING_SPLIT' | 'BANKRUPT';

export interface RollResult {
    stock: StockSymbol;
    direction: 'UP' | 'DOWN' | 'DIVIDEND';
    amount: number;
}

export interface StockMarketData {
    currentValue: number;
    history: number[];
    status: StockStatus;
}

export type MarketState = Record<StockSymbol, StockMarketData>;

export interface GameSettings {
    initialCash: number;
    maxRounds: number;
    tradingInterval: number;
    enableLoans: boolean;
}

export interface Player {
    id: string; // Socket ID initially
    name: string;
    avatar: string; // Keep although we removed it visually, backend might expect it or we can ignore it
    cash: number;
    portfolio: Record<StockSymbol, number>;
    avgBuyPrices: Record<StockSymbol, number>;
    hasUsedLoan: boolean;
    isBankrupt: boolean;
    isReady: boolean;
    connectionStatus: 'ONLINE' | 'DISCONNECTED';
}

export interface GameState {
    roomId: string;
    roundLength: number;
    tradingInterval: number;
    currentPhase: Phase;
    currentPlayerIndex: number;
    completedRounds: number;
    marketTimer: number; // Used for OPEN_MARKET countdown
    market: MarketState;
    players: Record<string, Player>;
    tickerLog: string[]; // Keep last N messages
    lastRoll?: RollResult;
    settings: GameSettings;
    lastActivityAt?: number;
}

export type TradeType = 'BUY' | 'SELL';
