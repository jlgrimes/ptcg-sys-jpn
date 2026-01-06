/**
 * PPN Generator - Converts game actions to PTCG Portable Notation
 */

import {
  PPNGame,
  PPNMetadata,
  PPNSetup,
  PPNTurn,
  PPNAction,
  PPNDrawAction,
  PPNAttachAction,
  PPNEvolveAction,
  PPNAttackAction,
  PPNAbilityAction,
  PPNPlayAction,
  PPNRetreatAction,
  PPNSwitchAction,
  PPNDamageAction,
  PPNHealAction,
  PPNStatusAction,
  PPNPrizeAction,
  PPNCoinAction,
  PPNChoiceAction,
  PPNKnockoutAction,
  PPNSearchAction,
  PPNDiscardAction,
  PPNShuffleAction,
  ENERGY_ABBREV,
} from './ppn-types';

export class PPNGenerator {
  /**
   * Generate full PPN notation for a game
   */
  generateGame(game: PPNGame): string {
    const lines: string[] = [];

    // Metadata headers
    lines.push(...this.generateMetadata(game.metadata));
    lines.push('');

    // Setup
    lines.push(...this.generateSetup(game.setup));
    lines.push('');

    // Turns
    for (const turn of game.turns) {
      lines.push(this.generateTurn(turn));
    }

    return lines.join('\n');
  }

  /**
   * Generate metadata headers
   */
  private generateMetadata(metadata: PPNMetadata): string[] {
    const lines: string[] = [];

    if (metadata.event) {
      lines.push(`[Event "${metadata.event}"]`);
    }
    if (metadata.date) {
      lines.push(`[Date "${metadata.date}"]`);
    }
    lines.push(`[P1 "${metadata.player1}"]`);
    lines.push(`[P2 "${metadata.player2}"]`);
    lines.push(`[Seed "${metadata.seed}"]`);
    if (metadata.result) {
      lines.push(`[Result "${metadata.result}"]`);
    }
    if (metadata.format) {
      lines.push(`[Format "${metadata.format}"]`);
    }

    return lines;
  }

  /**
   * Generate setup notation
   */
  private generateSetup(setup: PPNSetup): string[] {
    const lines: string[] = [];

    lines.push(`1. Setup {`);
    lines.push(`  CoinFlip: P${setup.coinFlipWinner} wins`);
    lines.push(`  First: P${setup.firstPlayer}`);
    lines.push(`  P1: ${setup.player1.active}[ACTIVE]${setup.player1.bench.length > 0 ? ' ' + setup.player1.bench.map((p, i) => `${p}[B${i + 1}]`).join(' ') : ''}`);
    lines.push(`  P1.Hand: ${setup.player1.hand}, P1.Prizes: ${setup.player1.prizes}`);
    lines.push(`  P2: ${setup.player2.active}[ACTIVE]${setup.player2.bench.length > 0 ? ' ' + setup.player2.bench.map((p, i) => `${p}[B${i + 1}]`).join(' ') : ''}`);
    lines.push(`  P2.Hand: ${setup.player2.hand}, P2.Prizes: ${setup.player2.prizes}`);
    lines.push(`}`);

    return lines;
  }

  /**
   * Generate a single turn's notation
   */
  generateTurn(turn: PPNTurn): string {
    const actionStrs = turn.actions.map(a => this.generateAction(a));
    const actionsStr = actionStrs.join(' ');

    let turnStr = `${turn.turnNumber}. P${turn.player}: ${actionsStr}`;

    if (turn.endState) {
      turnStr += ` [Prizes: ${turn.endState.player1Prizes}-${turn.endState.player2Prizes}]`;
    }

    return turnStr;
  }

