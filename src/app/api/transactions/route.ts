import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit')) || 10));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const paymentChannel = searchParams.get('paymentChannel');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const exportCsv = searchParams.get('export') === 'csv';

    // Build where clause
    const where: Prisma.TransactionWhereInput = {};

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { customerName: { contains: search } },
        { merchant: { name: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (paymentChannel) {
      where.paymentChannel = paymentChannel;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    // CSV export
    if (exportCsv) {
      const transactions = await db.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          merchant: { select: { name: true } },
        },
      });

      const header = 'Invoice No,Merchant,Customer Name,Customer Email,Amount,Fee,Net Amount,Payment Method,Payment Channel,Status,Description,Paid At,Created At';
      const rows = transactions.map((tx) => {
        const esc = (v: string | null | undefined) => {
          if (!v) return '';
          return `"${v.replace(/"/g, '""')}"`;
        };
        return [
          esc(tx.invoiceNo),
          esc(tx.merchant.name),
          esc(tx.customerName),
          esc(tx.customerEmail),
          tx.amount,
          tx.fee,
          tx.netAmount,
          tx.paymentMethod,
          tx.paymentChannel,
          tx.status,
          esc(tx.description),
          tx.paidAt?.toISOString() || '',
          tx.createdAt.toISOString(),
        ].join(',');
      });

      const csv = [header, ...rows].join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // Paginated query
    const [data, total] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          merchant: { select: { id: true, name: true, logo: true } },
          customer: { select: { id: true, name: true, email: true } },
        },
      }),
      db.transaction.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Transactions GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 },
    );
  }
}
