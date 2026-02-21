# Stock Ticker - Online Multiplayer Game State & Architecture Breakdown

To build **Stock Ticker** as an online, real-time multiplayer game, the architecture must separate the **Server State** (The single source of truth) from the **Client State** (The visual representation pushing updates to the user). 

Using a real-time connection like WebSockets (e.g., Socket.io or Supabase Realtime), the server manages the game logic, prevents cheating, and broadcasts state changes to all connected clients simultaneously to ensure everyone's UI updates in real-time.

Here is the breakdown of the required persistent state and how it flows over the network.

---

## 1. The Server: Authoritative Game State
This state lives in your backend (Memory, Redis, or a Database). It is the undisputed source of truth. The server receives actions from clients, validates them against the rules, updates this state, and broadcasts the new state to everyone.

### A. Room / Match State
* **`roomId`** (String): Unique identifier for the game instance.
* **`roundLength`** (Number): The length of the game in rounds. The server runs the countdown and broadcasts the remaining rounds available.
* **`tradingInterval`** (Number: `1`, `2`, or `3`): The number of complete rounds required before the `OPEN_MARKET` phase unlocks.

### B. The Market State (The Quotation Board)
* For **each of the 6 stocks** (Gold, Silver, Oil, Industrial, Bonds, Grain):
  * **`currentValue`** (Number): Current price per share (Starts at $1.00).
  * **`history`** (Array of Numbers): A tracked history of prices to draw sparkline charts or graph trends on the UI.
  * **`status`** (Enum): `NORMAL`, `PENDING_SPLIT` (value > $2.00), or `BANKRUPT` (value <= $0.00).

### C. Player State (Ledger)
A dictionary mapping `userId` to their financial data.
* For **each player**:
  * **`id`** / **`name`** / **`avatar`** (String): Profile metadata.
  * **`cash`** (Number): Available play money. Starts at $5000.00.
  * **`portfolio`** (Object): Shares owned (e.g., `{ Gold: 0, Silver: 1000... }`).
  * **`hasUsedLoan`** (Boolean): Tracks the one-time $1000 emergency Broker loan.
  * **`isBankrupt`** (Boolean): True if cash is $0, no stocks remain, and the loan is exhausted.
  * **`isReady`** (Boolean): True if the player has finished their actions for the current phase (e.g., they have locked in their trades during `OPEN_MARKET`).
  * **`connectionStatus`** (Enum): `ONLINE` or `DISCONNECTED` (Allows players to reconnect using their `userId`).

### D. Turn & Phase Flow State (The Game Loop)
Controls what the clients are allowed to do at any exact moment.
* **`currentPhase`** (Enum):
  * `LOBBY`: Waiting for players. Admin can start the game.
  * `INITIAL_BUY_IN`: Mandatory phase where clients emit `buy` events until everyone holds stock.
  * `ROLLING`: Server waits for the active player to emit a `roll_dice` event.
  * `RESOLVING_ROLL`: Server calculates the roll, updates the `Market State`, and pushes the result so clients can animate the dice.
  * `PAYING_DIVIDENDS`: Server distributes cash if a dividend was rolled.
  * `STOCK_EVENT_PHASE`: Server processes splits or bankruptcies.
  * `OPEN_MARKET`: A timed phase (e.g., 60 seconds) where *all* clients can rapidly emit `buy`/`sell` events simultaneously. If all connected players signal they are `isReady`, this phase ends immediately, bypassing the remaining timer.
  * `END_GAME`: Game over. Server calculates final net worth. presents winner.
* **`currentPlayerIndex`** (Number): Index of the player currently yielding the dice.
* **`completedRounds`** (Number): Counter to trigger the next `OPEN_MARKET`.

---

## 2. The Network: Real-Time Event Dictionary
To keep all players fully synchronized, the Server and Clients communicate via real-time events.

### Client-to-Server Events (Actions)
Clients send these requests to the server. The server **validates** them before acting.
* `JOIN_ROOM(roomId, userProfile)`
* `START_GAME()`: (Room Admin only)
* `ROLL_DICE()`: (Only valid if `server.currentPlayerId === client.id`)
* `EXECUTE_TRADE(type, stock, amount shares)`: The server checks if the user has enough cash (for buys) or shares (for sells) at the exact *current server market price*, then executes.
* `REQUEST_LOAN()`: Server checks `hasUsedLoan` and grants $1000.
* `SET_READY(ready)`: Player signals they have finished their actions for the current phase (e.g., `OPEN_MARKET` trades). Server updates their `isReady` state. If all active players evaluate to true, the server advances the phase early.

### Server-to-Client Events (Broadcasts)
The server pushes these payloads to all clients. The clients use these to forcefully overwrite their local UI state.
* `STATE_SYNC(fullGameState)`: Pushed periodically or when a new player reconnects to ensure UI unity.
* `PHASE_CHANGED(newPhase)`: Tells all React/Vue/UI components to swap views (e.g., pop up the trading modal for `OPEN_MARKET`).
* `DICE_ROLLED({ player, result })`: Tells all clients to trigger the 3D dice rolling animation, landing on the specified `result`.
* `MARKET_UPDATED(stockTickData)`: Signals a change in a stock's price to animate the Quotation Board upward or downward.
* `PLAYER_LEDGER_UPDATED(userId, newCash, newPortfolio)`: Updates the specific player's dashboard.
* `TICKER_LOG(message)`: A string broadcasted to update the global Event Ticker (e.g., *"Player 2 bought 5000 shares of Gold!"*).

---

## 3. The Client: UI View Layer
Because the server is the source of truth, the frontend client code becomes a "dumb" renderer that simply listens to WebSockets and updates its React/Vue state.

1. **The Quotation Board (Listens to `MARKET_UPDATED`):** A shared, real-time board. When prices change, CSS transitions slide the indicators up or down smoothly for all players simultaneously.
2. **The Global Leaderboard (Listens to `PLAYER_LEDGER_UPDATED`):** A persistent sidebar showing all connected players, their live cash, and their live net worth. If Player A buys stock, Player B sees Player A's cash drop instantly.
3. **The Personal Dealer / Action Center (Listens to `PHASE_CHANGED`):** 
   - If it's your turn and phase is `ROLLING`, your "Roll Dice" button lights up.
   - If phase is `OPEN_MARKET`, a trading UI activates allowing you to rapidly submit Buy/Sell orders. Input sliders max out based on your specific `cash` from the synchronized server state. Once finished, a prominent "Ready" button allows the user to lock in their trades and signal to the server to advance the phase early if everyone else is also ready.
4. **The Event Ticker (Listens to `TICKER_LOG`):** A scrolling terminal at the bottom of the screen giving a play-by-play of every player's actions worldwide to make the room feel alive (e.g., stock market ticker tape).
