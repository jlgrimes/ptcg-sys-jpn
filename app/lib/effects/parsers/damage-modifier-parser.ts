import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class DamageModifierParser extends BaseParser<Effect> {
  canParse(): boolean {
    // Only parse if it's about damage calculation and effects
    return (
      this.text.includes('計算しない') &&
      this.text.includes('効果') &&
      this.text.includes('ダメージ')
    );
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    // Extract damage value if present
    const damageMatch = this.text.match(/(\d+)ダメージ/);
    const damageValue = damageMatch ? parseInt(damageMatch[1]) : undefined;

    // Return a single damage effect with modifiers
    return {
      type: EffectType.Damage,
      ...(damageValue !== undefined && { value: damageValue }),
      targets: [
        {
          type: 'pokemon',
          player: 'opponent',
          location: {
            type: 'active',
          },
        },
      ],
      modifiers: [
        {
          type: 'ignore',
          what: 'effects',
        },
      ],
    } as Effect;
  }
}
