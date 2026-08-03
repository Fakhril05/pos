import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
    })
    const count = notifications.filter((n) => !n.read).length
    return NextResponse.json({ count, notifications })
  } catch {
    return NextResponse.json({ count: 0, notifications: [] }, { status: 500 })
  }
}

export async function PATCH() {
  try {
    await db.notification.updateMany({
      where: { read: false },
      data: { read: true },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
