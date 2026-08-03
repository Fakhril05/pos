import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single payout
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payout = await db.payout.findUnique({
      where: { id },
      include: {
        merchant: true,
      },
    });

    if (!payout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: payout });
  } catch (error) {
    console.error('[Payout GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout' },
      { status: 500 },
    );
  }
}

// PUT process payout (update status)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body as { status?: string; notes?: string };

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 },
      );
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 },
      );
    }

    const existing = await db.payout.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = { status };
    if (notes !== undefined) updateData.notes = notes;

    // Auto-set processedAt for terminal statuses
    if (['completed', 'failed', 'cancelled'].includes(status)) {
      updateData.processedAt = new Date();
    }

    const payout = await db.payout.update({
      where: { id },
      data: updateData,
      include: {
        merchant: { select: { id: true, name: true, logo: true } },
      },
    });

    return NextResponse.json({ data: payout });
  } catch (error) {
    console.error('[Payout PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update payout' },
      { status: 500 },
    );
  }
}
