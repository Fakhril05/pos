import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId') || ''

    const where: { userId?: string } = {}
    if (userId) {
      where.userId = userId
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    const count = notifications.filter((n) => !n.isRead).length
    return NextResponse.json({ count, notifications })
  } catch {
    return NextResponse.json({ count: 0, notifications: [] }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId') || ''

    const where: { isRead?: boolean; userId?: string } = { isRead: false }
    if (userId) {
      where.userId = userId
    }

    await db.notification.updateMany({
      where,
      data: { isRead: true, readAt: new Date() },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
