import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit')) || 10));
    const search = searchParams.get('search') || '';

    const where: Prisma.CustomerWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      db.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          tenant: { select: { id: true, name: true } },
          _count: { select: { transactions: true } },
        },
      }),
      db.customer.count({ where }),
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
    console.error('[Customers GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, tenantId } = body as {
      name: string;
      email?: string;
      phone?: string;
      tenantId?: string;
    };

    if (!name) {
      return NextResponse.json(
        { error: 'Nama wajib diisi' },
        { status: 400 },
      );
    }

    // Resolve tenant — use provided or fall back to first active
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
    }

    // Check uniqueness by [tenantId, phone] if phone provided
    if (phone) {
      const existing = await db.customer.findUnique({
        where: { tenantId_phone: { tenantId: resolvedTenantId, phone } },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Nomor telepon sudah terdaftar di tenant ini' },
          { status: 409 },
        );
      }
    }

    const customer = await db.customer.create({
      data: {
        name,
        tenantId: resolvedTenantId,
        email: email || null,
        phone: phone || null,
      },
    });

    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (error) {
    console.error('[Customers POST]', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 },
    );
  }
}
