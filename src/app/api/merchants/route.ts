import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit')) || 10));
    const search = searchParams.get('search') || '';

    const where: Prisma.TenantWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      db.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { transactions: true, paymentLinks: true, payouts: true },
          },
        },
      }),
      db.tenant.count({ where }),
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
    console.error('[Merchants GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch merchants' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, slug } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nama merchant wajib diisi' },
        { status: 400 },
      );
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 },
      );
    }

    // Generate slug from name if not provided
    const tenantSlug = slug || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const merchant = await db.tenant.create({
      data: {
        name: name.trim(),
        slug: tenantSlug,
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        status: 'active',
        totalSales: 0,
        totalTx: 0,
      },
      include: {
        _count: {
          select: { transactions: true, paymentLinks: true, payouts: true },
        },
      },
    });

    return NextResponse.json({ data: merchant }, { status: 201 });
  } catch (error) {
    console.error('[Merchants POST]', error);
    return NextResponse.json(
      { error: 'Failed to create merchant' },
      { status: 500 },
    );
  }
}
