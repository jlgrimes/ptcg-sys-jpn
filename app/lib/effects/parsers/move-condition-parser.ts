import { BaseEffectParser } from './utils/base-effect-parser';
import { Effect, EffectType } from '../types';
import { EffectBuilder } from './utils/effect-builder';

export class MoveConditionParser extends BaseEffectParser<Effect> {
  canParse(): boolean {
    return (
      this.matcher.hasAny('前の自分の番に') &&
      this.matcher.hasAny('使っていたなら')
    );
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    // Extract move name from quotes
    const moveMatch = this.matcher.matchValue(/「([^」]+)」/);
    if (!moveMatch) return null;

    // Extract damage value
    const damageMatch = this.matcher.matchValue(/(\d+)ダメージ/);
    if (!damageMatch) return null;

    return this.createEffect(EffectType.Damage, {
      value: parseInt(damageMatch),
      conditions: [
        EffectBuilder.createCondition('move-used', {
          move: moveMatch,
          timing: 'last-turn',
        }),
      ],
    });
  }
}
