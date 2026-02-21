const crypto = require('crypto');

/**
 * A cryptographically secure dice roller for the Stock Ticker game.
 * Standard Math.random() is susceptible to slight biases and predictability.
 * Using Node's built-in crypto module ensures a truly uniform, robust random distribution.
 */
class StockTickerDice {
    constructor() {
        // Die 1: Direction ("Up", "Down", "Div" - twice each)
        this.directionDie = ["Up", "Down", "Div", "Up", "Down", "Div"];

        // Die 2: Amount (5, 10, 20 - twice each)
        this.amountDie = [5, 10, 20, 5, 10, 20];

        // Die 3: Stock/Commodity based on equipment
        this.stockDie = ["Gold", "Silver", "Oil", "Industrial", "Bonds", "Grain"];
    }

    /**
     * Helper to roll a single die securely.
     * @param {Array} dieArray - The array representing the die faces
     * @returns {string|number} The rolled value
     */
    rollSingleDie(dieArray) {
        // crypto.randomInt ensures uniformly distributed random numbers and automatically handles modulo bias.
        const randomIndex = crypto.randomInt(0, dieArray.length);
        return dieArray[randomIndex];
    }

    /**
     * Rolls all three game dice securely together.
     * @returns {Object} Structured roll result with a nice string representation
     */
    roll() {
        const stock = this.rollSingleDie(this.stockDie);
        const direction = this.rollSingleDie(this.directionDie);
        const amount = this.rollSingleDie(this.amountDie);

        return {
            stock,
            direction,
            amount,
            toString: () => `${stock} ${direction} ${amount}`
        };
    }
}

// --- Demonstration / Testing ---
if (require.main === module) {
    const gameDice = new StockTickerDice();

    console.log("🎲 Commencing Cryptographically Secure Game Rolls 🎲\\n");
    for (let i = 1; i <= 5; i++) {
        // Implicitly calls toString()
        console.log(`Roll ${i}: ${gameDice.roll()}`);
    }
}

module.exports = StockTickerDice;
