import { CardDetails, Ability, Move } from '@/types/pokemon';
import PokemonCard from './PokemonCard';

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT || 3000}`;
}

interface DbCard {
  id: string;
  name: string;
  hp: string | null;
  type: string | null;
  cardEffect: string | null;
  abilities: Ability[] | null;
  moves: Move[] | null;
  weakness: string | null;
  resistance: string | null;
  retreatCost: string | null;
  evolution: string[] | null;
  setName: string | null;
  setCode: string | null;
  imageUrl: string | null;
}

async function getCards(ids: string[]): Promise<CardDetails[]> {
  const res = await fetch(`${getBaseUrl()}/api/cards?ids=${ids.join(',')}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch cards');
  }

  const data = await res.json();

  // Transform database records to CardDetails format
  return data.cards.map((card: DbCard) => ({
    name: card.name,
    cardId: card.setCode || card.id,
    hp: card.hp || '',
    type: card.type || 'colorless',
    cardEffect: card.cardEffect || '',
    abilities: (card.abilities as Ability[]) || [],
    moves: (card.moves as Move[]) || [],
    weakness: card.weakness || '',
    resistance: card.resistance || '',
    retreatCost: card.retreatCost || '',
    evolution: (card.evolution as string[]) || [],
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
