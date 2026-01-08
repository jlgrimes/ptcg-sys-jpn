/**
 * Condition evaluator - evaluates conditions for effect execution
 */

import { GameState } from '../../../notation/training-format';
import { Condition, Effect } from '../../types';
import { ExecutionContext, ExecutionMessage } from '../types';
import { resolveTarget, countBenchPokemon, getAllPokemonInPlay } from './target-resolver';

/**
 * Result of condition evaluation
 */
export interface ConditionResult {
  passed: boolean;
  successEffects?: Effect[];
  failureEffects?: Effect[];
  messages: ExecutionMessage[];
}

/**
 * Evaluate a condition
 */
export async function evaluateCondition(
  state: GameState,
  condition: Condition,
  context: ExecutionContext
): Promise<ConditionResult> {
  const messages: ExecutionMessage[] = [];

  switch (condition.type) {
    case 'coin-flip':
      return evaluateCoinFlip(state, condition, context);

    case 'card-count':
      return evaluateCardCount(state, condition);

    case 'status':
      return evaluateStatusCondition(state, condition);

    case 'has-energy':
      return evaluateHasEnergy(state, condition);

    case 'has-damage':
      return evaluateHasDamage(state, condition);

    case 'prize-count':
      return evaluatePrizeCount(state, condition);

    case 'bench-count':
      return evaluateBenchCount(state, condition);

    case 'pokemon-type':
      return evaluatePokemonType(state, condition);

    case 'turn-count':
      return evaluateTurnCount(state, condition);

    case 'hp-remaining':
      return evaluateHpRemaining(state, condition);

    case 'is-ex':
    case 'is-gx':
    case 'is-v':
    case 'is-basic':
      return evaluateCardType(state, condition);

    case 'name-contains':
      return evaluateNameContains(state, condition);

    case 'move-used':
      // Would require tracking last move used - return true for now
      return {
        passed: true,
        successEffects: condition.onSuccess,
        messages: [],
      };

    case 'evolution':
      return evaluateEvolution(state, condition);

    default:
      // Unknown condition type - pass by default
      return {
        passed: true,
        successEffects: condition.onSuccess,
        messages: [],
      };
  }
}

/**
 * Evaluate multiple conditions (AND logic)
 */
export async function evaluateConditions(
  state: GameState,
  conditions: Condition[],
  context: ExecutionContext
): Promise<ConditionResult> {
  const allMessages: ExecutionMessage[] = [];

  for (const condition of conditions) {
    const result = await evaluateCondition(state, condition, context);
    allMessages.push(...result.messages);

    if (!result.passed) {
      return {
        passed: false,
        failureEffects: result.failureEffects,
        messages: allMessages,
      };
    }
  }

  // All conditions passed
  return {
    passed: true,
    successEffects: conditions[conditions.length - 1]?.onSuccess,
    messages: allMessages,
  };
}

/**
 * Coin flip condition
 */
async function evaluateCoinFlip(
  state: GameState,
  condition: Condition,
  context: ExecutionContext
): Promise<ConditionResult> {
  const flipCount = condition.value || 1;
  const results = context.rng.flipCoins(flipCount);
  const headsCount = results.filter(r => r).length;

  // Default: at least one heads = success
  const requiredHeads = condition.values?.[0] || 1;
  const passed = headsCount >= requiredHeads;

  const resultStr = results.map(r => r ? 'Heads' : 'Tails').join(', ');

  return {
    passed,
    successEffects: passed ? condition.onSuccess : undefined,
    failureEffects: !passed ? condition.onFailure : undefined,
    messages: [{
      type: 'info',
      message: `Coin flip${flipCount > 1 ? 's' : ''}: ${resultStr}`,
      data: { results, headsCount, tailsCount: flipCount - headsCount },
    }],
  };
}

/**
 * Card count condition
 */
function evaluateCardCount(
  state: GameState,
  condition: Condition
): ConditionResult {
  let count = 0;

  if (condition.target) {
    const resolved = resolveTarget(state, condition.target);
    count = resolved.cards.length + resolved.pokemon.length;
  } else {
    // Default to hand size
    count = state.hand.length;
  }

  const passed = compareValues(count, condition.value || 0, condition.comparison);

  return {
    passed,
    successEffects: passed ? condition.onSuccess : undefined,
    failureEffects: !passed ? condition.onFailure : undefined,
    messages: [],
  };
}

