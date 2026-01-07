import { Ability, CardDetails, Move } from '@/types/pokemon';
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

enum EnergyType {
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
  Colorless = 'colorless', // matches with icon-none in the HTML
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params;
    const url = `https://www.pokemon-card.com/card-search/details.php/card/${cardId}`;

    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url);

    const cardDetails: CardDetails = await page.evaluate(() => {
      const cleanText = (text: string | null | undefined) =>
        text?.replace(/\s+/g, ' ').trim() || '';

      // Get card image
      const cardImage =
        document
          .querySelector('img[src*="card_images"]')
          ?.getAttribute('src') || '';

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

      // Pokemon type and HP
      const typeIcon = document.querySelector('.hp-type + .icon');
      const type = typeIcon?.className.match(/icon-(\w+)/)?.[1] || 'colorless';
      const hp = cleanText(document.querySelector('.hp-num')?.textContent);

      // Check for card effect (グッズ, etc.)
      let cardEffect = '';
      const effectHeader = Array.from(document.querySelectorAll('h2')).find(
        el => el.textContent?.trim() === 'グッズ'
      );
      if (effectHeader) {
        cardEffect = cleanText(effectHeader.nextElementSibling?.textContent);
      }

      // Abilities
      const abilities: Ability[] = Array.from(document.querySelectorAll('h2'))
        .filter(el => el.textContent?.trim() === '特性')
        .flatMap(el => {
          const abilityName = cleanText(el.nextElementSibling?.textContent);
          const abilityDescription = cleanText(
            el.nextElementSibling?.nextElementSibling?.textContent
          );
          return abilityName
            ? [
                {
                  name: abilityName,
                  description: abilityDescription || '',
                },
              ]
            : [];
        });

      // Moves
      const moves = Array.from(document.querySelectorAll('h2'))
        .filter(el => el.textContent?.trim() === 'ワザ')
        .flatMap(el => {
          // Get all h4 and p elements that follow until the next h2
          const moveElements: Element[] = [];
          let currentEl = el.nextElementSibling;

          while (currentEl && currentEl.tagName !== 'H2') {
            moveElements.push(currentEl);
            currentEl = currentEl.nextElementSibling;
          }

          // Process moves in pairs of h4 (move) and p (description)
          return moveElements.reduce<Move[]>((moves, el, index) => {
            if (el.tagName === 'H4') {
              const moveText = cleanText(el.textContent);
              const energyTypes = Array.from(el.querySelectorAll('.icon')).map(
                icon => {
                  const className = icon.className;
                  const typeMatch = className.match(/icon-(\w+)/);
                  return typeMatch?.[1] === 'none'
                    ? EnergyType.Colorless
                    : (typeMatch?.[1] as EnergyType) || EnergyType.Colorless;
                }
              );

              moves.push({
                name: cleanText(moveText.replace(/[×\d]/g, '')),
                damage: moveText.match(/(\d+)(?:×)?$/)?.[1] || '',
                description:
                  cleanText(moveElements[index + 1]?.textContent) || '',
                energyCount: energyTypes.length,
                energyTypes,
              });
            }
            return moves;
          }, []);
        });

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
        hp,
        type,
        cardEffect,
        abilities,
        moves,
        weakness,
        resistance,
        retreatCost,
        evolution,
        set,
        imageUrl: cardImage,
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
