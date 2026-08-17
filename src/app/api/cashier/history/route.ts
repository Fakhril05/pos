import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cashierId = searchParams.get('cashierId')
    const filter = searchParams.get('filter') || 'all'

    if (!cashierId) {
      return NextResponse.json({ error: 'cashierId wajib diisi' }, { status: 400 })
    }

    const where: Record<string, unknown> = { cashierId }

    if (filter === 'today') {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      where.createdAt = { gte: startOfDay }
    } else if (filter === 'shift') {
      const activeShift = await db.shift.findFirst({
        where: { cashierId, status: 'open' },
        select: { openedAt: true },
      })
      if (activeShift) {
        where.createdAt = { gte: activeShift.openedAt }
      } else {
        // No active shift, show nothing
        return NextResponse.json({ transactions: [] })
      }
    }

    const transactions = await db.transaction.findMany({
      where,
      select: {
        id: true,
        invoiceNo: true,
        createdAt: true,
        totalAmount: true,
        status: true,
        _count: { select: { items: true } },
        payments: {
          select: { paymentMethod: true, paymentChannel: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const formatted = transactions.map((tx) => ({
      id: tx.id,
      invoiceNo: tx.invoiceNo,
      createdAt: tx.createdAt.toISOString(),
      totalAmount: tx.totalAmount,
      status: tx.status,
      paymentMethod: tx.payments[0]?.paymentMethod || 'cash',
      paymentChannel: tx.payments[0]?.paymentChannel || null,
      _count: tx._count,
    }))

    return NextResponse.json({ transactions: formatted })
  } catch (error) {
    console.error('Cashier history error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 },
    )
  }
}
