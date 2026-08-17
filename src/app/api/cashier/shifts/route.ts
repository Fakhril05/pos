import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const outletId = searchParams.get('outletId')
    const cashierId = searchParams.get('cashierId')

    if (!outletId || !cashierId) {
      return NextResponse.json({ error: 'outletId dan cashierId wajib diisi' }, { status: 400 })
    }

    const activeShift = await db.shift.findFirst({
      where: {
        outletId,
        cashierId,
        status: 'open',
        closedAt: null,
      },
      include: {
        cashier: { select: { name: true } },
        outlet: { select: { name: true, code: true } },
      },
    })

    if (!activeShift) {
      return NextResponse.json({ shift: null })
    }

    // Calculate actual cash sales for this shift
    const cashPayments = await db.payment.findMany({
      where: {
        transaction: {
          outletId,
          cashierId,
          createdAt: { gte: activeShift.openedAt },
        },
        paymentMethod: 'cash',
        status: 'success',
      },
      select: { amount: true },
    })

    const cashSales = cashPayments.reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      shift: {
        ...activeShift,
        cashSales,
      },
    })
  } catch (error) {
    console.error('Cashier shifts GET error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, tenantId, outletId, cashierId, openingCash, closingCash, note } = body

    if (!tenantId || !outletId || !cashierId || !action) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    if (action === 'open') {
      // Check for existing open shift
      const existingShift = await db.shift.findFirst({
        where: { outletId, cashierId, status: 'open', closedAt: null },
      })

      if (existingShift) {
        return NextResponse.json({ error: 'Shift sudah dibuka' }, { status: 400 })
      }

      const shift = await db.shift.create({
        data: {
          tenantId,
          outletId,
          cashierId,
          openingCash: openingCash || 0,
          status: 'open',
        },
        include: {
          cashier: { select: { name: true } },
          outlet: { select: { name: true, code: true } },
        },
      })

      return NextResponse.json({ shift })
    }

    if (action === 'close') {
      const activeShift = await db.shift.findFirst({
        where: { outletId, cashierId, status: 'open', closedAt: null },
      })

      if (!activeShift) {
        return NextResponse.json({ error: 'Tidak ada shift aktif' }, { status: 400 })
      }

      // Calculate cash sales
      const cashPayments = await db.payment.findMany({
        where: {
          transaction: {
            outletId,
            cashierId,
            createdAt: { gte: activeShift.openedAt },
          },
          paymentMethod: 'cash',
          status: 'success',
        },
        select: { amount: true },
      })

      const cashSales = cashPayments.reduce((sum, p) => sum + p.amount, 0)
      const expectedCash = activeShift.openingCash + cashSales
      const cashDifference = (closingCash || 0) - expectedCash

      const updatedShift = await db.shift.update({
        where: { id: activeShift.id },
        data: {
          status: 'closed',
          closedAt: new Date(),
          closingCash: closingCash || 0,
          expectedCash,
          cashDifference,
          totalSales: activeShift.totalSales,
          totalTx: activeShift.totalTx,
          note: note || null,
        },
        include: {
          cashier: { select: { name: true } },
          outlet: { select: { name: true, code: true } },
        },
      })

      return NextResponse.json({ shift: updatedShift, cashSales, expectedCash, cashDifference })
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
  } catch (error) {
    console.error('Cashier shifts POST error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 },
    )
  }
}
