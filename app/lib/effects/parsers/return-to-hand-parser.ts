import { BaseParser } from './base-parser';
import { Effect, EffectType, BaseEffect, Target } from '../types';

/**
 * Parses return-to-hand effects from Japanese Pokemon TCG text
 *
 * Patterns:
 * - このポケモンと、ついているすべてのカードを、手札にもどす: "Return this Pokemon and all attached cards to hand"
 * - 手札にもどす: "Return to hand"
 * - 手札にもどる: "Returns to hand"
 */
export class ReturnToHandParser extends BaseParser<BaseEffect> {
  canParse(): boolean {
    return (
      this.text.includes('手札にもどす') ||
      this.text.includes('手札にもどる') ||
      this.text.includes('手札に戻す') ||
      this.text.includes('手札に戻る')
    );
  }

  parse(): BaseEffect | null {
    if (!this.canParse()) return null;

    // Determine what is being returned
    const target = this.parseReturnTarget();

    const effect: BaseEffect = {
      type: EffectType.Place, // Using Place type for movement
      targets: [target],
    };

    // Add condition if it includes attached cards
    if (this.text.includes('ついているすべてのカード')) {
      effect.conditions = [
        {
          type: 'card-count',
          value: -1, // -1 indicates "all attached"
        },
      ];
    }

    if (this.timing) {
      effect.timing = this.timing;
    }

    return effect;
  }

  private parseReturnTarget(): Target {
    const target: Partial<Target> = {
      type: 'pokemon',
      player: 'self',
      location: { type: 'hand' },
    };

    // Check what is being returned
    if (this.text.includes('このポケモン')) {
      target.count = 1;
    } else if (this.text.includes('相手')) {
      target.player = 'opponent';
    }

    return target as Target;
  }
}
