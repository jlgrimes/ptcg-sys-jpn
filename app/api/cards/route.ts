import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids'); // comma-separated IDs
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Create Prisma client directly in the handler to avoid module-level issues
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    );
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    let cards;

    if (ids) {
      // Fetch specific cards by IDs
      const cardIds = ids.split(',').map(id => id.trim());
      cards = await prisma.card.findMany({
        where: { id: { in: cardIds } },
      });
    } else {
      // Fetch all cards with pagination
      cards = await prisma.card.findMany({
        take: limit,
        skip: offset,
        orderBy: { id: 'asc' },
      });
    }

    // Get total count for pagination
    const total = await prisma.card.count();

    return NextResponse.json({
      cards,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
