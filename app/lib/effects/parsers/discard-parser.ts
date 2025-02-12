import { BaseParser } from './base-parser';
import { Effect, EffectType, Location } from '../types';

export class DiscardParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('トラッシュ');
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];

    // Add discard effect
    effects.push(
      this.createEffect(EffectType.Discard, {
        targets: [
          {
            type: this.parseTargetType(),
            player: this.parsePlayer(),
            location: this.parseLocation(),
            count: this.parseCount(),
          },
        ],
      })
    );

    // Add draw effect if present
    if (this.text.includes('引く')) {
      const drawMatch = this.text.match(/(\d+)枚引く/);
      if (drawMatch) {
        effects.push(
          this.createEffect(EffectType.Draw, {
            value: parseInt(drawMatch[1]),
            targets: [
              {
                type: this.parseDrawTargetType(),
                player: 'self',
                location: { type: 'deck' },
              },
            ],
          })
        );
      }
    }

    return effects;
  }

  protected parseCount(): number {
    const match = this.text.match(/(\d+)(枚|個)/);
    return match ? parseInt(match[1]) : 1;
  }

  protected parseLocation(): Location {
    if (this.text.includes('手札')) {
      return { type: 'hand' };
    }
    if (this.text.includes('山札')) {
      return { type: 'deck' };
    }
    // For トラッシュして pattern (discard and do something), default to hand
    if (this.text.includes('トラッシュして')) {
      return { type: 'hand' };
    }
    // Default to discard if no specific location mentioned
    return { type: 'discard' };
  }

  protected parseTargetType(): 'pokemon' | 'card' | 'energy' | 'trainer' {
    // In Japanese, 枚 is used for cards, while 個 is more commonly used for other items
    if (this.text.includes('エネルギー')) {
      return 'energy';
    }
    if (this.text.includes('トレーナーズ')) {
      return 'trainer';
    }
    if (this.text.includes('枚')) {
      return 'card';
    }
    return 'pokemon';
  }

  protected parsePlayer(): 'self' | 'opponent' {
    return this.text.includes('相手') ? 'opponent' : 'self';
  }

  private parseDrawTargetType(): 'pokemon' | 'card' {
    // Check if the text specifically mentions drawing Pokemon
    if (this.text.includes('ポケモンを') && this.text.includes('引く')) {
      return 'pokemon';
    }
    // Default to card for general draw effects
    return 'card';
  }
}
