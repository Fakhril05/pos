import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true, status: true },
        },
        assignedOutlet: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan atau tidak aktif' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      outletId: user.assignedOutletId,
      tenantName: user.tenant?.name ?? null,
      outletName: user.assignedOutlet?.name ?? null,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
