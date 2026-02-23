import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../src/gameEngine.js';

describe('Security Audit Fixes - GameEngine', () => {
    let engine: GameEngine;
    const socket1 = 'player-1';
    const socket2 = 'player-2';

    beforeEach(() => {
        engine = new GameEngine('TEST_ROOM');
        // Join two players
        engine.joinPlayer(socket1, 'Host Player', '');
        engine.joinPlayer(socket2, 'Attacker', '');
    });

    it('ST-01: prevents unauthorized dice rolls out of turn', () => {
        // Start game (socket1 is host)
        engine.startGame(socket1);

        // Phase is INITIAL_BUY_IN, move to ROLLING
        engine.setPlayerReady(socket1, true);
        engine.setPlayerReady(socket2, true);

        expect(engine.getState().currentPhase).toBe('ROLLING');
        expect(engine.getState().currentPlayerIndex).toBe(0);

        // Socket 2 (Attacker) tries to roll when it's Socket 1's turn
        const consoleSpy = vi.spyOn(console, 'warn');
        engine.rollDice(socket2);

        expect(engine.getState().currentPhase).toBe('ROLLING'); // Should not have advanced to RESOLVING_ROLL
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unauthorized ROLL_DICE attempt'));
        consoleSpy.mockRestore();
    });

    it('ST-04: prevents non-host players from starting the game', () => {
        const engine2 = new GameEngine('NEW_ROOM');
        engine2.joinPlayer(socket1, 'Host', '');
        engine2.joinPlayer(socket2, 'Not Host', '');

        expect(engine2.getState().currentPhase).toBe('LOBBY');

        // Socket 2 tries to start
        engine2.startGame(socket2);
        expect(engine2.getState().currentPhase).toBe('LOBBY'); // Should remains in lobby
    });

    it('ST-04: prevents non-host players from updating settings', () => {
        const initialCash = engine.getState().settings.initialCash;

        // Socket 2 tries to change cash
        engine.updateSettings(socket2, { initialCash: 99999 });

        expect(engine.getState().settings.initialCash).toBe(initialCash);
    });

    it('Logic: prevents trading in unauthorized phases', () => {
        engine.startGame(socket1); // Phase: INITIAL_BUY_IN

        // Move to ROLLING
        engine.setPlayerReady(socket1, true);
        engine.setPlayerReady(socket2, true);

        expect(engine.getState().currentPhase).toBe('ROLLING');

        const initialCash = engine.getState().players[socket1]!.cash;

        // Try to buy stock during rolling phase
        engine.executeTrade(socket1, 'BUY', 'Gold', 10);

        expect(engine.getState().players[socket1]!.cash).toBe(initialCash);
        expect(engine.getState().players[socket1]!.portfolio.Gold).toBe(0);
    });
});
