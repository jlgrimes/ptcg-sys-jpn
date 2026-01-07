import PokemonCardList from './components/cards/PokemonCardList';

// Disable static generation - this page fetches external data
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className='min-h-screen p-4'>
      <h1 className='text-3xl font-bold mb-6'>Pokemon Card Collection</h1>
      <PokemonCardList />
    </main>
  );
}
