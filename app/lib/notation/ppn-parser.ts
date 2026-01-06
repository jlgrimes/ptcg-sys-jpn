/**
 * PPN Parser - Parses PTCG Portable Notation into structured game data
 */

import {
  PPNGame,
  PPNMetadata,
  PPNSetup,
  PPNPlayerSetup,
  PPNTurn,
  PPNAction,
  ABBREV_ENERGY,
} from './ppn-types';

export class PPNParser {
  /**
   * Parse a full PPN notation string into a game object
   */
  parseGame(notation: string): PPNGame {
    const lines = notation.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const metadata = this.parseMetadata(lines);
    const setup = this.parseSetup(lines);
    const turns = this.parseTurns(lines);

    return {
      metadata,
      setup,
      turns,
    };
  }

  /**
   * Parse metadata headers
   */
  private parseMetadata(lines: string[]): PPNMetadata {
    const metadata: Partial<PPNMetadata> = {
      player1: 'Player 1',
      player2: 'Player 2',
      seed: 0,
    };

    for (const line of lines) {
      const match = line.match(/^\[(\w+)\s+"([^"]+)"\]$/);
      if (match) {
        const [, key, value] = match;
        switch (key.toLowerCase()) {
          case 'event':
            metadata.event = value;
            break;
          case 'date':
            metadata.date = value;
            break;
          case 'p1':
            metadata.player1 = value;
            break;
          case 'p2':
            metadata.player2 = value;
            break;
          case 'seed':
            metadata.seed = parseInt(value, 10);
            break;
          case 'result':
            metadata.result = value as PPNMetadata['result'];
            break;
          case 'format':
            metadata.format = value;
            break;
        }
      }
    }

    return metadata as PPNMetadata;
  }

  /**
   * Parse setup section
   */
  private parseSetup(lines: string[]): PPNSetup {
    const setup: Partial<PPNSetup> = {
      coinFlipWinner: 1,
      firstPlayer: 1,
      player1: this.createDefaultPlayerSetup(),
      player2: this.createDefaultPlayerSetup(),
    };

    let inSetup = false;

    for (const line of lines) {
      if (line.includes('Setup {')) {
        inSetup = true;
        continue;
      }
      if (line === '}' && inSetup) {
        inSetup = false;
        continue;
      }

      if (inSetup) {
        // Parse CoinFlip
        const coinMatch = line.match(/CoinFlip:\s*P(\d)/);
        if (coinMatch) {
          setup.coinFlipWinner = parseInt(coinMatch[1], 10) as 1 | 2;
        }

        // Parse First
        const firstMatch = line.match(/First:\s*P(\d)/);
        if (firstMatch) {
          setup.firstPlayer = parseInt(firstMatch[1], 10) as 1 | 2;
        }

        // Parse P1 board state
        const p1Match = line.match(/P1:\s*(.+)/);
        if (p1Match) {
          setup.player1 = this.parsePlayerBoard(p1Match[1]);
        }

        // Parse P2 board state
        const p2Match = line.match(/P2:\s*(.+)/);
        if (p2Match) {
          setup.player2 = this.parsePlayerBoard(p2Match[1]);
        }

        // Parse hand/prizes
        const p1HandMatch = line.match(/P1\.Hand:\s*(\d+).*P1\.Prizes:\s*(\d+)/);
        if (p1HandMatch && setup.player1) {
          setup.player1.hand = parseInt(p1HandMatch[1], 10);
          setup.player1.prizes = parseInt(p1HandMatch[2], 10);
        }

        const p2HandMatch = line.match(/P2\.Hand:\s*(\d+).*P2\.Prizes:\s*(\d+)/);
        if (p2HandMatch && setup.player2) {
          setup.player2.hand = parseInt(p2HandMatch[1], 10);
          setup.player2.prizes = parseInt(p2HandMatch[2], 10);
        }
      }
    }

    return setup as PPNSetup;
  }

  /**
   * Parse player board from notation like "Pikachu[ACTIVE] Eevee[B1] Bulbasaur[B2]"
   */
  private parsePlayerBoard(notation: string): PPNPlayerSetup {
    const setup = this.createDefaultPlayerSetup();

    // Match Pokemon with positions
    const pokemonPattern = /(\w+)\[(\w+)\]/g;
    let match;

    while ((match = pokemonPattern.exec(notation)) !== null) {
      const [, name, position] = match;
      if (position === 'ACTIVE') {
        setup.active = name;
      } else if (position.startsWith('B')) {
        setup.bench.push(name);
      }
    }

    return setup;
  }

  private createDefaultPlayerSetup(): PPNPlayerSetup {
    return {
      active: '',
      bench: [],
      hand: 7,
      prizes: 6,
      deck: 53,
    };
  }

