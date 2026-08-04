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
        tenant: true,
        outlet: true,
        cashier: { select: { id: true, name: true } },
        customer: true,
        items: { include: { product: { select: { name: true, sku: true } } } },
        payments: true,
        refund: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      );
    }

    // Flatten payment info for backward compatibility
    const firstPayment = transaction.payments[0];
    const flattened = {
      ...transaction,
      amount: transaction.totalAmount,
      fee: firstPayment?.fee ?? 0,
      netAmount: firstPayment?.netAmount ?? transaction.totalAmount,
      paymentMethod: firstPayment?.paymentMethod ?? '',
      paymentChannel: firstPayment?.paymentChannel ?? '',
      merchant: transaction.tenant,
    };

    return NextResponse.json({ data: flattened });
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

    const validStatuses = ['pending', 'paid', 'cancelled', 'refunded', 'void'];
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
    if (status === 'paid' && !existing.paidAt) {
      updateData.paidAt = new Date();
    }

    const transaction = await db.transaction.update({
      where: { id },
      data: updateData,
      include: {
        tenant: true,
        outlet: true,
        cashier: { select: { id: true, name: true } },
        customer: true,
        items: true,
        payments: true,
        refund: true,
      },
    });

    const firstPayment = transaction.payments[0];
    const flattened = {
      ...transaction,
      amount: transaction.totalAmount,
      fee: firstPayment?.fee ?? 0,
      netAmount: firstPayment?.netAmount ?? transaction.totalAmount,
      paymentMethod: firstPayment?.paymentMethod ?? '',
      paymentChannel: firstPayment?.paymentChannel ?? '',
      merchant: transaction.tenant,
    };

    return NextResponse.json({ data: flattened });
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
      include: { refund: true, payments: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 },
      );
    }

    if (transaction.status !== 'paid') {
      return NextResponse.json(
        { error: 'Only paid transactions can be refunded' },
        { status: 400 },
      );
    }

    if (transaction.refund) {
      return NextResponse.json(
        { error: 'A refund already exists for this transaction' },
        { status: 400 },
      );
    }

    const refundAmount = amount ?? transaction.totalAmount;

    if (refundAmount <= 0 || refundAmount > transaction.totalAmount) {
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
        tenant: true,
        outlet: true,
        cashier: { select: { id: true, name: true } },
        customer: true,
        items: true,
        payments: true,
        refund: true,
      },
    });

    const firstPayment = updatedTransaction.payments[0];
    const flattened = {
      ...updatedTransaction,
      amount: updatedTransaction.totalAmount,
      fee: firstPayment?.fee ?? 0,
      netAmount: firstPayment?.netAmount ?? updatedTransaction.totalAmount,
      paymentMethod: firstPayment?.paymentMethod ?? '',
      paymentChannel: firstPayment?.paymentChannel ?? '',
      merchant: updatedTransaction.tenant,
    };

    return NextResponse.json({ data: { refund, transaction: flattened } }, { status: 201 });
  } catch (error) {
    console.error('[Transaction POST (refund)]', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 },
    );
  }
}
