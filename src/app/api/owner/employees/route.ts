import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId wajib diisi' }, { status: 400 });
    }

    const users = await db.user.findMany({
      where: {
        tenantId,
        role: { notIn: ['super_admin'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        pin: true,
        isActive: true,
        assignedOutletId: true,
        assignedOutlet: { select: { id: true, name: true, code: true } },
        createdAt: true,
        lastLoginAt: true,
      },
    });

    // Get outlets for dropdown
    const outlets = await db.outlet.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users, outlets });
  } catch (error) {
    console.error('[Owner Employees GET]', error);
    return NextResponse.json(
      { error: 'Gagal memuat data karyawan' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, name, email, role, outletId, pin, phone } = body;

    if (!tenantId || !name || !email || !role) {
      return NextResponse.json(
        { error: 'tenantId, nama, email, dan role wajib diisi' },
        { status: 400 },
      );
    }

    if (!['business_owner', 'manager', 'cashier'].includes(role)) {
      return NextResponse.json(
        { error: 'Role tidak valid' },
        { status: 400 },
      );
    }

    // Check email uniqueness per tenant
    const existing = await db.user.findFirst({
      where: { tenantId, email },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar di bisnis ini' },
        { status: 409 },
      );
    }

    const user = await db.user.create({
      data: {
        tenantId,
        name,
        email,
        passwordHash: '$2b$10$placeholder_hash_for_now',
        role,
        assignedOutletId: outletId || null,
        pin: pin || null,
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        assignedOutlet: { select: { name: true } },
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('[Owner Employees POST]', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan karyawan' },
      { status: 500 },
    );
  }
}
