import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class SwitchParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('入れ替える') || this.text.includes('交代');
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];
    const player = this.text.includes('相手の') ? 'opponent' : 'self';
    const count = this.parseCount('pokemon');

    // First switch effect (opponent's bench to active)
    if (this.text.includes('相手のベンチポケモン')) {
      effects.push(
        this.createEffect(EffectType.Switch, {
          targets: [
            {
              type: 'pokemon',
              player: 'opponent',
              location: { type: 'bench' },
              count: 1,
            },
            {
              type: 'pokemon',
              player: 'opponent',
              location: { type: 'active' },
              count: 1,
            },
          ],
        })
      );
    }

    // Second switch effect (your active to bench)
    if (this.text.includes('自分のバトルポケモン')) {
      effects.push(
        this.createEffect(EffectType.Switch, {
          targets: [
            {
              type: 'pokemon',
              player: 'self',
              location: { type: 'active' },
              count: 1,
            },
            {
              type: 'pokemon',
              player: 'self',
              location: { type: 'bench' },
              count: 1,
            },
          ],
        })
      );
    }

    return effects;
  }
}
