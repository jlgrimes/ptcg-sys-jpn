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
  name: string; // バケッチャ
  cardId: string; // XY4 043 / 088
  hp: string; // HP 60
  type: string; // dark
  cardEffect?: string; // Effect text for trainer/energy cards
  abilities: Ability[];
  moves: Move[];
  weakness: string; // ×2
  resistance: string; // －20
  retreatCost: string; // empty in this case
  evolution: string[]; // ["パンプジン", "バケッチャ"]
  set: string; // ポケモンカードゲームXY 拡張パック「ファントムゲート」
  imageUrl: string; // Add the image URL to the response
}
