import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class BenchDamageParser extends BaseParser<Effect> {
  canParse(): boolean {
    // Only parse if it's specifically about bench damage
    return (
      this.text.includes('ベンチポケモン') &&
      this.text.includes('ダメージ') &&
      !this.text.includes('バトルポケモン') && // Avoid matching when it's about battle pokemon
      !this.text.includes('効果を計算しない') // Avoid matching when it's about effect calculation
    );
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const effect: Partial<Effect> = {
      type: EffectType.Damage,
      value: this.parseDamageValue(),
      targets: [
        {
          type: 'pokemon',
          player: this.text.includes('相手の') ? 'opponent' : 'self',
          location: {
            type: 'bench',
          },
          count: this.text.includes('全員') ? 'all' : 1,
        },
      ],
    };

    // Only add modifiers if explicitly mentioned
    if (this.text.includes('弱点・抵抗力を計算しない')) {
      effect.modifiers = [
        {
          type: 'ignore',
          what: 'effects',
        },
      ];
    }

    return effect as Effect;
  }

  private parseDamageValue(): number {
    const match = this.text.match(/(\d+)ダメージ/);
    return match ? parseInt(match[1]) : 0;
  }
}