/**
 * Status condition check
 */
function evaluateStatusCondition(
  state: GameState,
  condition: Condition
): ConditionResult {
  const target = condition.target || {
    type: 'pokemon' as const,
    player: 'self' as const,
    location: { type: 'active' as const },
  };

  const resolved = resolveTarget(state, target);
  const pokemon = resolved.pokemon[0];

  if (!pokemon) {
    return { passed: false, messages: [] };
  }

  const hasStatus = pokemon.status !== null;
  const passed = hasStatus;

  return {
    passed,
    successEffects: passed ? condition.onSuccess : undefined,
    failureEffects: !passed ? condition.onFailure : undefined,
    messages: [],
  };
}

/**
 * Has energy condition
 */
function evaluateHasEnergy(
  state: GameState,
  condition: Condition
): ConditionResult {
  const target = condition.target || {
    type: 'pokemon' as const,
    player: 'self' as const,
    location: { type: 'active' as const },
  };

  const resolved = resolveTarget(state, target);
  const pokemon = resolved.pokemon[0];

  if (!pokemon) {
    return { passed: false, messages: [] };
  }

  let energyCount = pokemon.attachedEnergy.length;

  // Filter by energy type if specified
  if (condition.energyType) {
    energyCount = pokemon.attachedEnergy.filter(e =>
      e.name.toLowerCase().includes(condition.energyType!.toLowerCase())
    ).length;
  }

  const passed = compareValues(energyCount, condition.value || 1, condition.comparison || 'greater-than-or-equal');

  return {
    passed,
    successEffects: passed ? condition.onSuccess : undefined,
    failureEffects: !passed ? condition.onFailure : undefined,
    messages: [],
  };
}

/**
 * Has damage condition
 */
function evaluateHasDamage(
  state: GameState,
  condition: Condition
): ConditionResult {
  const target = condition.target || {
    type: 'pokemon' as const,
    player: 'self' as const,
    location: { type: 'active' as const },
  };

  const resolved = resolveTarget(state, target);
  const pokemon = resolved.pokemon[0];

  if (!pokemon) {
    return { passed: false, messages: [] };
  }

  const hasDamage = pokemon.damage > 0;
  const passed = hasDamage;

  return {
    passed,
    successEffects: passed ? condition.onSuccess : undefined,
    failureEffects: !passed ? condition.onFailure : undefined,
    messages: [],
  };
}

/**
 * Prize count condition
 */
function evaluatePrizeCount(
  state: GameState,
  condition: Condition
): ConditionResult {
  const player = condition.target?.player || 'self';
  const prizeCount = player === 'opponent'
    ? state.opponent.prizes.remaining
    : state.prizes.remaining;

  const passed = compareValues(prizeCount, condition.value || 0, condition.comparison);

  return {
    passed,
    successEffects: passed ? condition.onSuccess : undefined,
    failureEffects: !passed ? condition.onFailure : undefined,
    messages: [],
  };
}

/**
 * Bench count condition
 */
function evaluateBenchCount(
  state: GameState,
  condition: Condition
): ConditionResult {
  const player = condition.target?.player || 'self';
  const benchCount = countBenchPokemon(state, player === 'opponent' ? 'opponent' : 'self');

  const passed = compareValues(benchCount, condition.value || 0, condition.comparison);

  return {
    passed,
    successEffects: passed ? condition.onSuccess : undefined,
    failureEffects: !passed ? condition.onFailure : undefined,
    messages: [],
  };
}

/**
 * Pokemon type condition
 */
function evaluatePokemonType(
  state: GameState,
  condition: Condition
): ConditionResult {
  const target = condition.target || {
    type: 'pokemon' as const,
    player: 'self' as const,
    location: { type: 'active' as const },
  };

  const resolved = resolveTarget(state, target);
  const pokemon = resolved.pokemon[0];

  if (!pokemon) {
    return { passed: false, messages: [] };
  }

  // Check if card type matches (would need type info on CardInstance)
  // For now, assume check passes if Pokemon exists
  const passed = condition.pokemonType
    ? pokemon.card.subtype === condition.pokemonType
    : true;

  return {
    passed,
    successEffects: passed ? condition.onSuccess : undefined,
    failureEffects: !passed ? condition.onFailure : undefined,
    messages: [],
  };
}

