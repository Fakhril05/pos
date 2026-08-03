import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET single merchant with enhanced data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const merchant = await db.merchant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true, paymentLinks: true, payouts: true },
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { id: true, name: true, email: true } },
          },
        },
        paymentLinks: {
          select: {
            id: true,
            title: true,
            amount: true,
            status: true,
            type: true,
            soldQty: true,
            maxQty: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 },
      );
    }

    // Compute success rate from ALL transactions (not just the 10 returned)
    const totalTxCount = await db.transaction.count({
      where: { merchantId: id },
    });
    const successTxCount = await db.transaction.count({
      where: { merchantId: id, status: 'success' },
    });
    const successRate = totalTxCount > 0 ? Math.round((successTxCount / totalTxCount) * 100) : 0;

    // Compute average transaction amount from all transactions
    const txAgg = await db.transaction.aggregate({
      where: { merchantId: id },
      _avg: { amount: true },
    });
    const avgAmount = txAgg._avg.amount ?? 0;

    // Monthly revenue: last 6 months of successful transactions
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const monthlyRevenue = await db.transaction.groupBy({
      by: ['createdAt'],
      where: {
        merchantId: id,
        status: 'success',
        createdAt: { gte: sixMonthsAgo },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Aggregate by month
    const monthlyData: { month: string; revenue: number }[] = [];
    const monthMap = new Map<string, number>();

    for (const tx of monthlyRevenue) {
      const d = tx.createdAt as Date;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + (tx._sum.amount ?? 0));
    }

    // Build ordered array of last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.push({
        month: key,
        revenue: monthMap.get(key) ?? 0,
      });
    }

    return NextResponse.json({
      data: {
        ...merchant,
        successRate,
        avgAmount,
        monthlyRevenue: monthlyData,
      },
    });
  } catch (error) {
    console.error('[Merchant GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch merchant' },
      { status: 500 },
    );
  }
}

// PUT update merchant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, address, logo, status } = body as {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      logo?: string;
      status?: string;
    };

    const existing = await db.merchant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (logo !== undefined) updateData.logo = logo;
    if (status !== undefined) updateData.status = status;

    const merchant = await db.merchant.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { transactions: true, paymentLinks: true, payouts: true },
        },
      },
    });

    return NextResponse.json({ data: merchant });
  } catch (error) {
    console.error('[Merchant PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update merchant' },
      { status: 500 },
    );
  }
}
