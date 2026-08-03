import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

function generateRandomId(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

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
      name,
      title,
      description,
      amount,
      merchantId,
      type,
      maxQty,
      expiresAt,
    } = body as {
      name?: string;
      title?: string;
      description?: string;
      amount: number;
      merchantId?: string;
      type?: 'single' | 'recurring' | string;
      maxQty?: number;
      expiresAt?: string;
    };

    const linkName = name || title;

    if (!linkName || !amount) {
      return NextResponse.json(
        { error: 'name (or title) and amount are required' },
        { status: 400 },
      );
    }

    // Use provided merchantId or fall back to first active merchant
    let resolvedMerchantId = merchantId;
    if (!resolvedMerchantId) {
      const defaultMerchant = await db.merchant.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'asc' },
      });
      if (!defaultMerchant) {
        return NextResponse.json(
          { error: 'No active merchant found. Please provide a merchantId.' },
          { status: 400 },
        );
      }
      resolvedMerchantId = defaultMerchant.id;
    } else {
      const merchant = await db.merchant.findUnique({ where: { id: merchantId } });
      if (!merchant) {
        return NextResponse.json(
          { error: 'Merchant not found' },
          { status: 404 },
        );
      }
    }

    const paymentLink = await db.paymentLink.create({
      data: {
        title: linkName,
        description: description || null,
        amount: Number(amount),
        merchantId: resolvedMerchantId,
        type: type || 'single',
        maxQty: maxQty ?? 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        merchant: { select: { id: true, name: true, logo: true } },
      },
    });

    const linkUrl = `https://pay.posril.id/${generateRandomId()}`;

    return NextResponse.json(
      { data: paymentLink, url: linkUrl },
      { status: 201 },
    );
  } catch (error) {
    console.error('[PaymentLinks POST]', error);
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 },
    );
  }
}
