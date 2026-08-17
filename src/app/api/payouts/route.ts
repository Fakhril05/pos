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
          tenant: { select: { id: true, name: true, logo: true } },
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
      tenantId,
      amount,
      fee,
      bankName,
      accountNo,
      accountName,
      notes,
    } = body as {
      tenantId: string;
      amount: number;
      fee?: number;
      bankName: string;
      accountNo: string;
      accountName: string;
      notes?: string;
    };

    if (!tenantId || !amount || !bankName || !accountNo || !accountName) {
      return NextResponse.json(
        { error: 'tenantId, amount, bankName, accountNo, and accountName are required' },
        { status: 400 },
      );
    }

    // Verify tenant exists
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 },
      );
    }

    const payout = await db.payout.create({
      data: {
        tenantId,
        amount: Number(amount),
        fee: fee ? Number(fee) : 0,
        bankName,
        accountNo,
        accountName,
        notes: notes || null,
      },
      include: {
        tenant: { select: { id: true, name: true, logo: true } },
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
