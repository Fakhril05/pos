import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PATCH: Toggle tenant status (suspend/activate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { action } = await request.json()

    const tenant = await db.tenant.findUnique({ where: { id } })
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 })
    }

    let newStatus: string
    if (action === 'suspend') {
      newStatus = tenant.status === 'suspended' ? 'active' : 'suspended'
    } else if (action === 'activate') {
      newStatus = 'active'
    } else if (action === 'close') {
      newStatus = 'closed'
    } else {
      return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 })
    }

    const updated = await db.tenant.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, name: true, status: true },
    })

    // Nonaktifkan/aktifkan user saat suspend/activate
    if (newStatus === 'suspended') {
      await db.user.updateMany({ where: { tenantId: id }, data: { isActive: false } })
    } else if (newStatus === 'active') {
      await db.user.updateMany({ where: { tenantId: id, role: 'business_owner' }, data: { isActive: true } })
    }

    return NextResponse.json({
      success: true,
      message: `Tenant ${updated.name} berhasil ${newStatus === 'active' ? 'diaktifkan' : newStatus === 'suspended' ? 'dinonaktifkan' : 'ditutup'}`,
      tenant: updated,
    })
  } catch (error) {
    console.error('Tenant update error:', error)
    return NextResponse.json({ error: 'Gagal mengubah status tenant' }, { status: 500 })
  }
}

// GET: Detail tenant
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tenant = await db.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, outlets: true, products: true, transactions: true } },
        subscription: true,
        users: {
          where: { role: 'business_owner' },
          select: { id: true, name: true, email: true, phone: true },
          take:1,
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Tenant detail error:', error)
    return NextResponse.json({ error: 'Gagal memuat detail tenant' }, { status: 500 })
  }
}
