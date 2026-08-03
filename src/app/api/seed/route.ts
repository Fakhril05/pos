import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const paymentMethods = ['QRIS', 'Bank Transfer', 'E-Wallet', 'Virtual Account', 'Credit Card']
const paymentChannels = ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'BCA', 'BNI', 'BRI', 'Mandiri', 'Permata', 'QRIS', 'Visa', 'Mastercard']
// Weighted: 70% success, 10% pending, 8% failed, 7% expired, 5% refunded
const statuses = [
  ...Array(70).fill('success'),
  ...Array(10).fill('pending'),
  ...Array(8).fill('failed'),
  ...Array(7).fill('expired'),
  ...Array(5).fill('refunded'),
]
const merchantNames = ['Toko Makmur Jaya', 'Warung Digital', 'Berkat Store', 'Jaya Elektronik', 'Maju Bersama', 'Kedai Kopi Nusantara', 'Baju Online ID', 'Pulsa Murah 88', 'Gadget Zone', 'Fresh Market']
const customerNames = ['Budi Santoso', 'Siti Rahayu', 'Ahmad Hidayat', 'Dewi Lestari', 'Rudi Hartono', 'Nurul Aini', 'Fajar Pratama', 'Rina Wati', 'Dedi Kurniawan', 'Anisa Putri', 'Bambang Suryo', 'Maya Sari', 'Hendra Wijaya', 'Lisa Permata', 'Rizky Ramadhan']
const bankNames = ['BCA', 'BNI', 'BRI', 'Mandiri', 'Permata', 'CIMB']

type MerchantSeed = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: string
  apiKey: string
  totalSales: number
  totalTx: number
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(daysBack: number): Date {
  const now = new Date()
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()))
}

