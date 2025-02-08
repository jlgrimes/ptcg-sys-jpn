import { BaseParser } from './base-parser';
import { DamageEffect, EffectType } from '../types';

export class DamageParser extends BaseParser<DamageEffect> {
  canParse(): boolean {
    return this.text.includes('ダメージ');
  }

  parse(): DamageEffect | null {
    if (!this.canParse()) return null;

    const damageMatch = this.text.match(/(\d+)ダメージ/);
    if (!damageMatch) return null;

    const effect: Partial<DamageEffect> = {
      type: EffectType.Damage,
      value: parseInt(damageMatch[1]),
    };

    const targets = this.parseTargets();
    if (targets) effect.targets = targets;

    const modifiers = this.parseModifiers();
    if (modifiers) effect.modifiers = modifiers;

    const conditions = this.parseConditions();
    if (conditions) effect.conditions = conditions;

    return effect as DamageEffect;
  }
}
