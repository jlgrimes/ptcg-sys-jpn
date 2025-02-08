import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class MoveRestrictionParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('使えない');
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const moveNameMatch = this.text.match(/「([^」]+)」/);
    if (!moveNameMatch) return null;

    const effect: Partial<Effect> = {
      type: EffectType.Restriction,
      targets: [
        {
          type: 'pokemon',
          player: 'self',
          location: {
            type: 'active',
          },
        },
      ],
      conditions: [
        {
          type: 'move-restriction',
          moveName: moveNameMatch[1],
          restriction: 'cannot-use',
          duration: 'next-turn',
        },
      ],
    };

    return effect as Effect;
  }
}
