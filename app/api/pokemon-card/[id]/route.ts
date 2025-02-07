import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

interface CardDetails {
  name: string; // バケッチャ
  cardId: string; // XY4 043 / 088
  pokemonInfo: {
    number: string; // No.710
    type: string; // かぼちゃポケモン
    height: string; // 0.4 m
    weight: string; // 5.0 kg
  };
  description: string; // 成仏できない 魂を カボチャの 体に 入れている。日暮れと ともに 動きはじめる。
  illustrator: string; // HiRON
  pokemonType: string; // たね
  hp: string; // HP 60
  moves: {
    name: string;
    damage?: string;
    description?: string;
  }[];
  weakness: string; // ×2
  resistance: string; // －20
  retreatCost: string; // empty in this case
  evolution: string[]; // ["パンプジン", "バケッチャ"]
  set: string; // ポケモンカードゲームXY 拡張パック「ファントムゲート」
}

interface Move {
  name: string;
  damage: string;
  description: string;
  energyCount: number;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cardId = params.id;
    const url = `https://www.pokemon-card.com/card-search/details.php/card/${cardId}`;

    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url);

    const cardDetails: CardDetails = await page.evaluate(() => {
      const cleanText = (text: string | null | undefined) =>
        text?.replace(/\s+/g, ' ').trim() || '';

      // Debug: Log all h4 elements to see what we're working with
      console.log(
        'All H4 elements:',
        Array.from(document.querySelectorAll('h4')).map(el => el.textContent)
      );

      // Debug: Log potential move containers
      console.log(
        'Potential move elements:',
        Array.from(
          document.querySelectorAll('.mt-3, .waza, [class*="waza"]')
        ).map(el => ({
          text: el.textContent,
          html: el.innerHTML,
        }))
      );

      // Basic card info
      const name = cleanText(document.querySelector('h1')?.textContent);
      const cardId = cleanText(document.querySelector('.CardSet')?.textContent);

      // Pokemon info section
      const pokemonNumberEl = Array.from(document.querySelectorAll('h4')).find(
        el => el.textContent?.includes('No.')
      );
      const number = cleanText(pokemonNumberEl?.textContent);
      const type = cleanText(pokemonNumberEl?.nextElementSibling?.textContent);

      // Size info
      const sizeDiv = pokemonNumberEl?.nextElementSibling?.nextElementSibling;
      const sizeText = cleanText(sizeDiv?.textContent);
      const heightMatch = sizeText.match(/高さ：([\d.]+)\s*m/);
      const weightMatch = sizeText.match(/重さ：([\d.]+)\s*kg/);
      const height = heightMatch?.[1] || '';
      const weight = weightMatch?.[1] || '';

      // Description
      const description = cleanText(sizeDiv?.nextElementSibling?.textContent);

      // Illustrator
      const illustrator = cleanText(
        document.querySelector('h4:has(+ div)')?.nextElementSibling?.textContent
      );

      // Pokemon type and HP
      const statsDiv = document.querySelector('.CardStatus');
      const pokemonType = cleanText(
        statsDiv?.querySelector('div:first-child')?.textContent
      );
      const hp = cleanText(document.querySelector('.hp-num')?.textContent);

      // Moves
      const moveSection = Array.from(document.querySelectorAll('h2')).find(
        el => el.textContent?.trim() === 'ワザ'
      )?.parentElement;

      const moves = moveSection
        ? Array.from(moveSection.children).reduce<Move[]>((acc, el) => {
            if (el.tagName === 'H4') {
              const moveText = cleanText(el.textContent);
              const damageEl = el.querySelector('.Text-fjalla');
              const damage =
                cleanText(damageEl?.textContent)?.replace('×', '') || '';

              // Get energy icons count
              const energyCount = el.querySelectorAll('.icon').length;

              // Get name by removing the damage part
              const name = cleanText(
                moveText.replace(damageEl?.textContent || '', '')
              );

              acc.push({
                name,
                damage,
                description: '',
                energyCount,
              });
            } else if (el.tagName === 'P' && acc.length > 0) {
              // Add description to the last move
              acc[acc.length - 1].description = cleanText(el.textContent);
            }
            return acc;
          }, [])
        : [];

      // Stats from table
      const [weakness, resistance, retreatCost] = Array.from(
        document.querySelectorAll('table td')
      ).map(td => cleanText(td.textContent));

      // Evolution chain
      const evolution = Array.from(document.querySelectorAll('h2'))
        .filter(el => el.textContent?.includes('進化'))
        .flatMap(el =>
          Array.from(el.nextElementSibling?.querySelectorAll('div') || [])
        )
        .map(div => cleanText(div.textContent));

      // Card set
      const set = cleanText(document.querySelector('.CardNumber')?.textContent);

      return {
        name,
        cardId,
        pokemonInfo: {
          number,
          type,
          height,
          weight,
        },
        description,
        illustrator,
        pokemonType,
        hp,
        moves,
        weakness,
        resistance,
        retreatCost,
        evolution,
        set,
      };
    });

    await browser.close();
    return NextResponse.json(cardDetails);
  } catch (error) {
    console.error('Error fetching card details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card details' },
      { status: 500 }
    );
  }
}
