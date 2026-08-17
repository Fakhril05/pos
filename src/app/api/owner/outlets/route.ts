import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId wajib diisi' }, { status: 400 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const outlets = await db.outlet.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { assignedStaff: true, transactions: true, shifts: true } },
      },
    });

    // Get today's stats per outlet
    const todayStats = await db.transaction.groupBy({
      by: ['outletId'],
      where: { tenantId, createdAt: { gte: todayStart } },
      _count: true,
      _sum: { totalAmount: true },
    });

    const statsMap = new Map(
      todayStats.map((s) => [
        s.outletId,
        { txCount: s._count, revenue: s._sum.totalAmount ?? 0 },
      ]),
    );

    return NextResponse.json({
      outlets: outlets.map((o) => {
        const stats = statsMap.get(o.id);
        return {
          id: o.id,
          name: o.name,
          code: o.code,
          address: o.address,
          city: o.city,
          phone: o.phone,
          isOpen: o.isOpen,
          printerIp: o.printerIp,
          employeeCount: o._count.assignedStaff,
          totalTransactions: o._count.transactions,
          todayTxCount: stats?.txCount ?? 0,
          todayRevenue: stats?.revenue ?? 0,
          createdAt: o.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error('[Owner Outlets GET]', error);
    return NextResponse.json(
      { error: 'Gagal memuat data outlet' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, name, code, address, city, phone, printerIp } = body;

    if (!tenantId || !name || !code) {
      return NextResponse.json(
        { error: 'tenantId, nama, dan kode wajib diisi' },
        { status: 400 },
      );
    }

    // Check code uniqueness within tenant
    const existing = await db.outlet.findFirst({
      where: { tenantId, code },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Kode outlet sudah digunakan' },
        { status: 409 },
      );
    }

    const outlet = await db.outlet.create({
      data: {
        tenantId,
        name,
        code,
        address: address || null,
        city: city || null,
        phone: phone || null,
        printerIp: printerIp || null,
      },
    });

    return NextResponse.json({ outlet }, { status: 201 });
  } catch (error) {
    console.error('[Owner Outlets POST]', error);
    return NextResponse.json(
      { error: 'Gagal membuat outlet' },
      { status: 500 },
    );
  }
}
