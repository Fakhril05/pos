import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

// ============================================================
// Seed data for Pos Ril Multi-Tenant SaaS POS
// ============================================================

const paymentMethods = ['QRIS', 'Bank Transfer', 'E-Wallet', 'Virtual Account', 'Credit Card', 'Cash']
const paymentChannels = ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'BCA', 'BNI', 'BRI', 'Mandiri', 'Permata', 'QRIS', 'Visa', 'Mastercard', 'Tunai']
const weightedStatuses = [
  ...Array(70).fill('paid'),
  ...Array(10).fill('pending'),
  ...Array(5).fill('cancelled'),
  ...Array(5).fill('refunded'),
  ...Array(7).fill('void'),
]

const tenantNames = [
  { name: 'Toko Makmur Jaya', slug: 'toko-makmur-jaya', city: 'Jakarta Selatan', province: 'DKI Jakarta' },
  { name: 'Warung Digital', slug: 'warung-digital', city: 'Bandung', province: 'Jawa Barat' },
  { name: 'Berkat Store', slug: 'berkat-store', city: 'Surabaya', province: 'Jawa Timur' },
  { name: 'Jaya Elektronik', slug: 'jaya-elektronik', city: 'Jakarta Utara', province: 'DKI Jakarta' },
  { name: 'Maju Bersama', slug: 'maju-bersama', city: 'Yogyakarta', province: 'DI Yogyakarta' },
  { name: 'Kedai Kopi Nusantara', slug: 'kedai-kopi-nusantara', city: 'Medan', province: 'Sumatera Utara' },
  { name: 'Baju Online ID', slug: 'baju-online-id', city: 'Semarang', province: 'Jawa Tengah' },
  { name: 'Pulsa Murah 88', slug: 'pulsa-murah-88', city: 'Makassar', province: 'Sulawesi Selatan' },
  { name: 'Gadget Zone', slug: 'gadget-zone', city: 'Bali', province: 'Bali' },
  { name: 'Fresh Market', slug: 'fresh-market', city: 'Depok', province: 'Jawa Barat' },
]

const customerNames = [
  'Budi Santoso', 'Siti Rahayu', 'Ahmad Hidayat', 'Dewi Lestari', 'Rudi Hartono',
  'Nurul Aini', 'Fajar Pratama', 'Rina Wati', 'Dedi Kurniawan', 'Anisa Putri',
  'Bambang Suryo', 'Maya Sari', 'Hendra Wijaya', 'Lisa Permata', 'Rizky Ramadhan',
]

const categoryTemplates = [
  ['Makanan', 'Minuman', 'Snack', 'Paket Hemat'],
  ['Elektronik', 'Aksesoris', 'Peralatan', 'Komponen'],
  ['Pakaian Pria', 'Pakaian Wanita', 'Anak-anak', 'Aksesoris'],
  ['Pulsa', 'Paket Data', 'Voucher Game', 'Token Listrik'],
]

