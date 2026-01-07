import { BaseParser } from './base-parser';
import { Effect, EffectType, BaseEffect, Condition, Target } from '../types';

/**
 * Parses special play conditions from Japanese Pokemon TCG text
 *
 * Patterns:
 * - 特性の効果によってしか場に出せない: "Can only be played via ability effect"
 * - 進化せずにベンチに出せる: "Can be played to bench without evolving"
 * - 「〇〇」からのみ進化できる: "Can only evolve from XX"
 * - 最初の自分の番にも手札から出せる: "Can be played from hand on first turn"
 */
export class SpecialPlayParser extends BaseParser<BaseEffect> {
  canParse(): boolean {
    return (
      (this.text.includes('場に出せない') && this.text.includes('しか')) ||
      (this.text.includes('進化せず') && this.text.includes('ベンチに出せる')) ||
      (this.text.includes('からのみ進化') || this.text.includes('からのみ進化できる')) ||
      this.text.includes('最初の自分の番にも') ||
      (this.text.includes('ベンチに出') && this.text.includes('ことができる')) ||
      // Special evolution patterns like Eevee ex (full text)
      (this.text.includes('から進化する') && this.text.includes('進化できる')) ||
      // Special evolution - first segment pattern after split (手札から出して)
      (this.text.includes('から進化する') && this.text.includes('手札から出して'))
    );
  }

  parse(): BaseEffect | null {
    if (!this.canParse()) return null;

    // Can only be played via specific method
    if (this.text.includes('場に出せない') && this.text.includes('しか')) {
      return this.createPlayRestrictionEffect();
    }

    // Can be played without evolving
    if (this.text.includes('進化せず') && this.text.includes('ベンチに出せる')) {
      return this.createEvolutionSkipEffect();
    }

    // Can only evolve from specific Pokemon
    const evolveFromMatch = this.text.match(/「([^」]+)」からのみ進化/);
    if (evolveFromMatch) {
      return this.createSpecificEvolutionEffect(evolveFromMatch[1]);
    }

    // Can be played on first turn
    if (this.text.includes('最初の自分の番にも')) {
      return this.createFirstTurnPlayEffect();
    }

    // General "can be played to bench" effects
    if (this.text.includes('ベンチに出') && this.text.includes('ことができる')) {
      return this.createBenchPlayEffect();
    }

    // Special evolution pattern: 「XX」から進化する「YY」を...進化できる
    // Also handles segmented version: 「XX」から進化する...手札から出して
    const specialEvolveMatch = this.text.match(/「([^」]+)」から進化する/);
    if (specialEvolveMatch && (this.text.includes('進化できる') || this.text.includes('手札から出して'))) {
      return this.createSpecialEvolutionAbility(specialEvolveMatch[1]);
    }

    return null;
  }

  private createSpecialEvolutionAbility(basePokemon: string): BaseEffect {
    // This Pokemon can evolve into evolutions of the specified base Pokemon
    const condition: Condition = {
      type: 'name-contains',
      namePattern: basePokemon,
    };

    const effect: BaseEffect = {
      type: EffectType.Ability,
      targets: [
        {
          type: 'pokemon',
          player: 'self',
          location: { type: 'active' },
        },
      ],
      conditions: [condition],
    };

    if (this.timing) {
      effect.timing = this.timing;
    }

    return effect;
  }

  private createPlayRestrictionEffect(): BaseEffect {
    // Extract what method allows playing
    let method = 'ability';
    if (this.text.includes('特性')) {
      method = 'ability';
    } else if (this.text.includes('ワザ')) {
      method = 'move';
    } else if (this.text.includes('グッズ') || this.text.includes('トレーナー')) {
      method = 'trainer';
    }

    const condition: Condition = {
      type: 'location',
      value: 0, // Cannot be played normally
    };

    const effect: BaseEffect = {
      type: EffectType.Restriction,
      conditions: [condition],
    };

    // Store additional metadata in modifiers
    effect.modifiers = [
      {
        type: 'nullify',
        what: 'ability', // Using ability as placeholder
        value: 0,
      },
    ];

    return effect;
  }

  private createEvolutionSkipEffect(): BaseEffect {
    const effect: BaseEffect = {
      type: EffectType.Place,
      targets: [
        {
          type: 'pokemon',
          player: 'self',
          location: { type: 'bench' },
        },
      ],
      conditions: [
        {
          type: 'evolution',
          value: 0, // Skip evolution requirement
        },
      ],
    };

    return effect;
  }

  private createSpecificEvolutionEffect(fromPokemon: string): BaseEffect {
    const condition: Condition = {
      type: 'name-contains',
      namePattern: fromPokemon,
    };

    const effect: BaseEffect = {
      type: EffectType.Restriction,
      conditions: [condition],
    };

    return effect;
  }

  private createFirstTurnPlayEffect(): BaseEffect {
    const condition: Condition = {
      type: 'turn-count',
      value: 1,
      comparison: 'equal',
    };

    const effect: BaseEffect = {
      type: EffectType.Place,
      targets: [
        {
          type: 'pokemon',
          player: 'self',
          location: { type: 'bench' },
        },
      ],
      conditions: [condition],
    };

    return effect;
  }

  private createBenchPlayEffect(): BaseEffect {
    const effect: BaseEffect = {
      type: EffectType.Place,
      targets: [
        {
          type: 'pokemon',
          player: 'self',
          location: { type: 'bench' },
        },
      ],
    };

    if (this.timing) {
      effect.timing = this.timing;
    }

    return effect;
  }
}
