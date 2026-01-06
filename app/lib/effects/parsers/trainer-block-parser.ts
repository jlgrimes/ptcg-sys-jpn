import { BaseParser } from './base-parser';
import { Effect, EffectType, TrainerBlockEffect, Target } from '../types';

/**
 * Parses trainer card blocking effects from Japanese Pokemon TCG text
 *
 * Patterns:
 * - グッズを使えない: "次の相手の番、相手はグッズを使えない"
 * - サポートを使えない: "相手はサポートを使えない"
 * - トレーナーズを使えない: "相手はトレーナーズを使えない"
 */
export class TrainerBlockParser extends BaseParser<TrainerBlockEffect> {
  canParse(): boolean {
    const hasBlock = this.text.includes('使えない') || this.text.includes('使うことができない');

    return hasBlock && (
      this.text.includes('グッズ') ||
      this.text.includes('サポート') ||
      this.text.includes('スタジアム') ||
      this.text.includes('ポケモンのどうぐ') ||
      this.text.includes('トレーナーズ')
    );
  }

  parse(): TrainerBlockEffect | null {
    if (!this.canParse()) return null;

    const blockType = this.parseBlockType();
    if (!blockType) return null;

    const duration = this.parseDuration();

    const target: Target = {
      type: 'trainer',
      player: 'opponent',
      location: { type: 'hand' },
    };

    const effect: TrainerBlockEffect = {
      type: EffectType.TrainerBlock,
      blockType,
      duration,
      targets: [target],
    };

    if (this.timing) {
      effect.timing = this.timing;
    }

    return effect;
  }

  private parseBlockType(): 'goods' | 'supporter' | 'stadium' | 'tool' | 'all-trainers' | null {
    if (this.text.includes('トレーナーズ')) {
      return 'all-trainers';
    }
    if (this.text.includes('グッズ')) {
      return 'goods';
    }
    if (this.text.includes('サポート')) {
      return 'supporter';
    }
    if (this.text.includes('スタジアム')) {
      return 'stadium';
    }
    if (this.text.includes('ポケモンのどうぐ')) {
      return 'tool';
    }
    return null;
  }

  private parseDuration(): 'next-turn' | 'while-active' {
    if (this.text.includes('次の相手の番') || this.text.includes('次の番')) {
      return 'next-turn';
    }
    if (this.text.includes('いる限り') || this.text.includes('バトル場')) {
      return 'while-active';
    }
    return 'next-turn'; // Default
  }
}
