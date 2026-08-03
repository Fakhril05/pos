import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single payment link with enriched data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const paymentLink = await db.paymentLink.findUnique({
      where: { id },
      include: {
        merchant: true,
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            merchant: { select: { id: true, name: true, logo: true } },
          },
        },
        _count: { select: { transactions: true } },
      },
    });

    if (!paymentLink) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 },
      );
    }

    // Calculate total revenue from successful transactions
    const allSuccessfulTx = await db.transaction.findMany({
      where: {
        paymentLinkId: id,
        status: 'success',
      },
      select: { netAmount: true },
    });
    const totalRevenue = allSuccessfulTx.reduce(
      (sum, tx) => sum + tx.netAmount,
      0,
    );

    // Calculate conversion rate (soldQty / maxQty * 100)
    const conversionRate =
      paymentLink.maxQty > 0
        ? (paymentLink.soldQty / paymentLink.maxQty) * 100
        : 0;

    // Calculate success rate of transactions
    const totalTxCount = paymentLink._count.transactions;
    const successTxCount = allSuccessfulTx.length;
    const successRate = totalTxCount > 0 ? (successTxCount / totalTxCount) * 100 : 0;

    return NextResponse.json({
      data: paymentLink,
      totalRevenue,
      conversionRate: Math.round(conversionRate * 10) / 10,
      successRate: Math.round(successRate * 10) / 10,
    });
  } catch (error) {
    console.error('[PaymentLink GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment link' },
      { status: 500 },
    );
  }
}

// PUT update payment link
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, amount, status, type, maxQty, expiresAt } = body as {
      title?: string;
      description?: string;
      amount?: number;
      status?: string;
      type?: string;
      maxQty?: number;
      expiresAt?: string | null;
    };

    const existing = await db.paymentLink.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (status !== undefined) updateData.status = status;
    if (type !== undefined) updateData.type = type;
    if (maxQty !== undefined) updateData.maxQty = maxQty;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const paymentLink = await db.paymentLink.update({
      where: { id },
      data: updateData,
      include: {
        merchant: { select: { id: true, name: true, logo: true } },
      },
    });

    return NextResponse.json({ data: paymentLink });
  } catch (error) {
    console.error('[PaymentLink PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update payment link' },
      { status: 500 },
    );
  }
}

// DELETE payment link
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await db.paymentLink.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 },
      );
    }

    await db.paymentLink.delete({ where: { id } });

    return NextResponse.json({ data: { id, deleted: true } });
  } catch (error) {
    console.error('[PaymentLink DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete payment link' },
      { status: 500 },
    );
  }
}
