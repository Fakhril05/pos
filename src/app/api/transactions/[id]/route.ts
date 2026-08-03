import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single transaction with relations
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        merchant: true,
        customer: true,
        paymentLink: true,
        refund: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: transaction });
  } catch (error) {
    console.error('[Transaction GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 },
    );
  }
}

// PUT update transaction status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body as { status?: string };

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 },
      );
    }

    const validStatuses = ['pending', 'success', 'failed', 'expired', 'refunded'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 },
      );
    }

    const existing = await db.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'success' && !existing.paidAt) {
      updateData.paidAt = new Date();
    }

    const transaction = await db.transaction.update({
      where: { id },
      data: updateData,
      include: {
        merchant: true,
        customer: true,
        refund: true,
      },
    });

    return NextResponse.json({ data: transaction });
  } catch (error) {
    console.error('[Transaction PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 },
    );
  }
}

// POST create refund for a transaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, reason } = body as { amount?: number; reason?: string };

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: { refund: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      );
    }

    if (transaction.status !== 'success') {
      return NextResponse.json(
        { error: 'Only successful transactions can be refunded' },
        { status: 400 },
      );
    }

    if (transaction.refund) {
      return NextResponse.json(
        { error: 'A refund already exists for this transaction' },
        { status: 400 },
      );
    }

    const refundAmount = amount ?? transaction.amount;

    if (refundAmount <= 0 || refundAmount > transaction.amount) {
      return NextResponse.json(
        { error: 'Invalid refund amount' },
        { status: 400 },
      );
    }

    const refund = await db.refund.create({
      data: {
        transactionId: id,
        amount: refundAmount,
        reason: reason || null,
      },
    });

    // Update transaction status to refunded
    const updatedTransaction = await db.transaction.update({
      where: { id },
      data: { status: 'refunded' },
      include: {
        merchant: true,
        customer: true,
        refund: true,
      },
    });

    return NextResponse.json({ data: { refund, transaction: updatedTransaction } }, { status: 201 });
  } catch (error) {
    console.error('[Transaction POST (refund)]', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 },
    );
  }
}
