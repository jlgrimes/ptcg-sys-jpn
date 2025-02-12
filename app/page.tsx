import PokemonCardList from './components/cards/PokemonCardList';

export default function Home() {
  return (
    <main className='min-h-screen p-4'>
      <h1 className='text-3xl font-bold mb-6'>Pokemon Card Collection</h1>
      <PokemonCardList />
    </main>
  );
}
