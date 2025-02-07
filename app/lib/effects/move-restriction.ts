import { Effect, EffectType } from '../effect-parser';
import type { TokenizedPhrase } from '../effect-parser';

export interface MoveRestrictionEffect extends Effect {
  type: EffectType.Restriction;
  moveName: string;
  duration: 'next-turn' | 'this-turn' | 'permanent';
  restriction: 'cannot-use' | 'must-use';
}

export function parseMoveRestriction(
  phrase: TokenizedPhrase
): MoveRestrictionEffect | null {
  const { text } = phrase;

  // Check if this is a move restriction effect
  if (!text.includes('使えない')) {
    return null;
  }

  // Extract move name from quotes
  const moveNameMatch = text.match(/「([^」]+)」/);
  if (!moveNameMatch) {
    return null;
  }

  return {
    type: EffectType.Restriction,
    target: text.includes('自分') ? 'self' : 'opponent',
    moveName: moveNameMatch[1],
    duration: text.includes('次の') ? 'next-turn' : 'this-turn',
    restriction: 'cannot-use',
  };
}
