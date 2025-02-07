import fetch from 'node-fetch';

async function fetchCardEffects(startId: number, endId: number) {
  const effects = new Set<string>();

  for (let id = startId; id <= endId; id++) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/pokemon-card/${id}`
      );
      const card = await response.json();

      // Collect all effects
      if (card.cardEffect) effects.add(card.cardEffect);
      card.abilities?.forEach((a: any) => effects.add(a.description));
      card.moves?.forEach((m: any) => effects.add(m.description));

      console.log(`Fetched card ${id}: ${card.name}`);
    } catch (error) {
      console.error(`Failed to fetch card ${id}:`, error);
    }
  }

  console.log('\nUnique effects found:');
  effects.forEach(effect => console.log('\n---\n' + effect));
}

fetchCardEffects(47186, 47186);