  /**
   * Generate notation for a single action
   */
  generateAction(action: PPNAction): string {
    switch (action.type) {
      case 'draw':
        return this.generateDraw(action as PPNDrawAction);
      case 'attach':
        return this.generateAttach(action as PPNAttachAction);
      case 'evolve':
        return this.generateEvolve(action as PPNEvolveAction);
      case 'attack':
        return this.generateAttack(action as PPNAttackAction);
      case 'ability':
        return this.generateAbility(action as PPNAbilityAction);
      case 'play':
        return this.generatePlay(action as PPNPlayAction);
      case 'retreat':
        return this.generateRetreat(action as PPNRetreatAction);
      case 'switch':
        return this.generateSwitch(action as PPNSwitchAction);
      case 'damage':
        return this.generateDamage(action as PPNDamageAction);
      case 'heal':
        return this.generateHeal(action as PPNHealAction);
      case 'status':
        return this.generateStatus(action as PPNStatusAction);
      case 'prize':
        return this.generatePrize(action as PPNPrizeAction);
      case 'coin':
        return this.generateCoin(action as PPNCoinAction);
      case 'choice':
        return this.generateChoice(action as PPNChoiceAction);
      case 'knockout':
        return this.generateKnockout(action as PPNKnockoutAction);
      case 'search':
        return this.generateSearch(action as PPNSearchAction);
      case 'discard':
        return this.generateDiscard(action as PPNDiscardAction);
      case 'shuffle':
        return this.generateShuffle(action as PPNShuffleAction);
      case 'pass':
        return 'Pass';
      default:
        return `Unknown(${action.type})`;
    }
  }

  private generateDraw(action: PPNDrawAction): string {
    return `Draw(${action.count})`;
  }

  private generateAttach(action: PPNAttachAction): string {
    const energy = ENERGY_ABBREV[action.energyType.toLowerCase()] || action.energyType;
    return `Attach(${energy}->${action.target})`;
  }

  private generateEvolve(action: PPNEvolveAction): string {
    return `Evolve(${action.from}->${action.to})`;
  }

  private generateAttack(action: PPNAttackAction): string {
    if (action.target) {
      return `Attack(${action.moveName}->${action.target})`;
    }
    return `Attack(${action.moveName})`;
  }

  private generateAbility(action: PPNAbilityAction): string {
    return `Ability(${action.source}.${action.abilityName})`;
  }

  private generatePlay(action: PPNPlayAction): string {
    if (action.target) {
      return `Play(${action.cardName}->${action.target})`;
    }
    return `Play(${action.cardName})`;
  }

  private generateRetreat(action: PPNRetreatAction): string {
    let str = `Retreat(${action.from}<->${action.to})`;
    if (action.energyDiscarded && action.energyDiscarded.length > 0) {
      const energyStr = action.energyDiscarded
        .map(e => ENERGY_ABBREV[e.toLowerCase()] || e)
        .join('');
      str += `[-${energyStr}]`;
    }
    return str;
  }

  private generateSwitch(action: PPNSwitchAction): string {
    const prefix = action.forced ? 'ForcedSwitch' : 'Switch';
    return `${prefix}(${action.from}<->${action.to})`;
  }

  private generateDamage(action: PPNDamageAction): string {
    let str = `Damage(${action.amount},${action.target})`;
    if (action.source) {
      str = `Damage(${action.amount},${action.target},from:${action.source})`;
    }
    return str;
  }

  private generateHeal(action: PPNHealAction): string {
    return `Heal(${action.amount},${action.target})`;
  }

  private generateStatus(action: PPNStatusAction): string {
    if (action.removed) {
      return `Status(-${action.status},${action.target})`;
    }
    return `Status(${action.status},${action.target})`;
  }

  private generatePrize(action: PPNPrizeAction): string {
    return `Prize(${action.count})`;
  }

  private generateCoin(action: PPNCoinAction): string {
    if (action.results && action.results.length > 1) {
      return `Coin(${action.results.join('')})`;
    }
    return `Coin(${action.result})`;
  }

  private generateChoice(action: PPNChoiceAction): string {
    return `Choice(${action.selected})`;
  }

  private generateKnockout(action: PPNKnockoutAction): string {
    return `KO(${action.pokemon})`;
  }

  private generateSearch(action: PPNSearchAction): string {
    return `Search(${action.source},[${action.found.join(',')}])`;
  }

  private generateDiscard(action: PPNDiscardAction): string {
    return `Discard([${action.cards.join(',')}],${action.from})`;
  }

  private generateShuffle(action: PPNShuffleAction): string {
    return `Shuffle(${action.what})`;
  }
}

/**
 * Quick utility to generate a single action notation
 */
export function actionToNotation(action: PPNAction): string {
  const generator = new PPNGenerator();
  return generator.generateAction(action);
}

/**
 * Quick utility to generate a full game notation
 */
export function gameToNotation(game: PPNGame): string {
  const generator = new PPNGenerator();
  return generator.generateGame(game);
}
