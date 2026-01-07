export enum EffectType {
  // Core effects
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
  Copy = 'copy',

  // New effect types (Phase 3)
  Heal = 'heal',
  Prevention = 'prevention',
  DeckManipulation = 'deck-manipulation',
  TrainerBlock = 'trainer-block',
  RetreatModifier = 'retreat-modifier',
  Prize = 'prize',
  BenchSize = 'bench-size',
  TypeChange = 'type-change',
  Devolution = 'devolution',
  Choice = 'choice',
  Reveal = 'reveal',
  Counter = 'counter', // Place damage counters

  // Legacy mechanics
  PokemonPower = 'pokemon-power',
  PokePower = 'poke-power',
  PokeBody = 'poke-body',
  GxAttack = 'gx-attack',
  VstarPower = 'vstar-power',
}

// Core types
export interface BaseEffect {
  type: EffectType;
  target?: 'self' | 'opponent'; // Simple target for single-target effects
  targets?: Target[];
  conditions?: Condition[];
  modifiers?: Modifier[];
  timing?: Timing;
  value?: number;
  status?: 'paralyzed' | 'asleep' | 'confused' | 'burned' | 'poisoned';
  what?: 'move' | 'ability'; // Used by copy effects to specify what is being copied
  count?: number | 'all'; // Used by copy effects to specify how many to choose from
  // Additional commonly used properties
  destination?: string;
  selection?: 'choose' | 'random' | 'all';
  shuffle?: boolean;
  location?: string;
  source?: string;
  action?: string;
  cardType?: string;
  energyType?: string;
  ignoreWeaknessResistance?: boolean;
  isUpTo?: boolean; // Flag for "up to X" pattern (まで)
  multiplier?: unknown;
  revealLocation?: string;
  targetCount?: number | 'all';
  modifier?: unknown;
  moveName?: string;
  abilityName?: string;
  duration?: string;
  blockType?: string;
  preventType?: string;
  restriction?: string;
  coinFlip?: unknown;
  onHeads?: unknown;
  player?: string;
  revealTo?: string;
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
  subtype?: 'basic' | 'special'; // For energy types
}

export interface Condition {
  type:
    | 'coin-flip'
    | 'card-count'
    | 'status'
    | 'location'
    | 'move-restriction'
    | 'move-used'
    | 'evolution'
    // New condition types
    | 'has-energy'
    | 'has-damage'
    | 'prize-count'
    | 'bench-count'
    | 'pokemon-type'
    | 'turn-count'
    | 'hp-remaining'
    | 'is-ex'
    | 'is-gx'
    | 'is-v'
    | 'is-basic'
    | 'name-contains';
  value?: number;
  values?: number[];
  comparison?: 'equal' | 'not-equal' | 'less-than' | 'greater-than' | 'less-than-or-equal' | 'greater-than-or-equal';
  target?: Target;
  onSuccess?: Effect[];
  onFailure?: Effect[];
  moveName?: string;
  move?: string;
  timing?: 'last-turn' | 'next-turn' | 'on-play';
  restriction?: 'cannot-use';
  duration?: 'next-turn' | 'until-end-of-turn' | 'until-leaves-play';
  energyType?: string; // For has-energy condition
  pokemonType?: string; // For pokemon-type condition
  namePattern?: string; // For name-contains condition
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

export interface CopyEffect extends BaseEffect {
  type: EffectType.Copy;
  targets: [Target]; // The Pokemon whose move we're copying
  filters?: Filter[]; // Any filters on what can be copied (e.g. specific Pokemon name)
  what: 'move'; // What we're copying (for future extensibility)
  count?: number; // How many to choose from, if specified
}

// New effect types (Phase 3)
export interface HealEffect extends BaseEffect {
  type: EffectType.Heal;
  value: number; // HP to heal or damage counters to remove
  unit: 'hp' | 'damage-counters'; // Whether value is HP or damage counter count
}

export interface PreventionEffect extends BaseEffect {
  type: EffectType.Prevention;
  preventType: 'damage' | 'effects' | 'all';
  duration: 'next-attack' | 'next-turn' | 'while-active';
  reduction?: number; // For partial prevention (e.g., -30 damage)
}

export interface DeckManipulationEffect extends BaseEffect {
  type: EffectType.DeckManipulation;
  action: 'look' | 'rearrange' | 'put-on-top' | 'put-on-bottom' | 'shuffle-into';
  count?: number; // Number of cards to look at/manipulate
}

export interface TrainerBlockEffect extends BaseEffect {
  type: EffectType.TrainerBlock;
  blockType: 'goods' | 'supporter' | 'stadium' | 'tool' | 'all-trainers';
  duration: 'next-turn' | 'while-active';
}

export interface RetreatModifierEffect extends BaseEffect {
  type: EffectType.RetreatModifier;
  modification: number; // Positive = increase cost, negative = decrease
}

export interface PrizeEffect extends BaseEffect {
  type: EffectType.Prize;
  action: 'take-extra' | 'look' | 'swap' | 'put-back';
  count?: number;
}

export interface RevealEffect extends BaseEffect {
  type: EffectType.Reveal;
  revealTo: 'self' | 'opponent' | 'both';
}

export interface CounterEffect extends BaseEffect {
  type: EffectType.Counter;
  value: number; // Number of damage counters
  action: 'place' | 'move' | 'remove';
}

export interface ChoiceEffect extends BaseEffect {
  type: EffectType.Choice;
  options: Effect[][]; // Array of effect sequences to choose from
  choiceCount: number; // How many options to choose (usually 1)
}

export type Effect = BaseEffect;
