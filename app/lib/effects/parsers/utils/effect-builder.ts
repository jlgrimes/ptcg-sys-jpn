import {
  Effect,
  EffectType,
  Target,
  Location,
  Filter,
  Condition,
  Modifier,
} from '../../types';

export class EffectBuilder {
  private effect: Partial<Effect> = {};

  constructor(type: EffectType) {
    this.effect.type = type;
  }

  addTarget(target: Partial<Target>): this {
    if (!this.effect.targets) {
      this.effect.targets = [];
    }
    this.effect.targets.push(target as Target);
    return this;
  }

  addCondition(condition: Condition): this {
    if (!this.effect.conditions) {
      this.effect.conditions = [];
    }
    this.effect.conditions.push(condition);
    return this;
  }

  addModifier(modifier: Modifier): this {
    if (!this.effect.modifiers) {
      this.effect.modifiers = [];
    }
    this.effect.modifiers.push(modifier);
    return this;
  }

  setValue(value: number): this {
    this.effect.value = value;
    return this;
  }

  setTiming(timing: Effect['timing']): this {
    this.effect.timing = timing;
    return this;
  }

  build(): Effect {
    return this.effect as Effect;
  }

  static createTarget(
    type: Target['type'],
    player: Target['player'],
    location: Location,
    options: Partial<Omit<Target, 'type' | 'player' | 'location'>> = {}
  ): Target {
    return {
      type,
      player,
      location,
      ...options,
    };
  }

  static createLocation(
    type: Location['type'],
    options: Partial<Omit<Location, 'type'>> = {}
  ): Location {
    return {
      type,
      ...options,
    };
  }

  static createFilter(type: Filter['type'], value: Filter['value']): Filter {
    return {
      type,
      value,
    };
  }

  static createCondition(
    type: Condition['type'],
    options: Partial<Omit<Condition, 'type'>> = {}
  ): Condition {
    return {
      type,
      ...options,
    };
  }

  static createModifier(
    type: Modifier['type'],
    what: Modifier['what'],
    options: Partial<Omit<Modifier, 'type' | 'what'>> = {}
  ): Modifier {
    return {
      type,
      what,
      ...options,
    };
  }
}
