import { NextResponse } from 'next/server';

const BASE_URL = 'https://www.pokemon-card.com/card-search/resultAPI.php';

// Define types for the API response
interface PokemonCardApiResponse {
  result: number;
  errMsg: string;
  thisPage: number;
  maxPage: number;
  hitCnt: number;
  cardStart: number;
  cardEnd: number;
  searchCondition: string[];
  regulation: string;
  cardList: {
    cardID: string;
    cardThumbFile: string;
    cardNameAltText: string;
    cardNameViewText: string;
  }[];
}

// Define our API response type
interface SearchResponse {
  cardIds: string[];
  total: number;
}

export async function GET(request: Request) {
  try {
    // Get the search query from URL parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Construct the URL with parameters
    const url = `${BASE_URL}?keyword=${encodeURIComponent(
      query
    )}&se_ta=&regulation_sidebar_form=all&pg=&illust=&sm_and_keyword=true`;

    // Fetch data from the Pokemon card API
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch from Pokemon card API');
    }

    const data = (await response.json()) as PokemonCardApiResponse;

    const result: SearchResponse = {
      cardIds: data.cardList.map(card => card.cardID),
      total: data.hitCnt,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching Pokemon card data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Pokemon card data' },
      { status: 500 }
    );
  }
}
