import { LegacyEffect } from '../effect-parser';
import { Effect, Target, Condition, Modifier, Timing } from './types';

function convertTargets(legacy: LegacyEffect): Target[] | undefined {
  if (!legacy.target) return undefined;

  return [
    {
      type: 'pokemon',
      player: legacy.target,
      location: {
        type: legacy.location || 'active',
      },
      count: legacy.count,
    },
  ];
}

function convertConditions(legacy: LegacyEffect): Condition[] | undefined {
  if (!legacy.coinFlip) return undefined;

  return [
    {
      type: 'coin-flip',
      value: legacy.coinFlip.count,
      onSuccess: legacy.coinFlip.onHeads
        ? [legacy.coinFlip.onHeads]
        : undefined,
      onFailure: legacy.coinFlip.onTails
        ? [legacy.coinFlip.onTails]
        : undefined,
    },
  ];
}

function convertModifiers(legacy: LegacyEffect): Modifier[] | undefined {
  if (!legacy.modifier) return undefined;

  return [
    {
      type: legacy.modifier.type,
      what: legacy.modifier.what,
      value: legacy.modifier.value,
    },
  ];
}

function convertTiming(legacy: LegacyEffect): Timing | undefined {
  if (!legacy.timing) return undefined;

  return {
    type: legacy.timing.type,
    duration: legacy.timing.duration,
  };
}

export function convertToNewEffect(legacy: LegacyEffect): Effect {
  return {
    type: legacy.type,
    targets: convertTargets(legacy),
    conditions: convertConditions(legacy),
    modifiers: convertModifiers(legacy),
    timing: convertTiming(legacy),
    value: legacy.value,
  };
}

// ... conversion helper functions ...
