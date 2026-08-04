import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId wajib diisi' }, { status: 400 });
    }

    const outletId = searchParams.get('outletId') ?? '';
    const categoryId = searchParams.get('categoryId') ?? '';
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
    const search = searchParams.get('search') ?? '';

    const where: Record<string, unknown> = { tenantId, isTrackStock: true };
    if (outletId) {
      // For now, products are tenant-scoped (not outlet-scoped in stock)
      // We include outletId for future per-outlet stock support
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (lowStockOnly) {
      where.OR = [
        { stock: { lte: 5 } },
        { stock: { equals: 0 } },
      ];
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const [products, lowStockCount, outOfStockCount, totalValue] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: { stock: 'asc' },
        include: { category: { select: { id: true, name: true } } },
      }),
      db.product.count({
        where: {
          tenantId,
          isTrackStock: true,
          stock: { gt: 0, lte: 5 }, // changed: stock > 0 && stock <= minStock
        },
      }),
      db.product.count({
        where: {
          tenantId,
          isTrackStock: true,
          stock: { equals: 0 },
        },
      }),
      db.product.aggregate({
        where: { tenantId, isTrackStock: true },
        _sum: { buyPrice: true },
      }),
    ]);

    // Get recent inventory logs
    const recentLogs = await db.inventoryLog.findMany({
      where: { tenantId },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
      },
    });

    // Get all categories for filter
    const categories = await db.category.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    // Get all outlets for filter
    const outlets = await db.outlet.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const inventoryValue = totalValue._sum.buyPrice ?? 0;

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        minStock: p.minStock,
        unit: p.unit,
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice,
        isAvailable: p.isAvailable,
        category: p.category,
        stockStatus:
          p.stock === 0
            ? 'habis'
            : p.stock <= p.minStock
              ? 'rendah'
              : 'cukup',
      })),
      totalProducts: products.length,
      lowStockCount,
      outOfStockCount,
      inventoryValue,
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        type: log.type,
        quantity: log.quantity,
        previousStock: log.previousStock,
        newStock: log.newStock,
        reason: log.reason,
        performedBy: log.performedBy,
        createdAt: log.createdAt,
        productName: log.product.name,
        productSku: log.product.sku,
      })),
      categories,
      outlets,
    });
  } catch (error) {
    console.error('[Owner Stock GET]', error);
    return NextResponse.json(
      { error: 'Gagal memuat data stok' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, productId, outletId, type, quantity, reason, adjustedBy } = body;

    if (!tenantId || !productId || !type || quantity == null) {
      return NextResponse.json(
        { error: 'tenantId, productId, type, dan quantity wajib diisi' },
        { status: 400 },
      );
    }

    const validTypes = ['in', 'out', 'adjustment', 'initial'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Tipe penyesuaian tidak valid' },
        { status: 400 },
      );
    }

    const product = await db.product.findUnique({
      where: { id: productId },
    });
    if (!product || product.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 },
      );
    }

    const previousStock = product.stock;
    let newStock = previousStock;

    if (type === 'in') {
      newStock = previousStock + Math.abs(quantity);
    } else if (type === 'out') {
      newStock = Math.max(0, previousStock - Math.abs(quantity));
    } else if (type === 'adjustment') {
      newStock = Math.max(0, quantity);
    } else if (type === 'initial') {
      newStock = Math.max(0, quantity);
    }

    // Update product stock
    await db.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    // Create inventory log
    const logQuantity = newStock - previousStock;
    const log = await db.inventoryLog.create({
      data: {
        tenantId,
        productId,
        outletId: outletId || null,
        type,
        quantity: logQuantity,
        previousStock,
        newStock,
        reason: reason || null,
        performedBy: adjustedBy || null,
      },
    });

    return NextResponse.json({ log, newStock }, { status: 201 });
  } catch (error) {
    console.error('[Owner Stock POST]', error);
    return NextResponse.json(
      { error: 'Gagal menyesuaikan stok' },
      { status: 500 },
    );
  }
}
