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
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries
    const [
      todayTx,
      yesterdayTx,
      monthTx,
      monthAgg,
      recentTx,
      topProductsRaw,
      outletComparisonRaw,
      outlets,
    ] = await Promise.all([
      // Today's transactions
      db.transaction.findMany({
        where: { tenantId, status: 'paid', createdAt: { gte: todayStart } },
        select: { totalAmount: true },
      }),
      // Yesterday's transactions
      db.transaction.findMany({
        where: {
          tenantId,
          status: 'paid',
          createdAt: { gte: yesterdayStart, lt: todayStart },
        },
        select: { totalAmount: true },
      }),
      // This month's transactions
      db.transaction.findMany({
        where: { tenantId, status: 'paid', createdAt: { gte: monthStart } },
        select: { totalAmount: true },
      }),
      // Monthly aggregate
      db.transaction.aggregate({
        where: { tenantId, status: 'paid', createdAt: { gte: monthStart } },
        _count: true,
        _sum: { totalAmount: true },
      }),
      // Recent transactions (last 10)
      db.transaction.findMany({
        where: { tenantId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          outlet: { select: { name: true } },
          cashier: { select: { name: true } },
        },
      }),
      // Top 5 products by sales quantity (via transaction items)
      db.transactionItem.groupBy({
        by: ['productId'],
        where: {
          transaction: { tenantId, status: 'paid', createdAt: { gte: monthStart } },
        },
        _sum: { quantity: true, totalPrice: true },
        _count: true,
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      // Outlet comparison (this month revenue per outlet)
      db.transaction.groupBy({
        by: ['outletId'],
        where: { tenantId, status: 'paid', createdAt: { gte: monthStart } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      // Outlets for names
      db.outlet.findMany({
        where: { tenantId },
        select: { id: true, name: true },
      }),
    ]);

    // --- KPI calculations ---
    const todayRevenue = todayTx.reduce((s, t) => s + t.totalAmount, 0);
    const yesterdayRevenue = yesterdayTx.reduce((s, t) => s + t.totalAmount, 0);
    const todayPctChange =
      yesterdayRevenue > 0
        ? Number((((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1))
        : todayRevenue > 0
          ? 100
          : 0;

    const monthRevenue = monthTx.reduce((s, t) => s + t.totalAmount, 0);
    const monthTxCount = monthAgg._count;
    const avgTxValue = monthTxCount > 0 ? Math.round(monthRevenue / monthTxCount) : 0;

    // --- Revenue trend (last 7 days) ---
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weekTx = await db.transaction.findMany({
      where: {
        tenantId,
        status: 'paid',
        createdAt: { gte: sevenDaysAgo },
      },
      select: { totalAmount: true, createdAt: true },
    });

    const dayMap = new Map<string, { revenue: number; count: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dayMap.set(key, { revenue: 0, count: 0 });
    }
    for (const tx of weekTx) {
      const key = tx.createdAt.toISOString().split('T')[0];
      const entry = dayMap.get(key);
      if (entry) {
        entry.revenue += tx.totalAmount;
        entry.count += 1;
      }
    }
    const revenueTrend = Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue),
      count: data.count,
      label: new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      }),
    }));

    // --- Top 5 products ---
    const productIds = topProductsRaw.map((p) => p.productId);
    const products =
      productIds.length > 0
        ? await db.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
          })
        : [];
    const productMap = new Map(products.map((p) => [p.id, p.name]));
    const topProducts = topProductsRaw.map((p) => ({
      productId: p.productId,
      name: productMap.get(p.productId) ?? 'Tidak Diketahui',
      totalQty: p._sum.quantity ?? 0,
      totalRevenue: p._sum.totalPrice ?? 0,
      txCount: p._count,
    }));

    // --- Outlet comparison ---
    const outletMap = new Map(outlets.map((o) => [o.id, o.name]));
    const outletComparison = outletComparisonRaw.map((o) => ({
      outletId: o.outletId,
      outletName: outletMap.get(o.outletId) ?? 'Tidak Diketahui',
      revenue: o._sum.totalAmount ?? 0,
      txCount: o._count,
    }));

    // --- Recent transactions formatted ---
    const recentTransactions = recentTx.map((tx) => ({
      id: tx.id,
      invoiceNo: tx.invoiceNo,
      customerName: (tx.customerName || 'Umum').replace(/\s*\(Toko\s*\)\s*$/, ''),
      outletName: tx.outlet?.name ?? '-',
      cashierName: tx.cashier?.name ?? '-',
      totalAmount: tx.totalAmount,
      status: tx.status,
      paymentStatus: tx.paymentStatus,
      createdAt: tx.createdAt,
    }));

    return NextResponse.json({
      todayRevenue: Math.round(todayRevenue),
      todayPctChange,
      monthRevenue: Math.round(monthRevenue),
      monthTxCount,
      avgTxValue,
      revenueTrend,
      topProducts,
      outletComparison,
      recentTransactions,
    });
  } catch (error) {
    console.error('[Owner Dashboard GET]', error);
    return NextResponse.json(
      { error: 'Gagal memuat data dashboard' },
      { status: 500 },
    );
  }
}
