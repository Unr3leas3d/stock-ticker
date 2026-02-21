# Product Requirements Document (PRD): Stock Ticker - Full-Stack App

## 1. Product Overview
The objective is to build a real-time, digital multiplayer version of the classic "Stock Ticker" board game. The architecture is a client-server model where an authoritative backend server manages all game state, loop phases, and validates actions, pushing updates to clients via WebSockets. The frontend acts as a "dumb" client, rendering the authoritative game state and providing a highly responsive, modern UI. The entire application must be built using 100% free-tier services.

## 2. Technology Stack & Hosting (Cost-Optimized / $0 Free Tier)
*   **Frontend Framework:** React (Next.js)
    *   *Hosting:* **Vercel** (Generous free tier, seamless Next.js integration).
*   **Backend Framework:** Node.js with Express.
    *   *Hosting:* **Render.com** or **Railway** (Both offer free tiers for spinning up Node.js workers/web services. We will design the backend to tolerate sleeping instances if using Render's free tier, or prefer Railway/Koyeb for reliable WebSocket uptimes).
*   **Real-time Communication:** WebSockets using **Socket.io** (client and server) for immediate, bi-directional event emission.
*   **Styling (Frontend):** Tailwind CSS (for layout, responsive design, and custom utility classes).
*   **UI Components:** **shadcn/ui** built on top of **Radix UI** primitives. This is a strict requirement to ensure accessible, customizable, and consistent UI elements across the application.
*   **Icons:** Lucide React (standard with shadcn/ui).

## 3. UI/UX Architecture & Layout
The application will consist of a primary dashboard designed for desktop and mobile, ensuring all critical game mechanics are visible at a glance.

### 3.1. Main Layout Zones
1.  **Header/Navigation Bar:** Displays the Room ID, phase timer (when applicable), and a persistent "Leave Game" or "Settings" menu.
2.  **The Quotation Board (Market Status):** The central visual component displaying the live price of all 6 stocks.
3.  **Player Ledger (Sidebar/Bottom Sheet):** The personal financial dashboard for the active user.
4.  **Action Center (Dealer Area):** Context-aware UI that changes based on the current game phase (e.g., rolling dice vs. trading).
5.  **Global Leaderboard:** A list of all connected players in the room, showing their net worth and online status.
6.  **Event Ticker:** A scrolling ticker tape at the bottom of the screen broadcasting live game events.

## 4. Core Features & Component Mapping (shadcn/ui & Radix UI)

The following UI elements map directly to game states defined in the `game_state_design.md` architecture.

### A. Lobby & Game Setup (`currentPhase: LOBBY`)
*   **Requirements:** Allow users to join a room, enter a profile name/avatar, and wait for the host to start the game.
*   **shadcn/ui Components:**
    *   `Card`: To wrap the join room form.
    *   `Input`: For entering display name.
    *   `Avatar` (Radix UI): To select or display user profile pictures.
    *   `Button`: "Join Room" and "Start Game" (Admin only).
    *   `Table` or `List`: To display players currently in the lobby.

### B. The Quotation Board (`Market State`)
*   **Requirements:** Display the 6 commodities (Gold, Silver, Oil, Industrial, Bonds, Grain), their current value ($1.00 starting), and status. Prices must animate up or down when `MARKET_UPDATED` is received.
*   **shadcn/ui Components:**
    *   `Card`: One card per commodity.
    *   `Badge`: To indicate status (`NORMAL`, `PENDING_SPLIT`, `BANKRUPT`).
    *   *Custom SVG / Recharts*: To render sparkline charts based on the `history` array.

### C. Personal Player Ledger (`Player State`)
*   **Requirements:** Display the user's `$cash` (starts $5000), portfolio (shares owned), and net worth.
*   **shadcn/ui Components:**
    *   `Sheet` (Radix Dialog): On mobile, the ledger can be a pull-up sheet.
    *   `Progress` (Radix Progress): To visualize portfolio distribution (e.g., % of net worth in Gold vs. Cash).
    *   `Tooltip`: Hover over a stock symbol to see total current value of those specific shares.

### D. Action Center (`Turn & Phase Flow State`)
*   **Requirements:** Adaptive UI that responds to `PHASE_CHANGED`.
*   **Rolling Phase (`ROLLING`):**
    *   If `currentPlayerIndex === client.id`: Show a prominent "Roll Dice" `Button`.
    *   If not: Show a `Skeleton` or a disabled state indicating who is currently rolling.
*   **Open Market Phase (`OPEN_MARKET`):**
    *   **shadcn/ui Components:**
        *   `Tabs` (Radix Tabs): Switch between "Buy" and "Sell" modes.
        *   `Select` (Radix Select): Choose which of the 6 stocks to trade.
        *   `Slider` (Radix Slider): Rapidly select the amount of shares to buy/sell, capped automatically by available `cash` or owned shares.
        *   `Button`: Submit trade.
        *   `ToggleGroup` or `Button` (variant="destructive" or "default"): A master "Ready" button to emit `SET_READY`.
*   **Bankrupt/Loan:**
    *   `AlertDialog` (Radix Alert Dialog): Pops up if a user runs out of funds, offering the one-time $1000 `REQUEST_LOAN()`.

### E. Event Ticker (`TICKER_LOG`)
*   **Requirements:** A continuous scrolling feed of actions (e.g., "Player 2 bought 5000 shares of Gold").
*   **shadcn/ui Components:**
    *   `Sonner`: For immediate, high-priority alerts (e.g., "Gold is Bankrupt!").
    *   `ScrollArea` (Radix Scroll Area): For the history of ticker events, ensuring smooth custom scrolling.

## 5. Non-Functional Requirements
*   **Responsiveness:** Use standard Tailwind breakpoints (`sm`, `md`, `lg`, `xl`). The UI must be functional on a mobile phone (e.g., moving the Quotation Board to a swipeable carousel or stacked list, and the Action Center to a fixed bottom bar).
*   **Dark Mode:** Utilize shadcn's built-in CSS variable approach for easy theming. Provide a dark/light mode toggle.
*   **Animations:** Use Tailwind's `animate-*` utilities and `framer-motion` (if needed for complex Layout animations) to ensure price changes, dice rolls, and phase transitions feel fluid and gamified.

## 6. Development Phasing
1.  **Phase 1: Component System Setup:** Initialize Next.js/Vite, install Tailwind, and integrate `shadcn/ui` core components (Buttons, Cards, Inputs, Dialogs).
2.  **Phase 2: Static UI Mockups:** Build out the structural views (Quotation Board, Ledger, Action Center) using hardcoded placeholder state.
3.  **Phase 3: Real-time Integration:** Swap hardcoded state with a WebSocket listener hook that consumes `STATE_SYNC` and updates local React state.
4.  **Phase 4: Polish & Animations:** Add sliding transitions to stock prices, toast notifications for events, and responsive tweaks for mobile layouts.
