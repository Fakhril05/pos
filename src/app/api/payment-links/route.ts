import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit')) || 10));
    const search = searchParams.get('search') || '';

    const where: Prisma.PaymentLinkWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { merchant: { name: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      db.paymentLink.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          merchant: { select: { id: true, name: true, logo: true } },
          _count: { select: { transactions: true } },
        },
      }),
      db.paymentLink.count({ where }),
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
    console.error('[PaymentLinks GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment links' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      amount,
      merchantId,
      type,
      maxQty,
      expiresAt,
    } = body as {
      title: string;
      description?: string;
      amount: number;
      merchantId: string;
      type?: string;
      maxQty?: number;
      expiresAt?: string;
    };

    if (!title || !amount || !merchantId) {
      return NextResponse.json(
        { error: 'title, amount, and merchantId are required' },
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

    const paymentLink = await db.paymentLink.create({
      data: {
        title,
        description: description || null,
        amount: Number(amount),
        merchantId,
        type: type || 'single',
        maxQty: maxQty ?? 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        merchant: { select: { id: true, name: true, logo: true } },
      },
    });

    return NextResponse.json({ data: paymentLink }, { status: 201 });
  } catch (error) {
    console.error('[PaymentLinks POST]', error);
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 },
    );
  }
}
