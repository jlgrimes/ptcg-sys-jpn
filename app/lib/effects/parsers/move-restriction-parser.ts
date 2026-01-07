import { BaseParser } from './base-parser';
import { Effect, EffectType, Condition } from '../types';

export class MoveRestrictionParser extends BaseParser<Effect> {
  canParse(): boolean {
    // Match "ワザが使えない" or "ワザを使えない" patterns
    // Also match specific move names in quotes: 「アイアンテール」を使えない
    return (
      (this.text.includes('ワザ') && this.text.includes('使えない')) ||
      (this.text.includes('にげられない')) || // Can't retreat
      (this.text.match(/「[^」]+」[をは]使えない/) !== null) // Specific move restriction
    );
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    // Handle retreat restriction: "このワザを受けたポケモンは、にげられない"
    if (this.text.includes('にげられない')) {
      return this.parseRetreatRestriction();
    }

    // Handle move restriction
    return this.parseMoveRestriction();
  }

  private parseMoveRestriction(): Effect | null {
    // Check for specific move name in quotes
    const moveNameMatch = this.text.match(/「([^」]+)」/);

    // Determine if it's "this Pokemon" or "opponent's Pokemon"
    const isOpponent = this.text.includes('相手');
    const isSelf = this.text.includes('自分') || this.text.includes('このポケモン');

    // Determine timing (next turn)
    const isNextTurn = this.text.includes('次の') || this.text.includes('次の自分の番');
    const isOpponentNextTurn = this.text.includes('次の相手の番');

    const condition: Condition = {
      type: 'move-restriction',
      restriction: 'cannot-use',
      duration: 'next-turn',
    };

    // If specific move name, add it
    if (moveNameMatch) {
      condition.moveName = moveNameMatch[1];
    }

    const effect: Partial<Effect> = {
      type: EffectType.Restriction,
      targets: [
        {
          type: 'pokemon',
          player: isSelf ? 'self' : 'opponent',
          location: { type: 'active' },
        },
      ],
      conditions: [condition],
    };

    return effect as Effect;
  }

  private parseRetreatRestriction(): Effect | null {
    // "次の相手の番、このワザを受けたポケモンは、にげられない"
    const isNextTurn = this.text.includes('次の');

    const effect: Partial<Effect> = {
      type: EffectType.Restriction,
      targets: [
        {
          type: 'pokemon',
          // The target is usually the opponent's Pokemon that was hit
          player: this.text.includes('このワザを受けた') ? 'opponent' : 'self',
          location: { type: 'active' },
        },
      ],
      conditions: [
        {
          type: 'move-restriction',
          restriction: 'cannot-use',
          duration: isNextTurn ? 'next-turn' : undefined,
          moveName: 'retreat', // Special marker for retreat
        },
      ],
    };

    return effect as Effect;
  }
}
