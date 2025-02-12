import { CardDetails, Ability, Move } from '@/types/pokemon';
import { Suspense } from 'react';

async function getCard(id: number) {
  const res = await fetch(`http://localhost:3001/api/pokemon-card/${id}`, {
    cache: 'force-cache',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch card');
  }

  return res.json();
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
  console.log(card);

  return (
    <div className='border rounded-lg p-4 shadow-lg bg-white'>
      <h2 className='text-xl font-bold mb-2'>{card.name}</h2>

      {/* Pokemon Info Section */}
      <div className='text-sm text-gray-600 mb-4'>
        <p>
          <strong>{card.pokemonInfo.number}</strong> - {card.pokemonInfo.type}
        </p>
        <p>
          Height: {card.pokemonInfo.height} • Weight: {card.pokemonInfo.weight}
        </p>
      </div>

      {/* Description */}
      <div className='text-sm bg-gray-50 p-3 rounded-md mb-4 italic'>
        {card.description}
      </div>

      <div className='grid grid-cols-2 gap-2 text-sm'>
        <div>
          <p>
            <strong>Card ID:</strong> {card.cardId}
          </p>
          <p>
            <strong>HP:</strong> {card.hp}
          </p>
          <p>
            <strong>Type:</strong> {card.pokemonType}
          </p>
        </div>
        <div>
          <p>
            <strong>Set:</strong> {card.set}
          </p>
          <p>
            <strong>Illustrator:</strong> {card.illustrator}
          </p>
        </div>
      </div>

      {/* Card Effect (if present) */}
      {card.cardEffect && (
        <div className='mt-4 text-sm bg-blue-50 p-3 rounded-md'>
          <h3 className='font-bold mb-1'>Card Effect:</h3>
          <p>{card.cardEffect}</p>
        </div>
      )}

      {card.abilities && card.abilities.length > 0 && (
        <div className='mt-4'>
          <h3 className='font-bold'>Abilities:</h3>
          {card.abilities.map((ability: Ability, index: number) => (
            <div key={index} className='mt-2'>
              <p className='font-semibold'>{ability.name}</p>
              <p className='text-sm'>{ability.description}</p>
            </div>
          ))}
        </div>
      )}

      {card.moves && card.moves.length > 0 && (
        <div className='mt-4'>
          <h3 className='font-bold'>Moves:</h3>
          {card.moves.map((move: Move, index: number) => (
            <div key={index} className='mt-2'>
              <p className='font-semibold'>
                {move.name} - {move.damage}
              </p>
              <p className='text-sm'>{move.description}</p>
              <p className='text-xs'>
                Energy: {move.energyTypes.join(', ')} ({move.energyCount})
              </p>
            </div>
          ))}
        </div>
      )}
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
