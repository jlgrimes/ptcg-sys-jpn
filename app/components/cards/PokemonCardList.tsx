import PokemonCard from './PokemonCard';

export default function PokemonCardList() {
  // Generate an array of IDs from 47220 down to 47210 (10 cards)
  const cardIds = Array.from({ length: 10 }, (_, i) => 47220 - i);

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4'>
      {cardIds.map(id => (
        <PokemonCard key={id} id={id} />
      ))}
    </div>
  );
}
