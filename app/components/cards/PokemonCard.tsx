import { CardDetails } from '@/types/pokemon';
import { Suspense } from 'react';
import { parseEffectText } from '@/app/lib/effect-parser';
import { Effect, Target } from '@/app/lib/effects/types';

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT || 3000}`;
}

async function getCard(id: number) {
  const res = await fetch(`${getBaseUrl()}/api/pokemon-card/${id}`, {
    // cache: 'force-cache',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch card');
  }

  return res.json();
}

function EffectDisplay({ effects }: { effects: Effect[] }) {
  return (
    <div className='mt-2 text-xs bg-gray-100 p-2 rounded'>
      {effects.map((effect, index) => (
        <div key={index} className='mb-2 relative'>
          {/* Conditions and Timing Badges */}
          <div className='absolute -top-2 -left-2 flex flex-wrap gap-1 max-w-[calc(100%-16px)]'>
            {/* Timing Badge */}
            {effect.timing && (
              <div className='bg-purple-500 text-white px-2 py-0.5 rounded-full text-[10px] shadow-sm'>
                {effect.timing.type}
                {effect.timing.duration && ` (${effect.timing.duration})`}
              </div>
            )}

            {/* Condition Badges */}
            {effect.conditions?.map((condition, idx) => (
              <div
                key={idx}
                className='bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] shadow-sm'
              >
                {condition.type === 'move-used' ? (
                  <>Used {condition.move}</>
                ) : condition.type === 'coin-flip' ? (
                  <>Coin Flip {condition.value}x</>
                ) : (
                  condition.type
                )}
              </div>
            ))}
          </div>

          {/* Effect Content */}
          <div className='pt-3 px-2 bg-white rounded border'>
            <span className='font-semibold'>{effect.type}</span>
            {effect.value && <span> ({effect.value})</span>}
            {effect.targets && (
              <span className='ml-1'>
                →{' '}
                {effect.targets.map((t: Target, i: number) => (
                  <span key={i}>
                    {i > 0 ? ', ' : ''}
                    {t.player}:{t.type}
                    {t.count && ` (${t.count})`}
                    {t.location && (
                      <span className='bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full ml-1'>
                        location: {t.location.type}
                      </span>
                    )}
                    {t.filters && t.filters.length > 0 && (
                      <span className='text-gray-600'>
                        {' '}
                        [
                        {t.filters.map((f, fi) => (
                          <span key={fi}>
                            {fi > 0 ? ', ' : ''}
                            {f.type === 'card-type'
                              ? f.value
                              : f.type === 'energy-type'
                              ? f.value + (f.subtype ? ` (${f.subtype})` : '')
                              : `${f.type}:${f.value}`}
                            {f.comparison && ` ${f.comparison}`}
                          </span>
                        ))}
                        ]
                      </span>
                    )}
                  </span>
                ))}
              </span>
            )}
            {effect.what && (
              <span className='text-gray-600 ml-1'>• {effect.what}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className='border rounded-lg p-4 shadow-lg bg-white animate-pulse'>
      <div className='h-8 bg-gray-200 rounded mb-4'></div>
      <div className='grid grid-cols-2 gap-2'>
        <div className='space-y-2'>
          <div className='h-4 bg-gray-200 rounded w-3/4'></div>
          <div className='h-4 bg-gray-200 rounded w-1/2'></div>
          <div className='h-4 bg-gray-200 rounded w-2/3'></div>
        </div>
        <div className='space-y-2'>
          <div className='h-4 bg-gray-200 rounded w-3/4'></div>
          <div className='h-4 bg-gray-200 rounded w-2/3'></div>
        </div>
      </div>
    </div>
  );
}

async function CardContent({ id }: { id: number }) {
  const card: CardDetails = await getCard(id);

  // Parse effects for abilities, card effect, and moves
  const abilityEffects = await Promise.all(
    card.abilities.map(async ability => ({
      name: ability.name,
      effects: await parseEffectText(ability.description),
    }))
  );

  const cardEffects = card.cardEffect
    ? await parseEffectText(card.cardEffect)
    : [];

  const moveEffects = await Promise.all(
    card.moves.map(async move => ({
      ...move,
      effects: await parseEffectText(move.description),
    }))
  );

  return (
    <div className='border rounded-lg p-4 shadow-lg bg-white'>
      <div className='grid grid-cols-[1fr_auto] gap-4'>
        <div>
          <h2 className='text-xl font-bold mb-2'>{card.name}</h2>

          {/* Info Section */}
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div>
              <p>
                <strong>Card ID:</strong> {card.cardId}
              </p>
              <p>
                <strong>HP:</strong> {card.hp}
              </p>
              <p>
                <strong>Type:</strong> {card.type}
              </p>
            </div>
            <div>
              <p>
                <strong>Set:</strong> {card.set}
              </p>
            </div>
          </div>

          {/* Card Effect with parsed effects */}
          {card.cardEffect && (
            <div className='mt-4 text-sm bg-blue-50 p-3 rounded-md'>
              <h3 className='font-bold mb-1'>Card Effect:</h3>
              <p>{card.cardEffect}</p>
              <EffectDisplay effects={cardEffects} />
            </div>
          )}

          {/* Abilities with parsed effects */}
          {card.abilities && card.abilities.length > 0 && (
            <div className='mt-4'>
              <h3 className='font-bold'>Abilities:</h3>
              {abilityEffects.map((ability, index) => (
                <div key={index} className='mt-2'>
                  <p className='font-semibold'>{ability.name}</p>
                  <p className='text-sm'>{card.abilities[index].description}</p>
                  <EffectDisplay effects={ability.effects} />
                </div>
              ))}
            </div>
          )}

          {card.moves && card.moves.length > 0 && (
            <div className='mt-4'>
              <h3 className='font-bold'>Moves:</h3>
              {moveEffects.map((move, index: number) => (
                <div key={index} className='mt-2'>
                  <p className='font-semibold'>
                    {move.name} - {move.damage}
                  </p>
                  <p className='text-sm'>{move.description}</p>
                  <p className='text-xs'>
                    Energy: {move.energyTypes.join(', ')} ({move.energyCount})
                  </p>
                  <EffectDisplay effects={move.effects} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card Image */}
        <div className='w-64 flex-shrink-0'>
          {card.imageUrl && (
            <img
              src={`https://www.pokemon-card.com${card.imageUrl}`}
              alt={card.name}
              className='w-full h-auto rounded-lg shadow-md'
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function PokemonCard({ id }: { id: number }) {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <CardContent id={id} />
    </Suspense>
  );
}
