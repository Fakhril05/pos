import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single customer with transactions
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            merchant: { select: { id: true, name: true, logo: true } },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: customer });
  } catch (error) {
    console.error('[Customer GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 },
    );
  }
}
