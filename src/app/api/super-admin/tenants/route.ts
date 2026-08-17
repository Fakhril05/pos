import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const where: any = {}
    if (search) {
      where.name = { contains: search }
    }
    if (status) {
      where.status = status
    }

    const tenants = await db.tenant.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            outlets: true,
          },
        },
        subscription: true,
        users: {
          where: { role: 'business_owner' },
          select: { name: true },
          take: 1,
        },
        transactions: {
          where: {
            createdAt: { gte: monthStart },
            status: 'paid',
          },
          select: { totalAmount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = tenants.map((t) => {
      const monthRevenue = t.transactions.reduce((sum, tx) => sum + tx.totalAmount, 0)
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        email: t.email,
        city: t.city,
        province: t.province,
        status: t.status,
        createdAt: t.createdAt,
        ownerName: t.users[0]?.name || '-',
        outletCount: t._count.outlets,
        plan: t.subscription?.plan || 'free',
        monthlyPrice: t.subscription?.monthlyPrice || 0,
        monthRevenue,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Tenants fetch error:', error)
    return NextResponse.json({ error: 'Gagal memuat data tenant' }, { status: 500 })
  }
}
