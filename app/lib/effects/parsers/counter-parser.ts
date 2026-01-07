import { BaseParser } from './base-parser';
import { Effect, EffectType, CounterEffect, Target } from '../types';

/**
 * Parses damage counter effects from Japanese Pokemon TCG text
 *
 * Patterns:
 * - ダメカンを2個のせる: "Place 2 damage counters"
 * - ダメカン6個を...のせる: "Place 6 damage counters on..."
 * - ダメカンを好きなようにのせる: "Place damage counters as you like"
 * - ダメカンをのせかえる: "Move damage counters"
 */
export class CounterParser extends BaseParser<CounterEffect> {
  canParse(): boolean {
    return (
      this.text.includes('ダメカン') &&
      (this.text.includes('のせる') ||
        this.text.includes('のせかえる') ||
        this.text.includes('取りのぞく') ||
        this.text.includes('動かす'))
    );
  }

  parse(): CounterEffect | null {
    if (!this.canParse()) return null;

    // Move damage counters: ダメカンをのせかえる
    if (this.text.includes('のせかえる') || this.text.includes('動かす')) {
      return this.createCounterEffect('move');
    }

    // Remove damage counters: 取りのぞく
    if (this.text.includes('取りのぞく')) {
      const countMatch = this.text.match(/ダメカン[をが]?(\d+)個/);
      const count = countMatch ? parseInt(countMatch[1], 10) : 1;
      return this.createCounterEffect('remove', count);
    }

    // Place damage counters: ダメカンをXX個のせる or ダメカンXX個を...のせる
    if (this.text.includes('のせる')) {
      // Pattern 1: ダメカンを2個のせる
      const countMatch1 = this.text.match(/ダメカン[をが]?(\d+)個.*のせる/);
      // Pattern 2: ダメカン6個を...のせる
      const countMatch2 = this.text.match(/ダメカン(\d+)個[をが]/);

      const count = countMatch1
        ? parseInt(countMatch1[1], 10)
        : countMatch2
          ? parseInt(countMatch2[1], 10)
          : 1;
      return this.createCounterEffect('place', count);
    }

    return null;
  }

  private createCounterEffect(
    action: 'place' | 'move' | 'remove',
    value: number = 1
  ): CounterEffect {
    const target = this.parseCounterTarget();

    const effect: CounterEffect = {
      type: EffectType.Counter,
      action,
      value,
      targets: [target],
    };

    if (this.timing) {
      effect.timing = this.timing;
    }

    return effect;
  }

  private parseCounterTarget(): Target {
    const target: Partial<Target> = {
      type: 'pokemon',
    };

    // Determine player
    if (this.text.includes('相手の')) {
      target.player = 'opponent';
    } else if (this.text.includes('自分の')) {
      target.player = 'self';
    } else {
      // Default based on context
      target.player = this.text.includes('のせる') ? 'opponent' : 'self';
    }

    // Determine location
    if (this.text.includes('ベンチポケモン')) {
      target.location = { type: 'bench' };
    } else if (this.text.includes('バトルポケモン') || this.text.includes('バトル場')) {
      target.location = { type: 'active' };
    } else if (this.text.includes('ポケモン')) {
      // Generic Pokemon targeting
      target.location = { type: 'field' };
    } else {
      target.location = { type: 'active' };
    }

    // Parse count
    const pokemonCountMatch = this.text.match(/ポケモン(\d+)匹/);
    if (pokemonCountMatch) {
      target.count = parseInt(pokemonCountMatch[1], 10);
    } else if (this.text.includes('好きなように') || this.text.includes('のぞむなら')) {
      target.count = 'all'; // Distribute as you like
    } else {
      target.count = 1;
    }

    return target as Target;
  }
}
