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

    return this.createEffect(EffectType.Damage, {
      value: this.parseDamageValue(),
      targets: [
        {
          type: 'pokemon',
          player: this.parsePlayer(),
          location: { type: 'bench' },
          count: this.text.includes('全員') ? 'all' : 1,
        },
      ],
    });
  }
}
