import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [tenantCount, userCount, monthlyTx, monthlyRevenue, recentTenants] = await Promise.all([
      // Active tenants
      db.tenant.count({ where: { status: 'active' } }),
      // Total users
      db.user.count(),
      // Monthly transactions
      db.transaction.count({
        where: { createdAt: { gte: monthStart } },
      }),
      // Monthly revenue (sum of paid transactions)
      db.transaction.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: monthStart },
          status: 'paid',
        },
      }),
      // Recent tenants (last 10)
      db.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          city: true,
          status: true,
          createdAt: true,
        },
      }),
    ])

    // Subscription plan distribution
    const planCounts = await db.subscription.groupBy({
      by: ['plan'],
      _count: true,
    })

    const totalRevenue = monthlyRevenue._sum.totalAmount || 0
    const platformFees = totalRevenue * 0.02

    return NextResponse.json({
      tenantCount,
      userCount,
      monthlyTx,
      monthlyRevenue: totalRevenue,
      platformFees,
      planDistribution: planCounts.reduce((acc, p) => {
        acc[p.plan] = p._count
        return acc
      }, {} as Record<string, number>),
      recentTenants,
    })
  } catch (error) {
    console.error('Stats fetch error:', error)
    return NextResponse.json({ error: 'Gagal memuat statistik' }, { status: 500 })
  }
}
