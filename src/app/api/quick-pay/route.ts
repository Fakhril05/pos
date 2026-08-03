import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'node:crypto';

const FEE_MAP: Record<string, number> = {
  ewallet: 0.02,
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
      merchantId,
      amount,
      paymentMethod,
      paymentChannel,
      customerName,
      customerEmail,
      customerPhone,
      description,
      items,
    } = body as {
      merchantId: string;
      amount: number;
      paymentMethod: string;
      paymentChannel: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      description?: string;
      items?: { name: string; qty: number; price: number }[];
    };

    if (!merchantId || typeof merchantId !== 'string') {
      return NextResponse.json(
        { error: 'Merchant wajib dipilih' },
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

    const desc = description || (items?.length ? `Pembayaran POS: ${items.map((i) => i.name).join(', ')}` : null);

    const transaction = await db.transaction.create({
      data: {
        invoiceNo,
        merchantId,
        amount,
        fee,
        netAmount,
        paymentMethod,
        paymentChannel,
        status: 'success',
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        description: desc,
        paidAt: new Date(),
      },
      include: {
        merchant: { select: { id: true, name: true, logo: true } },
      },
    });

    // Update merchant totals
    await db.merchant.update({
      where: { id: merchantId },
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
