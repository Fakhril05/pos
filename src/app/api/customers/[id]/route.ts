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
        tenant: { select: { id: true, name: true, logo: true } },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            tenant: { select: { id: true, name: true, logo: true } },
            payments: { select: { paymentMethod: true, paymentChannel: true } },
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

    // Compute stats from all transactions (not just the 10 returned)
    const allTransactions = await db.transaction.findMany({
      where: { customerId: id },
      select: { totalAmount: true, status: true, createdAt: true },
    });

    const totalSpent = allTransactions.reduce(
      (sum, tx) => (tx.status === 'paid' ? sum + tx.totalAmount : sum),
      0,
    );
    const totalTx = allTransactions.length;
    const successTx = allTransactions.filter(
      (tx) => tx.status === 'paid',
    ).length;
    const successRate =
      totalTx > 0 ? Number(((successTx / totalTx) * 100).toFixed(1)) : 0;
    const lastTransactionDate =
      allTransactions.length > 0
        ? allTransactions.reduce(
            (latest, tx) =>
              tx.createdAt > latest ? tx.createdAt : latest,
            allTransactions[0].createdAt,
          )
        : null;

    // Monthly activity for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const recentTx = await db.transaction.findMany({
      where: {
        customerId: id,
        createdAt: { gte: sixMonthsAgo },
      },
      select: { totalAmount: true, status: true, createdAt: true },
    });

    const monthlyMap = new Map<string, { count: number; amount: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, { count: 0, amount: 0 });
    }

    for (const tx of recentTx) {
      const key = `${tx.createdAt.getFullYear()}-${String(tx.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthlyMap.get(key);
      if (entry && tx.status === 'paid') {
        entry.count += 1;
        entry.amount += tx.totalAmount;
      }
    }

    const monthlyActivity = Array.from(monthlyMap.entries()).map(
      ([month, data]) => ({
        month,
        count: data.count,
        amount: Number(data.amount.toFixed(2)),
      }),
    );

    return NextResponse.json({
      data: {
        ...customer,
        totalSpent,
        totalTx,
        successRate,
        lastTransactionDate,
        monthlyActivity,
      },
    });
  } catch (error) {
    console.error('[Customer GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 },
    );
  }
}
