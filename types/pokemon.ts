export enum EnergyType {
  Normal = 'normal',
  Fighting = 'fighting',
  Fire = 'fire',
  Water = 'water',
  Lightning = 'lightning',
  Psychic = 'psychic',
  Grass = 'grass',
  Darkness = 'darkness',
  Metal = 'metal',
  Fairy = 'fairy',
  Dragon = 'dragon',
  Colorless = 'colorless',
}

export interface Ability {
  name: string;
  description: string;
}

export interface Move {
  name: string;
  damage: string;
  description: string;
  energyCount: number;
  energyTypes: EnergyType[];
}

export interface CardDetails {
  name: string;
  cardId: string;
  pokemonInfo: {
    number: string;
    type: string;
    height: string;
    weight: string;
  };
  description: string;
  illustrator: string;
  pokemonType: string;
  hp: string;
  cardEffect?: string;
  abilities: Ability[];
  moves: Move[];
  weakness: string;
  resistance: string;
  retreatCost: string;
  evolution: string[];
  set: string;
  imageUrl: string;
}
