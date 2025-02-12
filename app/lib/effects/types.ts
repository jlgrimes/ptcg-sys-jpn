export enum EffectType {
  Damage = 'damage',
  Draw = 'draw',
  Search = 'search',
  Discard = 'discard',
  Status = 'status',
  Energy = 'energy',
  Place = 'place',
  Ability = 'ability',
  Restriction = 'restriction',
  Condition = 'condition',
  MoveFailure = 'move-failure',
  Shuffle = 'shuffle',
  Switch = 'switch',
}

// Core types
export interface BaseEffect {
  type: EffectType;
  targets?: Target[];
  conditions?: Condition[];
  modifiers?: Modifier[];
  timing?: Timing;
  value?: number;
  status?: 'paralyzed' | 'asleep' | 'confused' | 'burned' | 'poisoned';
}

export interface Target {
  type: 'pokemon' | 'card' | 'energy' | 'trainer';
  player: 'self' | 'opponent' | 'both';
  location: Location;
  filters?: Filter[];
  count?: number | 'all';
}

export interface Location {
  type: 'deck' | 'hand' | 'discard' | 'bench' | 'active' | 'field' | 'prize';
  reveal?: boolean;
  shuffle?: boolean;
}

export interface Filter {
  type: 'card-type' | 'energy-type' | 'status' | 'evolution-stage' | 'hp';
  value: string | number;
  comparison?: 'less-than-or-equal' | 'equal' | 'not-equal';
}

export interface Condition {
  type:
    | 'coin-flip'
    | 'card-count'
    | 'status'
    | 'location'
    | 'move-restriction'
    | 'move-used';
  value?: number;
  values?: number[];
  comparison?: 'equal' | 'not-equal';
  target?: Target;
  onSuccess?: Effect[];
  onFailure?: Effect[];
  moveName?: string;
  move?: string;
  timing?: 'last-turn' | 'next-turn';
  restriction?: 'cannot-use';
  duration?: 'next-turn';
}

export interface Modifier {
  type:
    | 'multiply'
    | 'ignore'
    | 'prevent'
    | 'add'
    | 'remove'
    | 'immunity'
    | 'nullify';
  what:
    | 'damage'
    | 'effects'
    | 'weakness'
    | 'resistance'
    | 'retreat-cost'
    | 'ability';
  value?: number;
  condition?: Condition;
}

export interface Timing {
  type: 'immediate' | 'continuous' | 'once-per-turn' | 'on-evolution';
  duration?: 'turn' | 'game';
  trigger?: Condition;
  condition?: 'active';
  restriction?: {
    type: 'ability-not-used';
    abilityName: string;
  };
}

// Effect-specific types
export interface DamageEffect extends BaseEffect {
  type: EffectType.Damage;
  value: number;
}

export interface DrawEffect extends BaseEffect {
  type: EffectType.Draw;
  value: number;
}

export interface SearchEffect extends BaseEffect {
  type: EffectType.Search;
}

export interface DiscardEffect extends BaseEffect {
  type: EffectType.Discard;
}

export interface AbilityEffect extends BaseEffect {
  type: EffectType.Ability;
}

export interface StatusEffect extends BaseEffect {
  type: EffectType.Status;
  status: 'paralyzed' | 'asleep' | 'confused' | 'burned' | 'poisoned';
}

export interface EnergyEffect extends BaseEffect {
  type: EffectType.Energy;
}

export interface PlaceEffect extends BaseEffect {
  type: EffectType.Place;
}

export interface SwitchEffect extends BaseEffect {
  type: EffectType.Switch;
}

export type Effect = BaseEffect;
