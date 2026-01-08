import { CardDetails, Ability, Move } from '@/types/pokemon';
import { NextResponse } from 'next/server';

// Force dynamic rendering to avoid build-time database connection
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params;

    // Dynamic import to avoid build-time instantiation
    const { prisma } = await import('@/app/lib/db');

    // Fetch card from database
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found. Run npm run scrape:data --supported to populate the database.' },
        { status: 404 }
      );
    }

    // Transform database record to CardDetails format
    const cardDetails: CardDetails = {
      name: card.name,
      cardId: card.setCode || cardId,
      hp: card.hp || '',
      type: card.type || 'colorless',
      cardEffect: card.cardEffect || '',
      abilities: (card.abilities as unknown as Ability[]) || [],
      moves: (card.moves as unknown as Move[]) || [],
      weakness: card.weakness || '',
      resistance: card.resistance || '',
      retreatCost: card.retreatCost || '',
      evolution: (card.evolution as unknown as string[]) || [],
      set: card.setName || '',
      imageUrl: card.imageUrl || '',
    };

    return NextResponse.json(cardDetails);
  } catch (error) {
    console.error('Error fetching card details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card details' },
      { status: 500 }
    );
  }
}
