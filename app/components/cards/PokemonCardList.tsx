import { CardDetails, Ability, Move } from '@/types/pokemon';
import PokemonCard from './PokemonCard';
import { getPrisma } from '@/app/lib/db';

async function getCards(ids: string[]): Promise<CardDetails[]> {
  const prisma = getPrisma();

  const cards = await prisma.card.findMany({
    where: { id: { in: ids } },
  });

  // Transform database records to CardDetails format
  return cards.map((card) => ({
    name: card.name,
    cardId: card.setCode || card.id,
    hp: card.hp || '',
    type: card.type || 'colorless',
    cardEffect: card.cardEffect || '',
    abilities: (card.abilities as unknown as Ability[]) || [],
    moves: (card.moves as unknown as Move[]) || [],
    weakness: card.weakness || '',
    resistance: card.resistance || '',
    retreatCost: card.retreatCost || '',
    evolution: (card.evolution as unknown as string[]) || [],
    set: card.setName || '',
    imageUrl: card.imageUrl || '',
  }));
}

export default async function PokemonCardList() {
  // Generate an array of IDs from 47069 down to 47060 (10 cards)
  const NsZoro = 47069;
  const cardIds = Array.from({ length: 10 }, (_, i) => String(NsZoro - i));

  const cards = await getCards(cardIds);

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4'>
      {cards.map((card, index) => (
        <PokemonCard key={cardIds[index]} card={card} />
      ))}
    </div>
  );
}