/**
 * Turn count condition
 */
function evaluateTurnCount(
  state: GameState,
  condition: Condition
): ConditionResult {
  const turnCount = state.turnNumber;
  const passed = compareValues(turnCount, condition.value || 0, condition.comparison);

  return {
    passed,
    successEffects: passed ? condition.onSuccess : undefined,
    failureEffects: !passed ? condition.onFailure : undefined,
    messages: [],
  };
}

/**
 * HP remaining condition
 */
function evaluateHpRemaining(
  state: GameState,
  condition: Condition
): ConditionResult {
  const target = condition.target || {
    type: 'pokemon' as const,
    player: 'self' as const,
    location: { type: 'active' as const },
  };

  const resolved = resolveTarget(state, target);
  const pokemon = resolved.pokemon[0];

  if (!pokemon) {
    return { passed: false, messages: [] };
  }

  const hpRemaining = pokemon.hp;
  const passed = compareValues(hpRemaining, condition.value || 0, condition.comparison);

  return {
    passed,
    successEffects: passed ? condition.onSuccess : undefined,
    failureEffects: !passed ? condition.onFailure : undefined,
    messages: [],
  };
}

/**
 * Card type condition (EX, GX, V, basic)
 */
function evaluateCardType(
  state: GameState,
  condition: Condition
): ConditionResult {
  const target = condition.target || {
    type: 'pokemon' as const,
    player: 'self' as const,
    location: { type: 'active' as const },
  };

  const resolved = resolveTarget(state, target);
  const pokemon = resolved.pokemon[0];

  if (!pokemon) {
    return { passed: false, messages: [] };
  }

  let passed = false;
  const cardName = pokemon.card.name.toLowerCase();
  const cardSubtype = pokemon.card.subtype?.toLowerCase() || '';

  switch (condition.type) {
    case 'is-ex':
      passed = cardName.includes('ex') || cardSubtype.includes('ex');
      break;
    case 'is-gx':
      passed = cardName.includes('gx') || cardSubtype.includes('gx');
      break;
    case 'is-v':
      passed = cardName.includes(' v') || cardSubtype.includes('v');
      break;
    case 'is-basic':
      passed = cardSubtype === 'basic';
      break;
  }

  return {
    passed,
    successEffects: passed ? condition.onSuccess : undefined,
    failureEffects: !passed ? condition.onFailure : undefined,
    messages: [],
  };
}

/**
 * Name contains condition
 */
function evaluateNameContains(
  state: GameState,
  condition: Condition
): ConditionResult {
  const target = condition.target || {
    type: 'pokemon' as const,
    player: 'self' as const,
    location: { type: 'active' as const },
  };

  const resolved = resolveTarget(state, target);
  const pokemon = resolved.pokemon[0];

  if (!pokemon) {
    return { passed: false, messages: [] };
  }

  const pattern = condition.namePattern || '';
  const passed = pokemon.card.name.toLowerCase().includes(pattern.toLowerCase());

  return {
    passed,
    successEffects: passed ? condition.onSuccess : undefined,
    failureEffects: !passed ? condition.onFailure : undefined,
    messages: [],
  };
}

/**
 * Evolution condition
 */
function evaluateEvolution(
  state: GameState,
  condition: Condition
): ConditionResult {
  // Would need to track if this Pokemon just evolved
  // For now, pass by default
  return {
    passed: true,
    successEffects: condition.onSuccess,
    messages: [],
  };
}

/**
 * Compare two values with a comparison operator
 */
function compareValues(
  actual: number,
  expected: number,
  comparison?: Condition['comparison']
): boolean {
  switch (comparison) {
    case 'equal':
      return actual === expected;
    case 'not-equal':
      return actual !== expected;
    case 'less-than':
      return actual < expected;
    case 'greater-than':
      return actual > expected;
    case 'less-than-or-equal':
      return actual <= expected;
    case 'greater-than-or-equal':
      return actual >= expected;
    default:
      return actual >= expected; // Default to >= for "has at least"
  }
}
