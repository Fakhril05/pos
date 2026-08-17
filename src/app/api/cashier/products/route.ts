import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const outletId = searchParams.get('outletId')
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId wajib diisi' }, { status: 400 })
    }

    const where: Record<string, unknown> = {
      tenantId,
      isAvailable: true,
    }

    if (search) {
      where.name = { contains: search }
    }
    if (categoryId) {
      where.categoryId = categoryId
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
      orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
    })

    // Get all categories for this tenant that have products
    const categories = await db.category.findMany({
      where: {
        tenantId,
        isActive: true,
        products: { some: { isAvailable: true } },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ products, categories })
  } catch (error) {
    console.error('Cashier products error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 },
    )
  }
}
