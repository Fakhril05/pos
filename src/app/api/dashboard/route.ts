import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportFrom = searchParams.get('reportFrom');
    const reportTo = searchParams.get('reportTo');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // --- Stats ---
    const [totalResult, successResult, totalTxResult, activeMerchantsResult, todayResult, pendingResult] =
      await Promise.all([
        db.transaction.aggregate({
          _sum: { amount: true },
          _count: true,
        }),
        db.transaction.count({ where: { status: 'success' } }),
        db.transaction.count(),
        db.merchant.count({ where: { status: 'active' } }),
        db.transaction.aggregate({
          _sum: { amount: true },
          where: {
            status: 'success',
            paidAt: { gte: todayStart },
          },
        }),
        db.transaction.count({ where: { status: 'pending' } }),
      ]);

    const totalRevenue = totalResult._sum.amount ?? 0;
    const totalTransactions = totalResult._count;
    const successRate =
      totalTransactions > 0
        ? Number(((successResult / totalTransactions) * 100).toFixed(1))
        : 0;
    const avgTransaction =
      totalTransactions > 0
        ? Number((totalRevenue / totalTransactions).toFixed(2))
        : 0;
    const activeMerchants = activeMerchantsResult;
    const todayRevenue = todayResult._sum.amount ?? 0;

    const stats = {
      totalRevenue,
      totalTransactions,
      successRate,
      avgTransaction,
      activeMerchants,
      todayRevenue,
      pendingTransactions: pendingResult,
    };

    // --- Monthly chart data (last 12 months) ---
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTransactions = await db.transaction.findMany({
      where: {
        status: 'success',
        paidAt: { gte: twelveMonthsAgo },
      },
      select: {
        amount: true,
        paidAt: true,
      },
    });

    const monthlyMap = new Map<string, { revenue: number; count: number }>();

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, { revenue: 0, count: 0 });
    }

    for (const tx of monthlyTransactions) {
      if (!tx.paidAt) continue;
      const key = `${tx.paidAt.getFullYear()}-${String(tx.paidAt.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthlyMap.get(key);
      if (entry) {
        entry.revenue += tx.amount;
        entry.count += 1;
      }
    }

    const monthlyChartData = Array.from(monthlyMap.entries()).map(
      ([month, data]) => ({
        month,
        revenue: Number(data.revenue.toFixed(2)),
        count: data.count,
      }),
    );

    // --- Recent transactions (latest 5) ---
    const recentTransactions = await db.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        merchant: { select: { id: true, name: true, logo: true } },
      },
    });

    // --- Top merchants (top 5 by totalSales) ---
    const topMerchants = await db.merchant.findMany({
      take: 5,
      orderBy: { totalSales: 'desc' },
    });

    // --- Payment method distribution (successful transactions) ---
    const methodDistribution = await db.transaction.groupBy({
      by: ['paymentMethod'],
      where: { status: 'success' },
      _count: true,
      _sum: { amount: true },
    });

    const paymentMethodDistribution = methodDistribution.map((m) => ({
      method: m.paymentMethod,
      count: m._count,
      amount: m._sum.amount ?? 0,
    }));

    // --- Reports-specific data (if reportFrom/reportTo provided) ---
    if (reportFrom && reportTo) {
      const fromDate = new Date(reportFrom);
      const toDate = new Date(reportTo);
      toDate.setHours(23, 59, 59, 999);

      const daysDiff = Math.max(
        Math.ceil(
          (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1,
        1,
      );

      // Daily revenue in range
      const rangeTransactions = await db.transaction.findMany({
        where: {
          paidAt: { gte: fromDate, lte: toDate },
          status: 'success',
        },
        select: { amount: true, paidAt: true },
      });

      // Build daily map
      const dailyMap = new Map<string, { revenue: number; count: number }>();
      const cursor = new Date(fromDate);
      while (cursor <= toDate) {
        const key = cursor.toISOString().split('T')[0];
        dailyMap.set(key, { revenue: 0, count: 0 });
        cursor.setDate(cursor.getDate() + 1);
      }

      let totalRangeRevenue = 0;
      let totalRangeTx = 0;
      let bestDayRevenue = 0;
      let bestDay = '';

      for (const tx of rangeTransactions) {
        if (!tx.paidAt) continue;
        const key = tx.paidAt.toISOString().split('T')[0];
        const entry = dailyMap.get(key);
        if (entry) {
          entry.revenue += tx.amount;
          entry.count += 1;
        }
        totalRangeRevenue += tx.amount;
        totalRangeTx += 1;
      }

      // Find best day
      for (const [date, data] of dailyMap.entries()) {
        if (data.revenue > bestDayRevenue) {
          bestDayRevenue = data.revenue;
          bestDay = date;
        }
      }

      const dailyRevenue = Array.from(dailyMap.entries()).map(
        ([date, data]) => ({
          date,
          revenue: Number(data.revenue.toFixed(2)),
          count: data.count,
        }),
      );

      // Payment method breakdown in range
      const rangeMethodDist = await db.transaction.groupBy({
        by: ['paymentMethod'],
        where: {
          paidAt: { gte: fromDate, lte: toDate },
          status: 'success',
        },
        _count: true,
        _sum: { amount: true },
      });

      const paymentMethodBreakdown = rangeMethodDist.map((m) => ({
        method: m.paymentMethod,
        count: m._count,
        revenue: m._sum.amount ?? 0,
      }));

      // Top merchants in range
      const rangeMerchantTx = await db.transaction.groupBy({
        by: ['merchantId'],
        where: {
          paidAt: { gte: fromDate, lte: toDate },
          status: 'success',
        },
        _count: true,
        _sum: { amount: true },
      });

      // Fetch merchant names
      const merchantIds = rangeMerchantTx.map((m) => m.merchantId);
      const merchants = merchantIds.length > 0
        ? await db.merchant.findMany({
            where: { id: { in: merchantIds } },
            select: { id: true, name: true },
          })
        : [];

      const merchantMap = new Map(merchants.map((m) => [m.id, m.name]));

      const topMerchantsInRange = rangeMerchantTx
        .map((m) => ({
          id: m.merchantId,
          name: merchantMap.get(m.merchantId) ?? 'Unknown',
          totalTx: m._count,
          totalRevenue: m._sum.amount ?? 0,
          avgTxSize: m._count > 0 ? (m._sum.amount ?? 0) / m._count : 0,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      // Status distribution in range
      const rangeStatusDist = await db.transaction.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: fromDate, lte: toDate },
        },
        _count: true,
        _sum: { amount: true },
      });

      const statusDistribution = rangeStatusDist.map((s) => ({
        status: s.status,
        count: s._count,
        revenue: s._sum.amount ?? 0,
      }));

      const reportData = {
        summary: {
          totalRevenue: totalRangeRevenue,
          totalTransactions: totalRangeTx,
          avgDailyRevenue: Math.round(totalRangeRevenue / daysDiff),
          bestDay,
          bestDayRevenue,
        },
        dailyRevenue,
        paymentMethodBreakdown,
        topMerchants: topMerchantsInRange,
        statusDistribution,
      };

      return NextResponse.json(reportData);
    }

    return NextResponse.json({
      stats,
      monthlyChartData,
      recentTransactions,
      topMerchants,
      paymentMethodDistribution,
    });
  } catch (error) {
    console.error('[Dashboard GET]', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 },
    );
  }
}
