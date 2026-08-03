import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single merchant
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
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        payouts: {
          take: 5,
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

    return NextResponse.json({ data: merchant });
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
