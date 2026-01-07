import { BaseParser } from './base-parser';
import { Effect, EffectType, SwitchEffect, Target } from '../types';

/**
 * Parses self-switch effects from Japanese Pokemon TCG text
 *
 * Patterns:
 * - このポケモンをバトルポケモンと入れ替える: "Switch this Pokemon with active"
 * - このポケモンをベンチポケモンと入れ替える: "Switch this Pokemon with bench"
 * - バトル場に出たとき...バトルポケモンと入れ替える: "When played to active, switch"
 */
export class SelfSwitchParser extends BaseParser<SwitchEffect> {
  canParse(): boolean {
    return (
      (this.text.includes('入れ替える') || this.text.includes('入れかえる')) &&
      (this.text.includes('このポケモン') || this.text.includes('バトルポケモン'))
    );
  }

  parse(): SwitchEffect | null {
    if (!this.canParse()) return null;

    // Determine switch direction
    const switchToBench = this.text.includes('ベンチポケモンと入れ替える') ||
                          this.text.includes('ベンチポケモンと入れかえる');
    const switchToActive = this.text.includes('バトルポケモンと入れ替える') ||
                           this.text.includes('バトルポケモンと入れかえる');

    const effect: SwitchEffect = {
      type: EffectType.Switch,
      targets: [
        {
          type: 'pokemon',
          player: 'self',
          location: { type: switchToBench ? 'active' : 'bench' },
        },
      ],
    };

    if (this.timing) {
      effect.timing = this.timing;
    }

    return effect;
  }
}
