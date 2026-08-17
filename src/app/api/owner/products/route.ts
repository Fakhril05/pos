import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId wajib diisi' }, { status: 400 });
    }

    const search = searchParams.get('search') ?? '';
    const categoryId = searchParams.get('categoryId') ?? '';
    const sort = searchParams.get('sort') ?? 'newest';
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));

    const where: Record<string, unknown> = { tenantId, isTrackStock: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const orderBy: Record<string, string> =
    sort === 'oldest'
      ? { createdAt: 'asc' }
      : sort === 'price-asc'
        ? { sellPrice: 'asc' }
        : sort === 'price-desc'
          ? { sellPrice: 'desc' }
          : sort === 'name'
            ? { name: 'asc' }
            : sort === 'stock-low'
              ? { stock: 'asc' }
              : { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
        },
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        description: p.description,
        image: p.image,
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice,
        wholesalePrice: p.wholesalePrice,
        stock: p.stock,
        minStock: p.minStock,
        unit: p.unit,
        isTrackStock: p.isTrackStock,
        isAvailable: p.isAvailable,
        isFavorite: p.isFavorite,
        category: p.category,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Owner Products GET]', error);
    return NextResponse.json(
      { error: 'Gagal memuat data produk' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      name,
      categoryId,
      sku,
      barcode,
      buyPrice,
      sellPrice,
      wholesalePrice,
      stock,
      minStock,
      description,
      isFavorite,
      unit,
    } = body;

    if (!tenantId || !name || sellPrice == null) {
      return NextResponse.json(
        { error: 'tenantId, nama, dan harga jual wajib diisi' },
        { status: 400 },
      );
    }

    // Check SKU/barcode uniqueness
    if (sku) {
      const existing = await db.product.findUnique({ where: { sku } });
      if (existing) {
        return NextResponse.json(
          { error: 'SKU sudah digunakan' },
          { status: 409 },
        );
      }
    }
    if (barcode) {
      const existing = await db.product.findUnique({ where: { barcode } });
      if (existing) {
        return NextResponse.json(
          { error: 'Barcode sudah digunakan' },
          { status: 409 },
        );
      }
    }

    const product = await db.product.create({
      data: {
        tenantId,
        name,
        categoryId: categoryId || null,
        sku: sku || null,
        barcode: barcode || null,
        buyPrice: buyPrice ?? 0,
        sellPrice,
        wholesalePrice: wholesalePrice ?? null,
        stock: stock ?? 0,
        minStock: minStock ?? 5,
        unit: unit || 'pcs',
        description: description || null,
        isFavorite: isFavorite ?? false,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('[Owner Products POST]', error);
    return NextResponse.json(
      { error: 'Gagal membuat produk' },
      { status: 500 },
    );
  }
}
