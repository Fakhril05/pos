import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit')) || 10));
    const status = searchParams.get('status');

    const where: Prisma.PayoutWhereInput = {};

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      db.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          merchant: { select: { id: true, name: true, logo: true } },
        },
      }),
      db.payout.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Payouts GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      merchantId,
      amount,
      fee,
      bankName,
      accountNo,
      accountName,
      notes,
    } = body as {
      merchantId: string;
      amount: number;
      fee?: number;
      bankName: string;
      accountNo: string;
      accountName: string;
      notes?: string;
    };

    if (!merchantId || !amount || !bankName || !accountNo || !accountName) {
      return NextResponse.json(
        { error: 'merchantId, amount, bankName, accountNo, and accountName are required' },
        { status: 400 },
      );
    }

    // Verify merchant exists
    const merchant = await db.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 },
      );
    }

    const payout = await db.payout.create({
      data: {
        merchantId,
        amount: Number(amount),
        fee: fee ? Number(fee) : 0,
        bankName,
        accountNo,
        accountName,
        notes: notes || null,
      },
      include: {
        merchant: { select: { id: true, name: true, logo: true } },
      },
    });

    return NextResponse.json({ data: payout }, { status: 201 });
  } catch (error) {
    console.error('[Payouts POST]', error);
    return NextResponse.json(
      { error: 'Failed to create payout' },
      { status: 500 },
    );
  }
}