const productTemplates = {
  Makanan: [
    { name: 'Nasi Goreng Spesial', price: 25000, cost: 12000 },
    { name: 'Mie Ayam Bakso', price: 20000, cost: 8000 },
    { name: 'Soto Betawi', price: 22000, cost: 9000 },
    { name: 'Ayam Geprek', price: 18000, cost: 7000 },
    { name: 'Nasi Padang Komplit', price: 28000, cost: 13000 },
    { name: 'Burger Wagyu', price: 35000, cost: 15000 },
    { name: 'Rendang Sapi', price: 32000, cost: 14000 },
    { name: 'Gado-Gado', price: 15000, cost: 5000 },
  ],
  Minuman: [
    { name: 'Es Teh Manis', price: 5000, cost: 1500 },
    { name: 'Kopi Susu', price: 18000, cost: 6000 },
    { name: 'Jus Alpukat', price: 15000, cost: 5000 },
    { name: 'Es Jeruk', price: 8000, cost: 2500 },
    { name: 'Smoothie Bowl', price: 25000, cost: 10000 },
    { name: 'Matcha Latte', price: 22000, cost: 8000 },
  ],
  Snack: [
    { name: 'Kentang Goreng', price: 15000, cost: 5000 },
    { name: 'Cireng Isi', price: 10000, cost: 3000 },
    { name: 'Dimsum', price: 20000, cost: 8000 },
    { name: 'Pisang Goreng', price: 8000, cost: 3000 },
  ],
  'Paket Hemat': [
    { name: 'Paket A (Nasi+Teh)', price: 28000, cost: 13500 },
    { name: 'Paket B (Mie+Jus)', price: 30000, cost: 13000 },
    { name: 'Paket Family', price: 85000, cost: 38000 },
  ],
  Elektronik: [
    { name: 'Charger USB-C 20W', price: 85000, cost: 35000 },
    { name: 'Powerbank 10000mAh', price: 150000, cost: 65000 },
    { name: 'Earbuds Bluetooth', price: 250000, cost: 110000 },
    { name: 'Kabel Aux 1.5m', price: 25000, cost: 8000 },
  ],
  Aksesoris: [
    { name: 'Casing HP Premium', price: 45000, cost: 12000 },
    { name: 'Tempered Glass', price: 35000, cost: 10000 },
    { name: 'Ring Holder', price: 15000, cost: 3000 },
    { name: 'Tali HP Sport', price: 20000, cost: 5000 },
  ],
  Peralatan: [
    { name: 'Mouse Wireless', price: 75000, cost: 30000 },
    { name: 'Keyboard Mechanical', price: 350000, cost: 150000 },
    { name: 'Webcam HD', price: 280000, cost: 120000 },
  ],
  Komponen: [
    { name: 'SSD 256GB', price: 450000, cost: 280000 },
    { name: 'RAM DDR4 8GB', price: 320000, cost: 180000 },
    { name: 'Fan CPU', price: 65000, cost: 25000 },
  ],
  'Pakaian Pria': [
    { name: 'Kaos Polos Hitam', price: 75000, cost: 25000 },
    { name: 'Kemeja Slim Fit', price: 150000, cost: 55000 },
    { name: 'Celana Chino', price: 180000, cost: 65000 },
    { name: 'Jaket Denim', price: 250000, cost: 100000 },
  ],
  'Pakaian Wanita': [
    { name: 'Blouse Ruffle', price: 120000, cost: 40000 },
    { name: 'Rok Plisket', price: 95000, cost: 35000 },
    { name: 'Dress Casual', price: 165000, cost: 55000 },
  ],
  'Anak-anak': [
    { name: 'Kaos Anak Karakter', price: 55000, cost: 18000 },
    { name: 'Celana Pendek Anak', price: 45000, cost: 15000 },
    { name: 'Setelan Anak', price: 85000, cost: 30000 },
  ],
  Pulsa: [
    { name: 'Pulsa Telkomsel 10K', price: 12000, cost: 10500 },
    { name: 'Pulsa Telkomsel 25K', price: 27000, cost: 25000 },
    { name: 'Pulsa XL 50K', price: 51000, cost: 48500 },
  ],
  'Paket Data': [
    { name: 'Paket 10GB 30 Hari', price: 65000, cost: 55000 },
    { name: 'Paket Unlimited Harian', price: 15000, cost: 12000 },
    { name: 'Paket 30GB 30 Hari', price: 100000, cost: 80000 },
  ],
  'Voucher Game': [
    { name: 'Voucher ML 86 Diamond', price: 22000, cost: 18000 },
    { name: 'Voucher FF 100 Diamond', price: 15000, cost: 12000 },
    { name: 'Voucher Genshin 60 Genesis', price: 16000, cost: 13000 },
  ],
  'Token Listrik': [
    { name: 'Token Listrik 50K', price: 52000, cost: 50000 },
    { name: 'Token Listrik 100K', price: 103000, cost: 100000 },
    { name: 'Token Listrik 200K', price: 203000, cost: 200000 },
  ],
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

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function POST() {
  try {
    // Clean existing data in reverse dependency order
    await db.auditLog.deleteMany()
    await db.notification.deleteMany()
    await db.apiKey.deleteMany()
    await db.tenantSettings.deleteMany()
    await db.subscription.deleteMany()
    await db.inventoryLog.deleteMany()
    await db.tax.deleteMany()
    await db.discount.deleteMany()
    await db.shift.deleteMany()
    await db.refund.deleteMany()
    await db.payment.deleteMany()
    await db.transactionItem.deleteMany()
    await db.transaction.deleteMany()
    await db.customer.deleteMany()
    await db.paymentLink.deleteMany()
    await db.payout.deleteMany()
    await db.product.deleteMany()
    await db.category.deleteMany()
    await db.user.deleteMany()
    await db.outlet.deleteMany()
    await db.tenant.deleteMany()

    // ============================================================
    // 1. Create Super Admin
    // ============================================================
    const superAdmin = await db.user.create({
      data: {
        email: 'admin@posril.id',
        passwordHash: '$2b$10$hash_placeholder', // Placeholder - in production, use bcrypt
        name: 'Super Admin',
        role: 'super_admin',
        isActive: true,
      },
    })

    // ============================================================
    // 2. Create Tenants (Businesses)
    // ============================================================
    const tenants: any[] = []
    for (const t of tenantNames) {
      const tenant = await db.tenant.create({
        data: {
          name: t.name,
          slug: t.slug,
          email: `${t.slug}@email.com`,
          phone: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          address: `${Math.floor(Math.random() * 100) + 1}, Jl. Sudirman`,
          city: t.city,
          province: t.province,
          status: Math.random() > 0.1 ? 'active' : 'trial',
          trialEndsAt: Math.random() > 0.5 ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
        },
      })
      tenants.push(tenant)
    }

    // ============================================================
    // 3. Create Subscriptions & Settings for each Tenant
    // ============================================================
    const plans = ['free', 'starter', 'professional', 'enterprise']
    for (const tenant of tenants) {
      const plan = randomItem(plans)
      await db.subscription.create({
        data: {
          tenantId: tenant.id,
          plan,
          status: 'active',
          maxOutlets: plan === 'free' ? 1 : plan === 'starter' ? 3 : plan === 'professional' ? 10 : 99,
          maxUsers: plan === 'free' ? 5 : plan === 'starter' ? 15 : plan === 'professional' ? 50 : 999,
          maxProducts: plan === 'free' ? 100 : plan === 'starter' ? 500 : plan === 'professional' ? 5000 : 99999,
          monthlyPrice: plan === 'free' ? 0 : plan === 'starter' ? 149000 : plan === 'professional' ? 449000 : 1499000,
          billingCycle: Math.random() > 0.5 ? 'monthly' : 'yearly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      await db.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          receiptHeader: `=== ${tenant.name} ===`,
          receiptFooter: 'Terima kasih atas kunjungan Anda!',
          showReceiptLogo: true,
          autoPrintReceipt: Math.random() > 0.3,
          requireCustomer: false,
          allowVoid: true,
          allowDiscount: true,
          enabledPaymentMethods: JSON.stringify(['cash', 'qris', 'e_wallet', 'bank_transfer']),
          currency: 'IDR',
          currencySymbol: 'Rp',
          locale: 'id-ID',
        },
      })

      // Create Tax config
      await db.tax.create({
        data: {
          tenantId: tenant.id,
          name: 'PPN 11%',
          rate: 11.0,
          type: 'percentage',
          isActive: true,
          isDefault: true,
        },
      })
    }

    // ============================================================
    // 4. Create Outlets per Tenant
    // ============================================================
    const outlets: any[] = []
    for (const tenant of tenants) {
      const outletCount = Math.floor(randomBetween(1, 4))
      for (let i = 0; i < outletCount; i++) {
        const outlet = await db.outlet.create({
          data: {
            tenantId: tenant.id,
            name: i === 0 ? 'Outlet Utama' : `Cabang ${String.fromCharCode(65 + i - 1)}`,
            code: `OUT-${String(i + 1).padStart(3, '0')}`,
            address: `${Math.floor(Math.random() * 100) + 1}, Jl. Raya ${tenant.city}`,
            city: tenant.city,
            province: tenant.province,
            isOpen: Math.random() > 0.2,
          },
        })
        outlets.push(outlet)
      }
    }

    // ============================================================
    // 5. Create Users per Tenant (all 4 roles)
    // ============================================================
    const allUsers: any[] = [superAdmin]
    const userNames = {
      owners: ['Pak Hendra', 'Bu Ratna', 'Mas Doni', 'Mbak Sari', 'Pak Agus', 'Bu Linda', 'Mas Yoga', 'Bu Dewi', 'Pak Rizal', 'Bu Anita'],
      managers: ['Andi Manager', 'Budi Supervisor', 'Citra Manager', 'Dina Lead', 'Eko Supervisor'],
      cashiers: ['Sinta Kasir', 'Rani Kasir', 'Dian Kasir', 'Gita Kasir', 'Hana Kasir', 'Ika Kasir', 'Joko Kasir', 'Kiki Kasir'],
    }

    for (const tenant of tenants) {
      // Business Owner
      const ownerName = userNames.owners[tenants.indexOf(tenant)] || randomItem(userNames.owners)
      const owner = await db.user.create({
        data: {
          email: `${tenant.slug}.owner@posril.com`,
          passwordHash: '$2b$10$hash_placeholder',
          name: ownerName,
          phone: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          role: 'business_owner',
          isActive: true,
          tenantId: tenant.id,
        },
      })
      allUsers.push(owner)

      // Managers (1-2 per tenant)
      const managerCount = Math.floor(randomBetween(1, 3))
      for (let i = 0; i < managerCount; i++) {
        const tenantOutlets = outlets.filter((o) => o.tenantId === tenant.id)
        const manager = await db.user.create({
          data: {
            email: `${tenant.slug}.manager${i + 1}@posril.com`,
            passwordHash: '$2b$10$hash_placeholder',
            name: randomItem(userNames.managers),
            phone: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            role: 'manager',
            isActive: true,
            tenantId: tenant.id,
            assignedOutletId: randomItem(tenantOutlets)?.id || null,
          },
        })
        allUsers.push(manager)
      }

      // Cashiers (2-4 per tenant)
      const cashierCount = Math.floor(randomBetween(2, 5))
      for (let i = 0; i < cashierCount; i++) {
        const tenantOutlets = outlets.filter((o) => o.tenantId === tenant.id)
        const cashier = await db.user.create({
          data: {
            email: `${tenant.slug}.cashier${i + 1}@posril.com`,
            passwordHash: '$2b$10$hash_placeholder',
            name: randomItem(userNames.cashiers),
            phone: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            pin: String(Math.floor(100000 + Math.random() * 900000)),
            role: 'cashier',
            isActive: true,
            tenantId: tenant.id,
            assignedOutletId: randomItem(tenantOutlets)?.id || null,
          },
        })
        allUsers.push(cashier)
      }
    }

    // ============================================================
    // 5.5 Create Demo Accounts for Toko Makmur Jaya (first tenant)
    // ============================================================
    const makmurTenant = tenants[0]
    const makmurOutlets = outlets.filter((o: any) => o.tenantId === makmurTenant.id)

    // Demo Business Owner
    const demoOwner = await db.user.create({
      data: {
        email: 'owner1@makmur.id',
        passwordHash: '$2b$10$hash_placeholder',
        name: 'Pak Hendra',
        phone: '081234567890',
        role: 'business_owner',
        isActive: true,
        tenantId: makmurTenant.id,
      },
    })
    allUsers.push(demoOwner)

    // Demo Manager
    const demoManager = await db.user.create({
      data: {
        email: 'manager1@makmur.id',
        passwordHash: '$2b$10$hash_placeholder',
        name: 'Andi Manager',
        phone: '081234567891',
        role: 'manager',
        isActive: true,
        tenantId: makmurTenant.id,
        assignedOutletId: makmurOutlets[0]?.id || null,
      },
    })
    allUsers.push(demoManager)

    // Demo Cashier
    const demoCashier = await db.user.create({
      data: {
        email: 'kasir1@makmur.id',
        passwordHash: '$2b$10$hash_placeholder',
        name: 'Sinta Kasir',
        phone: '081234567892',
        pin: '123456',
        role: 'cashier',
        isActive: true,
        tenantId: makmurTenant.id,
        assignedOutletId: makmurOutlets[0]?.id || null,
      },
    })
    allUsers.push(demoCashier)

    // ============================================================
    // 6. Create Categories & Products per Tenant
    // ============================================================
    const allProducts: any[] = []
    for (const tenant of tenants) {
      const catTemplate = randomItem(categoryTemplates)
      const categories: any[] = []

      for (const catName of catTemplate) {
        const category = await db.category.create({
          data: {
            tenantId: tenant.id,
            name: catName,
            icon: catName.includes('Pakaian') ? '👕' : catName.includes('Pulsa') || catName.includes('Paket') || catName.includes('Token') ? '📱' : '📦',
            color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
            sortOrder: catTemplate.indexOf(catName),
          },
        })
        categories.push(category)

        // Create products for this category
        const products = (productTemplates as any)[catName] || []
        for (const p of products) {
          const stock = Math.floor(randomBetween(10, 200))
          const product = await db.product.create({
            data: {
              tenantId: tenant.id,
              categoryId: category.id,
              sku: `${generateSlug(tenant.name).slice(0, 6)}-${generateSlug(p.name).slice(0, 6)}-${randomUUID().slice(0, 5)}`.toUpperCase(),
              name: p.name,
              buyPrice: p.cost,
              sellPrice: p.price,
              stock,
              minStock: Math.floor(stock * 0.2),
              unit: catName.includes('Pulsa') || catName.includes('Paket') || catName.includes('Token') || catName.includes('Voucher') ? 'pcs' : 'pcs',
              isTrackStock: true,
              isAvailable: true,
              isFavorite: Math.random() > 0.6,
            },
          })
          allProducts.push(product)
        }
      }

      // Create initial inventory log
      for (const product of allProducts.filter((p) => p.tenantId === tenant.id).slice(0, 5)) {
        await db.inventoryLog.create({
          data: {
            tenantId: tenant.id,
            productId: product.id,
            type: 'initial',
            quantity: product.stock,
            previousStock: 0,
            newStock: product.stock,
            reason: 'Stok awal',
            performedBy: allUsers.find((u) => u.tenantId === tenant.id && u.role === 'business_owner')?.id || null,
          },
        })
      }
    }

    // ============================================================
    // 7. Create Customers per Tenant
    // ============================================================
    const allCustomers: any[] = []
    for (const tenant of tenants) {
      const customerCount = Math.floor(randomBetween(8, 15))
      for (let i = 0; i < customerCount; i++) {
        const name = customerNames[i % customerNames.length]
        const customer = await db.customer.create({
          data: {
            tenantId: tenant.id,
            name: `${name} (${tenant.name.slice(0, 5)})`,
            email: `${generateSlug(name)}@email.com`,
            phone: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            address: `${Math.floor(Math.random() * 100) + 1}, Jl. Gatot Subroto, ${tenant.city}`,
            loyaltyPoints: Math.floor(randomBetween(0, 5000)),
          },
        })
        allCustomers.push(customer)
      }
    }

    // ============================================================
    // 8. Create Transactions with Items & Payments
    // ============================================================
    const txCount = 250
    const transactionStats = new Map<string, { totalSales: number; totalTx: number }>()

    for (let i = 0; i < txCount; i++) {
      const tenant = randomItem(tenants)
      const tenantOutlets = outlets.filter((o) => o.tenantId === tenant.id)
      const tenantCashiers = allUsers.filter((u) => u.tenantId === tenant.id && u.role === 'cashier')
      const tenantProducts = allProducts.filter((p) => p.tenantId === tenant.id)
      const tenantCustomers = allCustomers.filter((c) => c.tenantId === tenant.id)

      const outlet = randomItem(tenantOutlets) || outlets[0]
      const cashier = randomItem(tenantCashiers) || allUsers[1]
      const customer = Math.random() > 0.3 ? randomItem(tenantCustomers) : null
      const status = randomItem(weightedStatuses)

      // Generate line items (1-5 items per transaction)
      const itemCount = Math.floor(randomBetween(1, 6))
      const items: any[] = []
      let subtotalAmount = 0

      const selectedProducts = new Set<string>()
      for (let j = 0; j < itemCount && j < tenantProducts.length; j++) {
        let product
        do {
          product = randomItem(tenantProducts)
        } while (selectedProducts.has(product.id))
        selectedProducts.add(product.id)

        const qty = Math.floor(randomBetween(1, 4))
        const itemDiscount = Math.random() > 0.8 ? Math.round(randomBetween(0, 5000)) : 0
        const totalPrice = (product.sellPrice * qty) - itemDiscount
        subtotalAmount += totalPrice

        items.push({
          name: product.name,
          sku: product.sku || null,
          buyPrice: product.buyPrice,
          sellPrice: product.sellPrice,
          quantity: qty,
          unit: product.unit,
          discount: itemDiscount,
          taxRate: 0,
          totalPrice,
        })
      }

      const discountAmount = Math.random() > 0.7 ? Math.round(subtotalAmount * 0.05) : 0
      const taxAmount = Math.round((subtotalAmount - discountAmount) * 0.11)
      const totalAmount = subtotalAmount - discountAmount + taxAmount

      const createdAt = randomDate(30)
      const paidAt = status === 'paid' ? new Date(createdAt.getTime() + randomBetween(1000, 300000)) : null
      const voidedAt = status === 'void' ? new Date(createdAt.getTime() + randomBetween(5000, 60000)) : null

      const invoiceNo = `INV-${createdAt.toISOString().slice(0, 10).replace(/-/g, '')}-${String(i + 1).padStart(5, '0')}`

      const method = randomItem(paymentMethods)
      let channel = ''
      if (method === 'QRIS') channel = 'QRIS'
      else if (method === 'Bank Transfer') channel = randomItem(['BCA', 'BNI', 'BRI', 'Mandiri'])
      else if (method === 'E-Wallet') channel = randomItem(['GoPay', 'OVO', 'DANA', 'ShopeePay'])
      else if (method === 'Cash') channel = 'Tunai'
      else if (method === 'Virtual Account') channel = randomItem(['BCA VA', 'BNI VA', 'BRI VA'])
      else channel = randomItem(['Visa', 'Mastercard'])

      const fee = Math.round(totalAmount * randomBetween(0.005, 0.03))
      const paymentStatus = status === 'paid' ? 'fully_paid' : status === 'pending' ? 'unpaid' : 'unpaid'

      // Create Transaction
      const transaction = await db.transaction.create({
        data: {
          tenantId: tenant.id,
          outletId: outlet.id,
          cashierId: cashier.id,
          invoiceNo,
          customerId: customer?.id || null,
          subtotalAmount,
          discountAmount,
          taxAmount,
          totalAmount,
          status,
          paymentStatus,
          customerName: customer?.name || null,
          customerPhone: customer?.phone || null,
          paidAt,
          voidedAt,
          voidReason: status === 'void' ? 'Barang rusak / salah input' : null,
          createdAt,
          updatedAt: createdAt,
          items: {
            create: items.map((item) => ({
              ...item,
              productId: items.indexOf(item) < tenantProducts.length ? tenantProducts[selectedProducts.values().next().value || 0]?.id || tenantProducts[0].id : tenantProducts[0].id,
            })),
          },
          payments: status === 'paid' ? {
            create: {
              paymentMethod: method,
              paymentChannel: channel,
              amount: totalAmount,
              fee,
              netAmount: totalAmount - fee,
              status: 'success',
              paidAt,
            },
          } : undefined,
        },
      })

      // Fix product IDs in items (re-query to update)
      // Update transaction stats
      if (status === 'paid') {
        const stats = transactionStats.get(tenant.id) || { totalSales: 0, totalTx: 0 }
        stats.totalSales += totalAmount
        stats.totalTx += 1
        transactionStats.set(tenant.id, stats)

        if (customer) {
          await db.customer.update({
            where: { id: customer.id },
            data: {
              totalSpent: { increment: totalAmount },
              totalTx: { increment: 1 },
              loyaltyPoints: { increment: Math.floor(totalAmount / 10000) },
            },
          })
        }
      }
    }

    // Update tenant aggregate stats
    for (const [tenantId, stats] of transactionStats.entries()) {
      await db.tenant.update({
        where: { id: tenantId },
        data: {
          totalSales: stats.totalSales,
          totalTx: stats.totalTx,
        },
      })
    }

    // ============================================================
    // 9. Create Shifts
    // ============================================================
    const shiftCount = 30
    for (let i = 0; i < shiftCount; i++) {
      const tenant = randomItem(tenants)
      const tenantOutlets = outlets.filter((o) => o.tenantId === tenant.id)
      const tenantCashiers = allUsers.filter((u) => u.tenantId === tenant.id && u.role === 'cashier')
      const outlet = randomItem(tenantOutlets) || outlets[0]
      const cashier = randomItem(tenantCashiers) || allUsers[1]

      const isClosed = Math.random() > 0.3
      const openedAt = randomDate(7)
      const shiftSales = Math.round(randomBetween(500000, 5000000))

      await db.shift.create({
        data: {
          tenantId: tenant.id,
          outletId: outlet.id,
          cashierId: cashier.id,
          status: isClosed ? 'closed' : 'open',
          openedAt,
          closedAt: isClosed ? new Date(openedAt.getTime() + randomBetween(8 * 3600000, 12 * 3600000)) : null,
          openingCash: 500000,
          closingCash: isClosed ? 500000 + shiftSales : null,
          expectedCash: isClosed ? 500000 + shiftSales : null,
          cashDifference: isClosed ? Math.round(randomBetween(-5000, 5000)) : null,
          totalSales: shiftSales,
          totalTx: Math.floor(randomBetween(10, 80)),
          totalRefunds: Math.round(randomBetween(0, 200000)),
        },
      })
    }

    // ============================================================
    // 10. Create Payment Links
    // ============================================================
    const linkTitles = ['Pembayaran Order', 'Donasi', 'Tagihan Bulanan', 'Biaya Pendaftaran', 'Langganan Premium', 'Pembelian Produk']
    for (let i = 0; i < 25; i++) {
      const tenant = randomItem(tenants)
      const amount = Math.round(randomBetween(15000, 2000000))
      const createdAt = randomDate(15)

      await db.paymentLink.create({
        data: {
          tenantId: tenant.id,
          title: randomItem(linkTitles),
          description: `Link pembayaran untuk ${tenant.name}`,
          amount,
          status: Math.random() > 0.3 ? 'active' : 'expired',
          linkType: Math.random() > 0.5 ? 'single' : 'multi',
          maxQty: Math.floor(randomBetween(1, 100)),
          soldQty: Math.floor(randomBetween(0, 50)),
          expiresAt: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
          createdAt,
          updatedAt: createdAt,
        },
      })
    }

    // ============================================================
    // 11. Create Payouts
    // ============================================================
    const bankNames = ['BCA', 'BNI', 'BRI', 'Mandiri', 'Permata', 'CIMB']
    for (let i = 0; i < 15; i++) {
      const tenant = randomItem(tenants)
      const amount = Math.round(randomBetween(500000, 25000000))
      const fee = Math.round(amount * 0.005)
      const status = randomItem(['completed', 'pending', 'processing'])
      const requestedAt = randomDate(14)

      await db.payout.create({
        data: {
          tenantId: tenant.id,
          amount,
          fee,
          status,
          bankName: randomItem(bankNames),
          accountNo: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          accountName: tenant.name,
          notes: 'Payout rutin mingguan',
          processedAt: status === 'completed' ? new Date(requestedAt.getTime() + randomBetween(3600000, 172800000)) : null,
          requestedAt,
          createdAt: requestedAt,
          updatedAt: requestedAt,
        },
      })
    }

    // ============================================================
    // 12. Create Refunds (for some paid transactions)
    // ============================================================
    const paidTransactions = await db.transaction.findMany({
      where: { status: 'paid' },
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    for (const tx of paidTransactions) {
      if (Math.random() > 0.5) continue
      await db.refund.create({
        data: {
          transactionId: tx.id,
          amount: Math.round(tx.totalAmount * randomBetween(0.3, 1.0)),
          reason: Math.random() > 0.5 ? 'Barang tidak sesuai' : 'Pembatalan oleh pelanggan',
          status: randomItem(['completed', 'approved', 'pending']),
          processedAt: Math.random() > 0.5 ? new Date() : null,
        },
      })

      await db.transaction.update({
        where: { id: tx.id },
        data: { status: 'refunded' },
      })
    }

    // ============================================================
    // 13. Create Notifications for users
    // ============================================================
    const notifTemplates = [
      { title: 'Pembayaran berhasil', message: 'Rp 2.500.000 diterima', type: 'success', category: 'transaction' },
      { title: 'Stok menipis', message: 'Nasi Goreng Spesial sisa < 10 unit', type: 'warning', category: 'inventory' },
      { title: 'Shift dibuka', message: 'Shift baru dimulai', type: 'info', category: 'shift' },
      { title: 'Payout berhasil', message: 'Rp 15.000.000 telah ditransfer ke BCA', type: 'success', category: 'payout' },
      { title: 'Pelanggan baru', message: 'Pelanggan baru terdaftar', type: 'info', category: 'system' },
      { title: 'Transaksi gagal', message: 'Pembayaran expired', type: 'warning', category: 'transaction' },
      { title: 'Refund diproses', message: 'Refund Rp 150.000 berhasil', type: 'info', category: 'refund' },
    ]

    for (const user of allUsers) {
      if (user.role === 'super_admin' || Math.random() > 0.5) continue
      const notifCount = Math.floor(randomBetween(1, 5))
      for (let i = 0; i < notifCount; i++) {
        const template = randomItem(notifTemplates)
        await db.notification.create({
          data: {
            userId: user.id,
            title: template.title,
            message: template.message,
            type: template.type,
            category: template.category,
            isRead: Math.random() > 0.6,
            readAt: Math.random() > 0.6 ? randomDate(2) : null,
          },
        })
      }
    }

    // ============================================================
    // 14. Create API Keys for tenants
    // ============================================================
    for (const tenant of tenants) {
      await db.apiKey.create({
        data: {
          tenantId: tenant.id,
          name: 'Production Key',
          key: `pkrl_${randomUUID().replace(/-/g, '')}`,
          prefix: 'pkrl',
          permissions: 'read_write',
          isActive: true,
        },
      })
    }

    // ============================================================
    // 15. Create Audit Log entries
    // ============================================================
    const auditActions = [
      { action: 'login', entity: 'User', category: 'system' },
      { action: 'create', entity: 'Transaction', category: 'transaction' },
      { action: 'update', entity: 'Product', category: 'inventory' },
      { action: 'void', entity: 'Transaction', category: 'transaction' },
      { action: 'refund', entity: 'Transaction', category: 'refund' },
    ]

    for (let i = 0; i < 50; i++) {
      const tenant = randomItem(tenants)
      const tenantUsers = allUsers.filter((u) => u.tenantId === tenant.id)
      const user = randomItem(tenantUsers) || superAdmin

      const audit = randomItem(auditActions)
      await db.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          action: audit.action,
          entity: audit.entity,
          entityId: randomUUID().replace(/-/g, '').slice(0, 12),
          ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          createdAt: randomDate(7),
        },
      })
    }

    // ============================================================
    // 16. Create Discounts for some tenants
    // ============================================================
    for (const tenant of tenants) {
      if (Math.random() > 0.4) continue
      const discount = await db.discount.create({
        data: {
          tenantId: tenant.id,
          name: 'Diskon Akhir Bulan',
          description: 'Diskon 10% untuk semua transaksi di atas Rp 100.000',
          discountType: 'percentage',
          discountValue: 10,
          minPurchase: 100000,
          maxDiscount: 50000,
          appliesTo: 'all',
          isActive: true,
          startsAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          maxUsage: 100,
        },
      })
    }

    // ============================================================
    // Summary
    // ============================================================
    const summary = {
      success: true,
      message: 'Multi-tenant POS seed completed',
      data: {
        tenants: tenants.length,
        outlets: outlets.length,
        users: allUsers.length,
        products: allProducts.length,
        customers: allCustomers.length,
        transactions: txCount,
        shifts: shiftCount,
        paymentLinks: 25,
        payouts: 15,
      },
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed failed', details: String(error) }, { status: 500 })
  }
}
