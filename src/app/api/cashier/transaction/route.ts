import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tenantId,
      outletId,
      cashierId,
      items,
      subtotalAmount,
      discountAmount,
      taxAmount,
      serviceCharge,
      totalAmount,
      paymentMethod,
      paymentChannel,
      tendered,
    } = body

    if (!tenantId || !outletId || !cashierId || !items?.length || !paymentMethod) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    // Get outlet for invoice number
    const outlet = await db.outlet.findUnique({
      where: { id: outletId },
      select: { code: true, name: true, address: true, city: true },
    })
    if (!outlet) {
      return NextResponse.json({ error: 'Outlet tidak ditemukan' }, { status: 404 })
    }

    // Get tenant info
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, address: true, city: true, phone: true },
    })
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 })
    }

    // Generate invoice number: TX-{outletCode}-{YYYYMMDD}-{XXXX}
    const today = new Date()
    const dateStr = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0')

    // Count today's transactions for this outlet
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const txCount = await db.transaction.count({
      where: {
        outletId,
        createdAt: { gte: startOfDay },
      },
    })
    const seq = String(txCount + 1).padStart(4, '0')
    const invoiceNo = `TX-${outlet.code}-${dateStr}-${seq}`

    // Use Prisma transaction for atomicity
    const result = await db.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          tenantId,
          outletId,
          cashierId,
          invoiceNo,
          subtotalAmount,
          discountAmount: discountAmount || 0,
          taxAmount: taxAmount || 0,
          serviceCharge: serviceCharge || 0,
          totalAmount,
          status: 'paid',
          paymentStatus: 'fully_paid',
          paidAt: new Date(),
        },
      })

      // Create transaction items & update stock
      for (const item of items) {
        await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: item.productId,
            name: item.name,
            sku: item.sku || null,
            buyPrice: item.buyPrice || 0,
            sellPrice: item.price,
            quantity: item.quantity,
            unit: item.unit || 'pcs',
            totalPrice: item.price * item.quantity - (item.discount || 0),
          },
        })

        // Decrease stock
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, isTrackStock: true },
        })

        if (product && product.isTrackStock) {
          const previousStock = product.stock
          const newStock = Math.max(0, previousStock - item.quantity)

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock },
          })

          // Create inventory log
          await tx.inventoryLog.create({
            data: {
              tenantId,
              productId: item.productId,
              outletId,
              type: 'out',
              quantity: -item.quantity,
              previousStock,
              newStock,
              reason: 'Penjualan POS',
              referenceNo: invoiceNo,
              performedBy: cashierId,
            },
          })
        }
      }

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          transactionId: transaction.id,
          paymentMethod,
          paymentChannel: paymentChannel || null,
          amount: totalAmount,
          fee: 0,
          netAmount: totalAmount,
          status: 'success',
          paidAt: new Date(),
        },
      })

      // Update shift totals if there's an active shift
      const activeShift = await tx.shift.findFirst({
        where: {
          outletId,
          cashierId,
          status: 'open',
        },
      })

      if (activeShift) {
        const isCash = paymentMethod === 'cash'
        await tx.shift.update({
          where: { id: activeShift.id },
          data: {
            totalSales: { increment: totalAmount },
            totalTx: { increment: 1 },
            ...(isCash
              ? { openingCash: { increment: totalAmount } }
              : {}),
          },
        })
      }

      return { transaction, payment }
    })

    // Get cashier name
    const cashier = await db.user.findUnique({
      where: { id: cashierId },
      select: { name: true },
    })

    return NextResponse.json({
      transaction: result.transaction,
      payment: result.payment,
      invoiceNo,
      outletName: outlet.name,
      outletAddress: outlet.address,
      outletCity: outlet.city,
      tenantName: tenant.name,
      tenantAddress: tenant.address,
      tenantCity: tenant.city,
      tenantPhone: tenant.phone,
      cashierName: cashier?.name || 'Kasir',
      items,
    })
  } catch (error) {
    console.error('Cashier transaction error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 },
    )
  }
}
