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
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const exportCsv = searchParams.get('export') === 'csv';

    // Build where clause
    const where: Prisma.TransactionWhereInput = {};

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { customerName: { contains: search } },
        { tenant: { name: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (paymentMethod) {
      where.payments = {
        some: { paymentMethod },
      };
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
          tenant: { select: { name: true } },
          payments: { select: { paymentMethod: true, paymentChannel: true, amount: true, fee: true, netAmount: true } },
          customer: { select: { name: true, phone: true } },
        },
      });

      const header = 'Invoice No,Tenant,Customer Name,Customer Phone,Total Amount,Payment Method,Payment Channel,Status,Created At';
      const rows = transactions.map((tx) => {
        const esc = (v: string | null | undefined) => {
          if (!v) return '';
          return `"${v.replace(/"/g, '""')}"`;
        };
        const firstPayment = tx.payments[0];
        return [
          esc(tx.invoiceNo),
          esc(tx.tenant.name),
          esc(tx.customerName ?? tx.customer?.name),
          esc(tx.customerPhone ?? tx.customer?.phone),
          tx.totalAmount,
          firstPayment?.paymentMethod ?? '',
          firstPayment?.paymentChannel ?? '',
          tx.status,
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
          tenant: { select: { id: true, name: true, logo: true } },
          customer: { select: { id: true, name: true, phone: true } },
          payments: { select: { paymentMethod: true, paymentChannel: true, amount: true, fee: true, netAmount: true } },
        },
      }),
      db.transaction.count({ where }),
    ]);

    // Flatten payment info onto each transaction for backward compatibility
    const flattened = data.map((tx) => {
      const firstPayment = tx.payments[0];
      return {
        ...tx,
        amount: tx.totalAmount,
        fee: firstPayment?.fee ?? 0,
        netAmount: firstPayment?.netAmount ?? tx.totalAmount,
        paymentMethod: firstPayment?.paymentMethod ?? '',
        paymentChannel: firstPayment?.paymentChannel ?? '',
      };
    });

    return NextResponse.json({
      data: flattened,
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
