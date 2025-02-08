import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class AbilityParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('特性');
  }

  parse(): Effect | Effect[] | null {
    if (!this.canParse()) return null;

    const effects: Effect[] = [];

    // Parse ability effect
    effects.push(this.createEffect(EffectType.Ability));

    // Parse search effect if present
    if (this.text.includes('山札から') && this.text.includes('手札に加える')) {
      effects.push(
        this.createEffect(EffectType.Search, {
          targets: [
            {
              type: 'pokemon',
              player: 'self',
              location: { type: 'deck' },
              count: 1,
            },
          ],
          timing: {
            type: 'once-per-turn',
            restriction: {
              type: 'ability-not-used',
              abilityName: this.parseAbilityName(),
            },
          },
        })
      );
    }

    return effects.length === 1 ? effects[0] : effects;
  }
}
