import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// Zod-like manual validation (Zod v4 ESM import issues in server components)
function validateBody(body: Record<string, unknown>) {
  const errors: Record<string, string> = {}

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
    errors.name = 'Nama minimal 2 karakter'
  }

  if (!body.email || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = 'Format email tidak valid'
  }

  if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
    errors.password = 'Password minimal 6 karakter'
  }

  const validRoles = ['business_owner', 'manager', 'cashier']
  if (!body.role || !validRoles.includes(body.role as string)) {
    errors.role = 'Role tidak valid'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

// POST: Buat akun baru (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, isActive, tenantId } = body

    // Validasi input
    const { valid, errors } = validateBody(body)
    if (!valid) {
      return NextResponse.json({ error: 'Validasi gagal', details: errors }, { status: 400 })
    }

    // Cek email sudah terdaftar (global uniqueness)
    const existingUser = await db.user.findUnique({ where: { email: email as string } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar', details: { email: 'Email ini sudah digunakan oleh akun lain' } },
        { status: 409 }
      )
    }

    // Jika role business_owner, otomatis buat Tenant & Subscription
    let finalTenantId = tenantId as string | null
    if (role === 'business_owner' && !tenantId) {
      // Buat tenant baru otomatis
      const slug = (name as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`

      const newTenant = await db.tenant.create({
        data: {
          name: `${name}'s Business`,
          slug: uniqueSlug,
          email: email as string,
          status: isActive ? 'active' : 'trial',
        },
      })

      // Buat subscription free plan
      await db.subscription.create({
        data: {
          tenantId: newTenant.id,
          plan: 'free',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      finalTenantId = newTenant.id
    }

    // Hash password dengan bcrypt (salt rounds 10)
    const hashedPassword = await bcrypt.hash(password as string, 10)

    // Buat user
    const user = await db.user.create({
      data: {
        name: name as string,
        email: email as string,
        passwordHash: hashedPassword,
        role: role as string,
        isActive: isActive !== false, // default true
        tenantId: finalTenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Akun ${role === 'business_owner' ? 'Merchant' : 'Pengguna'} berhasil dibuat`,
      user,
    })
  } catch (error: any) {
    // Tangani error unique constraint dari Prisma
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email sudah terdaftar', details: { email: 'Email ini sudah digunakan' } },
        { status: 409 }
      )
    }
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Gagal membuat akun' }, { status: 500 })
  }
}

// GET: Daftar semua user (Super Admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }
    if (role) {
      where.role = role
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        tenantId: true,
        tenant: { select: { name: true } },
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Fetch users error:', error)
    return NextResponse.json({ error: 'Gagal memuat data pengguna' }, { status: 500 })
  }
}