export async function POST() {
  try {
    // Clean existing data
    await db.refund.deleteMany()
    await db.transaction.deleteMany()
    await db.paymentLink.deleteMany()
    await db.payout.deleteMany()
    await db.customer.deleteMany()
    await db.notification.deleteMany()
    await db.merchant.deleteMany()

    // Create merchants
    const merchants: MerchantSeed[] = merchantNames.map((name) => ({
      id: randomUUID().replace(/-/g, '').slice(0, 12),
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      phone: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      address: `${Math.floor(Math.random() * 100) + 1}, Jl. Sudirman, Jakarta`,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      apiKey: `pkrl_${randomUUID().replace(/-/g, '')}`,
      totalSales: 0,
      totalTx: 0,
    }))

    for (const m of merchants) {
      await db.merchant.create({ data: m })
    }

    // Create customers
    const customers = customerNames.map((name) => ({
      id: randomUUID().replace(/-/g, '').slice(0, 12),
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      phone: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      address: `${Math.floor(Math.random() * 100) + 1}, Jl. Gatot Subroto, Jakarta`,
      totalSpent: 0,
      totalTx: 0,
    }))

    for (const c of customers) {
      await db.customer.create({ data: c })
    }

    // Create transactions
    const txCount = 200
    const transactions: any[] = []
    for (let i = 0; i < txCount; i++) {
      const merchant = randomItem(merchants)
      const customer = randomItem(customers)
      const amount = Math.round(randomBetween(10000, 5000000))
      const fee = Math.round(amount * randomBetween(0.01, 0.03))
      const status = randomItem(statuses)
      const method = randomItem(paymentMethods)
      let channel = ''
      if (method === 'QRIS') channel = 'QRIS'
      else if (method === 'Bank Transfer') channel = randomItem(['BCA', 'BNI', 'BRI', 'Mandiri'])
      else if (method === 'E-Wallet') channel = randomItem(['GoPay', 'OVO', 'DANA', 'ShopeePay'])
      else if (method === 'Virtual Account') channel = randomItem(['BCA VA', 'BNI VA', 'BRI VA', 'Permata VA'])
      else channel = randomItem(['Visa', 'Mastercard'])

      const createdAt = randomDate(30)
      const paidAt = status === 'success' ? new Date(createdAt.getTime() + randomBetween(1000, 300000)) : null
      const expiredAt = status === 'expired' ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) : null

      transactions.push({
        id: randomUUID().replace(/-/g, '').slice(0, 12),
        invoiceNo: `INV-${String(i + 1).padStart(6, '0')}`,
        merchantId: merchant.id,
        customerId: customer.id,
        amount,
        fee,
        netAmount: amount - fee,
        paymentMethod: method,
        paymentChannel: channel,
        status,
        description: `Pembayaran untuk ${merchant.name}`,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        paidAt,
        expiredAt,
        createdAt,
        updatedAt: createdAt,
      })

      if (status === 'success') {
        merchant.totalSales += amount - fee
        merchant.totalTx += 1
        customer.totalSpent += amount
        customer.totalTx += 1
      }
    }

    for (const tx of transactions) {
      await db.transaction.create({ data: tx })
    }

    // Update merchant and customer totals
    for (const m of merchants) {
      await db.merchant.update({ where: { id: m.id }, data: { totalSales: m.totalSales, totalTx: m.totalTx } })
    }
    for (const c of customers) {
      await db.customer.update({ where: { id: c.id }, data: { totalSpent: c.totalSpent, totalTx: c.totalTx } })
    }

    // Create payment links
    const linkTitles = ['Pembayaran Order', 'Donasi', 'Tagihan Bulanan', 'Biaya Pendaftaran', 'Langganan Premium', 'Pembelian Produk']
    for (let i = 0; i < 20; i++) {
      const merchant = randomItem(merchants)
      const amount = Math.round(randomBetween(15000, 2000000))
      const createdAt = randomDate(15)
      const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)

      await db.paymentLink.create({
        data: {
          id: randomUUID().replace(/-/g, '').slice(0, 12),
          title: randomItem(linkTitles),
          description: `Link pembayaran untuk ${merchant.name}`,
          amount,
          merchantId: merchant.id,
          status: Math.random() > 0.2 ? 'active' : 'expired',
          type: Math.random() > 0.5 ? 'single' : 'multi',
          maxQty: Math.floor(randomBetween(1, 100)),
          soldQty: Math.floor(randomBetween(0, 50)),
          expiresAt,
          createdAt,
          updatedAt: createdAt,
        },
      })
    }

    // Create payouts
    for (let i = 0; i < 15; i++) {
      const merchant = randomItem(merchants)
      const amount = Math.round(randomBetween(500000, 25000000))
      const fee = Math.round(amount * 0.005)
      const status = randomItem(['completed', 'pending', 'processing'])
      const createdAt = randomDate(14)

      await db.payout.create({
        data: {
          id: randomUUID().replace(/-/g, '').slice(0, 12),
          merchantId: merchant.id,
          amount,
          fee,
          status,
          bankName: randomItem(bankNames),
          accountNo: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          accountName: merchant.name,
          notes: 'Payout rutin mingguan',
          processedAt: status === 'completed' ? new Date(createdAt.getTime() + randomBetween(3600000, 172800000)) : null,
          createdAt,
          updatedAt: createdAt,
        },
      })
    }

    // Create notifications
    const notifData = [
      { title: 'Pembayaran berhasil', message: 'Rp 2.500.000 dari Toko Makmur Jaya', type: 'success' },
      { title: 'Refund diproses', message: 'Rp 150.000 untuk INV-000015', type: 'info' },
      { title: 'Payout berhasil', message: 'Rp 15.000.000 ke BCA', type: 'success' },
      { title: 'Transaksi gagal', message: 'Pembayaran INV-000089 expired', type: 'warning' },
      { title: 'Merchant baru', message: 'Gadget Zone telah terdaftar', type: 'info' },
    ]
    for (const n of notifData) {
      await db.notification.create({ data: n })
    }

    return NextResponse.json({ success: true, count: { merchants: merchants.length, customers: customers.length, transactions: transactions.length } })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
