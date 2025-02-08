import { Effect, EffectType } from '../types';

export function parseDamageEffect(text: string): Effect {
  const effect: Partial<Effect> = {
    type: EffectType.Damage,
  };

  const value = parseDamageValue(text);
  if (value) effect.value = value;

  const targets = parseTargets(text);
  if (targets) effect.targets = targets;

  const conditions = parseConditions(text);
  if (conditions) effect.conditions = conditions;

  const modifiers = parseModifiers(text);
  if (modifiers) effect.modifiers = modifiers;

  return effect as Effect;
}