  /**
   * Parse turn lines
   */
  private parseTurns(lines: string[]): PPNTurn[] {
    const turns: PPNTurn[] = [];

    for (const line of lines) {
      // Match turn pattern: "2. P1: Action1 Action2 [Prizes: 5-6]"
      const turnMatch = line.match(/^(\d+)\.\s*P(\d):\s*(.+?)(?:\s*\[Prizes:\s*(\d+)-(\d+)\])?$/);
      if (turnMatch) {
        const [, turnNum, player, actionsStr, p1Prizes, p2Prizes] = turnMatch;

        const turn: PPNTurn = {
          turnNumber: parseInt(turnNum, 10),
          player: parseInt(player, 10) as 1 | 2,
          actions: this.parseActions(actionsStr, parseInt(player, 10) as 1 | 2),
        };

        if (p1Prizes && p2Prizes) {
          turn.endState = {
            player1Prizes: parseInt(p1Prizes, 10),
            player2Prizes: parseInt(p2Prizes, 10),
          };
        }

        turns.push(turn);
      }
    }

    return turns;
  }

  /**
   * Parse actions from a string like "Draw(1) Attach(L->Pikachu) Attack(Thunderbolt)"
   */
  private parseActions(actionsStr: string, player: 1 | 2): PPNAction[] {
    const actions: PPNAction[] = [];

    // Match action pattern: "ActionName(params)"
    const actionPattern = /(\w+)\(([^)]*)\)/g;
    let match;

    while ((match = actionPattern.exec(actionsStr)) !== null) {
      const [, actionType, params] = match;
      const action = this.parseAction(actionType, params, player);
      if (action) {
        actions.push(action);
      }
    }

    // Check for Pass
    if (actionsStr.includes('Pass')) {
      actions.push({ type: 'pass', player });
    }

    return actions;
  }

  /**
   * Parse a single action
   */
  private parseAction(type: string, params: string, player: 1 | 2): PPNAction | null {
    switch (type.toLowerCase()) {
      case 'draw':
        return { type: 'draw', player, count: parseInt(params, 10) };

      case 'attach': {
        const [energy, target] = params.split('->');
        const energyType = ABBREV_ENERGY[energy] || energy.toLowerCase();
        return { type: 'attach', player, energyType, target };
      }

      case 'evolve': {
        const [from, to] = params.split('->');
        return { type: 'evolve', player, from, to };
      }

      case 'attack': {
        if (params.includes('->')) {
          const [moveName, target] = params.split('->');
          return { type: 'attack', player, moveName, target };
        }
        return { type: 'attack', player, moveName: params };
      }

      case 'ability': {
        const [source, abilityName] = params.split('.');
        return { type: 'ability', player, source, abilityName };
      }

      case 'play': {
        if (params.includes('->')) {
          const [cardName, target] = params.split('->');
          return { type: 'play', player, cardName, cardType: 'item', target };
        }
        return { type: 'play', player, cardName: params, cardType: 'item' };
      }

      case 'retreat':
      case 'switch': {
        const forced = type.toLowerCase() === 'forcedswitch';
        const [from, to] = params.split('<->');
        return { type: 'switch', player, from, to, forced };
      }

      case 'damage': {
        const parts = params.split(',');
        const amount = parseInt(parts[0], 10);
        const target = parts[1];
        return { type: 'damage', player, amount, target };
      }

      case 'heal': {
        const [amount, target] = params.split(',');
        return { type: 'heal', player, amount: parseInt(amount, 10), target };
      }

      case 'status': {
        const [status, target] = params.split(',');
        const removed = status.startsWith('-');
        return {
          type: 'status',
          player,
          status: (removed ? status.slice(1) : status) as any,
          target,
          removed,
        };
      }

      case 'prize':
        return { type: 'prize', player, count: parseInt(params, 10) };

      case 'coin': {
        if (params.length > 1) {
          return {
            type: 'coin',
            player,
            result: params[0] as 'H' | 'T',
            results: params.split('') as ('H' | 'T')[],
          };
        }
        return { type: 'coin', player, result: params as 'H' | 'T' };
      }

      case 'ko':
      case 'knockout':
        return { type: 'knockout', player, pokemon: params };

      case 'shuffle':
        return { type: 'shuffle', player, what: params as any };

      default:
        return null;
    }
  }
}

/**
 * Quick utility to parse PPN notation
 */
export function parseNotation(notation: string): PPNGame {
  const parser = new PPNParser();
  return parser.parseGame(notation);
}

/**
 * Validate PPN notation syntax
 */
export function validateNotation(notation: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const game = parseNotation(notation);

    if (!game.metadata.seed) {
      errors.push('Missing seed in metadata');
    }
    if (!game.metadata.player1 || !game.metadata.player2) {
      errors.push('Missing player names in metadata');
    }
    if (!game.setup.player1.active || !game.setup.player2.active) {
      errors.push('Missing active Pokemon in setup');
    }
  } catch (e) {
    errors.push(`Parse error: ${e}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
