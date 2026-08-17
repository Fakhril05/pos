import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'node:crypto';

const FEE_MAP: Record<string, number> = {
  e_wallet: 0.02,
  qris: 0.007,
  bank_transfer: 0.015,
  credit_card: 0.029,
};

function generateInvoiceNo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `PR-QP-${y}${m}${d}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      outletId,
      cashierId,
      customerId,
      amount,
      paymentMethod,
      paymentChannel,
      customerName,
      customerPhone,
      items,
    } = body as {
      tenantId: string;
      outletId?: string;
      cashierId?: string;
      customerId?: string;
      amount: number;
      paymentMethod: string;
      paymentChannel: string;
      customerName?: string;
      customerPhone?: string;
      items?: { name: string; qty: number; price: number }[];
    };

    if (!tenantId || typeof tenantId !== 'string') {
      return NextResponse.json(
        { error: 'Tenant wajib dipilih' },
        { status: 400 },
      );
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Jumlah pembayaran harus lebih dari 0' },
        { status: 400 },
      );
    }

    if (!paymentMethod || !paymentChannel) {
      return NextResponse.json(
        { error: 'Metode dan kanal pembayaran wajib dipilih' },
        { status: 400 },
      );
    }

    const feeRate = FEE_MAP[paymentMethod] ?? 0;
    const fee = Math.round(amount * feeRate);
    const netAmount = amount - fee;
    const invoiceNo = generateInvoiceNo();

    // Resolve outlet if not provided
    let resolvedOutletId = outletId;
    if (!resolvedOutletId) {
      const firstOutlet = await db.outlet.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      });
      resolvedOutletId = firstOutlet?.id ?? '';
      if (!resolvedOutletId) {
        return NextResponse.json(
          { error: 'No outlet found for this tenant' },
          { status: 400 },
        );
      }
    }

    // Resolve cashier if not provided
    let resolvedCashierId = cashierId;
    if (!resolvedCashierId) {
      const firstCashier = await db.user.findFirst({
        where: { tenantId, role: 'cashier', isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      resolvedCashierId = firstCashier?.id ?? '';
    }

    const transaction = await db.transaction.create({
      data: {
        invoiceNo,
        tenantId,
        outletId: resolvedOutletId,
        cashierId: resolvedCashierId,
        customerId: customerId || null,
        subtotalAmount: amount,
        totalAmount: amount,
        status: 'paid',
        paymentStatus: 'fully_paid',
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        paidAt: new Date(),
        items: items
          ? {
              create: items.map((item, idx) => ({
                productId: `temp-${idx}`,
                name: item.name,
                sellPrice: item.price,
                buyPrice: 0,
                quantity: item.qty,
                totalPrice: item.price * item.qty,
              })),
            }
          : undefined,
        payments: {
          create: {
            paymentMethod,
            paymentChannel,
            amount,
            fee,
            netAmount,
            status: 'success',
            paidAt: new Date(),
          },
        },
      },
      include: {
        tenant: { select: { id: true, name: true, logo: true } },
        outlet: { select: { id: true, name: true } },
        items: true,
        payments: true,
      },
    });

    // Update tenant totals
    await db.tenant.update({
      where: { id: tenantId },
      data: {
        totalSales: { increment: netAmount },
        totalTx: { increment: 1 },
      },
    });

    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch (error) {
    console.error('[Quick Pay POST]', error);
    return NextResponse.json(
      { error: 'Gagal memproses pembayaran' },
      { status: 500 },
    );
  }
}
