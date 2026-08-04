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
        { tenant: { name: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      db.paymentLink.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          tenant: { select: { id: true, name: true, logo: true } },
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
      tenantId,
      linkType,
      maxQty,
      expiresAt,
    } = body as {
      name?: string;
      title?: string;
      description?: string;
      amount: number;
      tenantId?: string;
      linkType?: 'single' | 'multi' | string;
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

    // Use provided tenantId or fall back to first active tenant
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      const defaultTenant = await db.tenant.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'asc' },
      });
      if (!defaultTenant) {
        return NextResponse.json(
          { error: 'No active tenant found. Please provide a tenantId.' },
          { status: 400 },
        );
      }
      resolvedTenantId = defaultTenant.id;
    } else {
      const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 },
        );
      }
    }

    const paymentLink = await db.paymentLink.create({
      data: {
        title: linkName,
        description: description || null,
        amount: Number(amount),
        tenantId: resolvedTenantId,
        linkType: linkType || 'single',
        maxQty: maxQty ?? 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        tenant: { select: { id: true, name: true, logo: true } },
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
