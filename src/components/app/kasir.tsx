'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Check,
  Printer,
  Clock,
  Wallet,
  CreditCard,
  Building2,
  QrCode,
  Smartphone,
  Banknote,
  ShoppingCart,
  Loader2,
  History,
  CircleDollarSign,
  ChevronRight,
  Package,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { generateReceiptHtml } from '@/lib/receipt-generator'
import { useAppStore } from '@/stores/app-store'

// ── Types ──────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  sellPrice: number
  buyPrice: number
  stock: number
  minStock: number
  unit: string
  sku: string | null
  category: { id: string; name: string; icon: string | null; color: string | null } | null
  isFavorite: boolean
}

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
}

interface CartItem {
  productId: string
  name: string
  price: number
  buyPrice: number
  quantity: number
  unit: string
  sku: string | null
}

interface ShiftData {
  id: string
  openingCash: number
  openedAt: string
  totalSales: number
  totalTx: number
  cashier: { name: string }
  outlet: { name: string; code: string }
  cashSales: number
}

interface TxResult {
  transaction: { id: string; invoiceNo: string; createdAt: string; totalAmount: number }
  payment: { paymentMethod: string; paymentChannel: string | null }
  invoiceNo: string
  outletName: string
  outletAddress: string | null
  outletCity: string | null
  tenantName: string
  tenantAddress: string | null
  tenantCity: string | null
  tenantPhone: string | null
  cashierName: string
  items: CartItem[]
}

interface TxHistoryItem {
  id: string
  invoiceNo: string
  createdAt: string
  totalAmount: number
  paymentMethod: string
  paymentChannel: string | null
  status: string
  _count: { items: number }
}

// ── Helpers ──────────────────────────────────────────────────────────────

const formatRp = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const TAX_RATE = 0.11
const SERVICE_CHARGE_RATE = 0

const PAYMENT_METHODS = [
  { method: 'qris', channel: 'QRIS', label: 'QRIS', icon: QrCode, color: 'text-blue-600 dark:text-blue-400' },
  { method: 'e_wallet', channel: 'GoPay', label: 'GoPay', icon: Smartphone, color: 'text-blue-500 dark:text-blue-300' },
  { method: 'e_wallet', channel: 'OVO', label: 'OVO', icon: Smartphone, color: 'text-purple-600 dark:text-purple-400' },
  { method: 'e_wallet', channel: 'DANA', label: 'DANA', icon: Smartphone, color: 'text-sky-600 dark:text-sky-400' },
  { method: 'e_wallet', channel: 'ShopeePay', label: 'ShopeePay', icon: Smartphone, color: 'text-orange-600 dark:text-orange-400' },
  { method: 'bank_transfer', channel: 'Transfer Bank', label: 'Transfer Bank', icon: Building2, color: 'text-slate-600 dark:text-slate-400' },
  { method: 'credit_card', channel: 'Kartu Kredit', label: 'Kartu Kredit', icon: CreditCard, color: 'text-amber-600 dark:text-amber-400' },
  { method: 'cash', channel: 'Tunai', label: 'Tunai', icon: Banknote, color: 'text-emerald-600 dark:text-emerald-400' },
]

// ── Component ──────────────────────────────────────────────────────────

export function Kasir() {
  const user = useAppStore((s) => s.user)
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedPayment, setSelectedPayment] = useState<(typeof PAYMENT_METHODS)[number] | null>(null)
  const [tendered, setTendered] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastTx, setLastTx] = useState<TxResult | null>(null)
  const [showShiftDialog, setShowShiftDialog] = useState<'open' | 'close' | null>(null)
  const [shiftOpeningCash, setShiftOpeningCash] = useState('')
  const [shiftClosingCash, setShiftClosingCash] = useState('')
  const [shiftNote, setShiftNote] = useState('')
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos')
  const [historyFilter, setHistoryFilter] = useState<'shift' | 'today' | 'all'>('shift')
  const [showTxDetail, setShowTxDetail] = useState<TxHistoryItem | null>(null)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // ── Queries ──────────────────────────────────────────────────────

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['cashier-products', user?.tenantId, search, activeCategory],
    queryFn: async () => {
      const params = new URLSearchParams({ tenantId: user!.tenantId! })
      if (search) params.set('search', search)
      if (activeCategory) params.set('categoryId', activeCategory)
      const res = await fetch(`/api/cashier/products?${params}`)
      if (!res.ok) throw new Error('Gagal memuat produk')
      return res.json() as Promise<{ products: Product[]; categories: Category[] }>
    },
    enabled: !!user?.tenantId,
    refetchInterval: 30000,
  })

  const { data: shiftData, isLoading: shiftLoading } = useQuery({
    queryKey: ['cashier-shift', user?.outletId, user?.id],
    queryFn: async () => {
      const params = new URLSearchParams({
        outletId: user!.outletId!,
        cashierId: user!.id,
      })
      const res = await fetch(`/api/cashier/shifts?${params}`)
      if (!res.ok) throw new Error('Gagal memuat shift')
      return res.json() as Promise<{ shift: ShiftData | null }>
    },
    enabled: !!user?.outletId && !!user?.id,
  })

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['cashier-history', user?.id, historyFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        cashierId: user!.id,
        filter: historyFilter,
      })
      const res = await fetch(`/api/cashier/history?${params}`)
      if (!res.ok) throw new Error('Gagal memuat riwayat')
      return res.json() as Promise<{ transactions: TxHistoryItem[] }>
    },
    enabled: activeTab === 'history' && !!user?.id,
  })

  // ── Mutations ──────────────────────────────────────────────────

  const createTransaction = useMutation({
    mutationFn: async () => {
      if (!user || !shiftData?.shift || !selectedPayment) return null

      const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0)
      const discountAmount = 0
      const taxAmount = Math.round(subtotal * TAX_RATE)
      const serviceCharge = Math.round(subtotal * SERVICE_CHARGE_RATE)
      const totalAmount = subtotal - discountAmount + taxAmount + serviceCharge

      const res = await fetch('/api/cashier/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: user.tenantId,
          outletId: user.outletId,
          cashierId: user.id,
          items: cart.map((c) => ({
            productId: c.productId,
            name: c.name,
            price: c.price,
            buyPrice: c.buyPrice,
            quantity: c.quantity,
            unit: c.unit,
            sku: c.sku,
          })),
          subtotalAmount: subtotal,
          discountAmount,
          taxAmount,
          serviceCharge,
          totalAmount,
          paymentMethod: selectedPayment.method,
          paymentChannel: selectedPayment.channel,
          tendered: selectedPayment.method === 'cash' ? parseFloat(tendered) || 0 : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal membuat transaksi')
      }
      return res.json() as Promise<TxResult>
    },
    onSuccess: (data) => {
      if (data) {
        setLastTx(data)
        setShowSuccess(true)
        setCart([])
        setSelectedPayment(null)
        setTendered('')
        queryClient.invalidateQueries({ queryKey: ['cashier-products'] })
        queryClient.invalidateQueries({ queryKey: ['cashier-shift'] })
        queryClient.invalidateQueries({ queryKey: ['cashier-history'] })
      }
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const shiftMutation = useMutation({
    mutationFn: async (action: 'open' | 'close') => {
      if (!user) return null
      const body: Record<string, unknown> = {
        action,
        tenantId: user.tenantId,
        outletId: user.outletId,
        cashierId: user.id,
      }
      if (action === 'open') body.openingCash = parseFloat(shiftOpeningCash) || 0
      if (action === 'close') {
        body.closingCash = parseFloat(shiftClosingCash) || 0
        body.note = shiftNote
      }
      const res = await fetch('/api/cashier/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-shift'] })
      queryClient.invalidateQueries({ queryKey: ['cashier-history'] })
      setShowShiftDialog(null)
      setShiftOpeningCash('')
      setShiftClosingCash('')
      setShiftNote('')
      toast.success(
        shiftMutation.variables === 'open' ? 'Shift berhasil dibuka' : 'Shift berhasil ditutup',
      )
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  // ── Cart Logic ──────────────────────────────────────────────────

  const addToCart = useCallback(
    (product: Product) => {
      setCart((prev) => {
        const existing = prev.find((c) => c.productId === product.id)
        if (existing) {
          if (existing.quantity >= product.stock) {
            toast.warning(`Stok ${product.name} tidak cukup`)
            return prev
          }
          return prev.map((c) =>
            c.productId === product.id
              ? { ...c, quantity: c.quantity + 1 }
              : c,
          )
        }
        if (product.stock <= 0) {
          toast.warning(`${product.name} habis`)
          return prev
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: product.sellPrice,
            buyPrice: product.buyPrice,
            quantity: 1,
            unit: product.unit,
            sku: product.sku,
          },
        ]
      })
    },
    [],
  )

  const updateQty = useCallback((productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.productId !== productId) return c
          const newQty = c.quantity + delta
          if (newQty <= 0) return null
          return { ...c, quantity: newQty }
        })
        .filter(Boolean) as CartItem[]
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setSelectedPayment(null)
    setTendered('')
  }, [])

  // ── Computed ──────────────────────────────────────────────────

  const cartSubtotal = useMemo(() => cart.reduce((s, c) => s + c.price * c.quantity, 0), [cart])
  const cartTax = Math.round(cartSubtotal * TAX_RATE)
  const cartServiceCharge = Math.round(cartSubtotal * SERVICE_CHARGE_RATE)
  const cartTotal = cartSubtotal + cartTax + cartServiceCharge
  const cartItemCount = cart.reduce((s, c) => s + c.quantity, 0)
  const tenderedNum = parseFloat(tendered) || 0
  const change = tenderedNum - cartTotal

  const filteredProducts = useMemo(() => {
    const prods = productsData?.products || []
    if (!activeCategory) return prods
    return prods.filter((p) => p.category?.id === activeCategory)
  }, [productsData, activeCategory])

  const categories = productsData?.categories || []
  const activeShift = shiftData?.shift || null
  const isProcessing = createTransaction.isPending || shiftMutation.isPending

  // ── Keyboard shortcuts ──────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'F2') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setShowSuccess(false)
        setShowShiftDialog(null)
        setShowTxDetail(null)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  // ── Print Receipt ──────────────────────────────────────────

  const printReceipt = useCallback(() => {
    if (!lastTx) return
    const txSubtotal = lastTx.items.reduce((s, i) => s + i.price * i.quantity, 0)
    const txTax = Math.round(txSubtotal * TAX_RATE)
    const txServiceCharge = Math.round(txSubtotal * SERVICE_CHARGE_RATE)

    const html = generateReceiptHtml({
      invoiceNo: lastTx.invoiceNo,
      tenantName: lastTx.tenantName,
      outletName: lastTx.outletName,
      outletAddress: lastTx.outletAddress,
      outletCity: lastTx.outletCity,
      tenantPhone: lastTx.tenantPhone,
      cashierName: lastTx.cashierName,
      items: lastTx.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        subtotal: i.price * i.quantity,
      })),
      subtotalAmount: txSubtotal,
      discountAmount: 0,
      taxAmount: txTax,
      serviceCharge: txServiceCharge,
      totalAmount: lastTx.transaction.totalAmount,
      paymentMethod: lastTx.payment.paymentMethod,
      paymentChannel: lastTx.payment.paymentChannel,
      tendered: lastTx.payment.paymentMethod === 'cash' ? parseFloat(tendered) || 0 : undefined,
      change: lastTx.payment.paymentMethod === 'cash' ? change : undefined,
      createdAt: lastTx.transaction.createdAt,
    })

    const w = window.open('', '_blank', 'width=400,height=700')
    if (w) {
      w.document.write(html)
      w.document.close()
      setTimeout(() => w.print(), 300)
    }
  }, [lastTx, tendered, change, cart])


  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col gap-4 md:gap-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setActiveTab('pos')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-semibold transition-all btn-press',
            activeTab === 'pos'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Kasir POS
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-semibold transition-all btn-press',
            activeTab === 'history'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <span className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Riwayat
          </span>
        </button>
      </div>

      {activeTab === 'pos' ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          {/* ─── LEFT PANEL: Products ─── */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-[3]">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk... (F2)"
                className="pl-10"
              />
            </div>

            {/* Category Tabs */}
            <div className="relative">
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-1">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={cn(
                      'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all btn-press',
                      !activeCategory
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    Semua
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all btn-press',
                        activeCategory === cat.id
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      {cat.icon || ''} {cat.name}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Product Grid */}
            <div className="min-h-0 flex-1">
              {productsLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-28 w-full rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 pb-4">
                    <AnimatePresence mode="popLayout">
                      {filteredProducts.map((product) => {
                        const isOutOfStock = product.stock <= 0
                        const inCart = cart.find((c) => c.productId === product.id)
                        return (
                          <motion.button
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                            disabled={isOutOfStock}
                            onClick={() => addToCart(product)}
                            className={cn(
                              'glass-card relative flex flex-col items-center gap-1.5 rounded-xl p-3 text-left transition-all hover-scale hover-lift-surface',
                              isOutOfStock && 'opacity-50 grayscale',
                              inCart && 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-background',
                            )}
                          >
                            {inCart && (
                              <Badge className="badge-gradient-emerald absolute -top-2 -right-2 h-5 w-5 items-center justify-center rounded-full p-0 text-[10px] font-bold">
                                {inCart.quantity}
                              </Badge>
                            )}
                            <div
                              className={cn(
                                'flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold',
                                product.category?.color
                                  ? ''
                                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
                              )}
                              style={
                                product.category?.color
                                  ? { backgroundColor: product.category.color + '18', color: product.category.color }
                                  : undefined
                              }
                            >
                              {product.category?.icon || product.name.charAt(0)}
                            </div>
                            <p className="line-clamp-2 w-full text-xs font-medium leading-tight">
                              {product.name}
                            </p>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {formatRp(product.sellPrice)}
                            </p>
                            <p
                              className={cn(
                                'text-[10px] tabular-nums',
                                product.stock <= product.minStock * 0.5
                                  ? 'font-semibold text-red-500'
                                  : 'text-muted-foreground',
                              )}
                            >
                              Stok: {product.stock} {product.unit}
                            </p>
                            {isOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
                                <span className="rounded-full bg-destructive px-3 py-1 text-xs font-bold text-white">
                                  Habis
                                </span>
                              </div>
                            )}
                          </motion.button>
                        )
                      })}
                    </AnimatePresence>
                    {filteredProducts.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Package className="mb-3 h-12 w-12 opacity-30" />
                        <p className="text-sm">Tidak ada produk ditemukan</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          {/* ─── RIGHT PANEL: Cart ─── */}
          <div className="glass-card flex min-h-[400px] w-full flex-col rounded-2xl lg:min-h-0 lg:w-[420px] xl:w-[460px]">
            {/* Shift Status Bar */}
            <div className="p-3">
              {shiftLoading ? (
                <Skeleton className="h-10 w-full rounded-lg" />
              ) : !activeShift ? (
                <button
                  onClick={() => setShowShiftDialog('open')}
                  className="flex w-full items-center justify-between rounded-lg bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition-all hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950 btn-press"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Shift belum dibuka
                  </span>
                  <Badge className="badge-gradient-amber text-white">Buka Shift</Badge>
                </button>
              ) : (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-2.5 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
                    </div>
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      Shift Aktif
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {formatTime(activeShift.openedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatRp(activeShift.totalSales)}
                    </span>
                    <button
                      onClick={() => setShowShiftDialog('close')}
                      className="rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900 btn-press"
                    >
                      Tutup Shift
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Cart Header */}
            <div className="flex items-center justify-between px-4 py-2">
              <h3 className="text-sm font-semibold">
                Keranjang{' '}
                {cartItemCount > 0 && (
                  <span className="text-muted-foreground">({cartItemCount} item)</span>
                )}
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-muted-foreground hover:text-destructive btn-press"
                >
                  Hapus Semua
                </button>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-3">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-muted-foreground">
                  <ShoppingCart className="mb-2 h-10 w-10 opacity-20" />
                  <p className="text-sm">Keranjang kosong</p>
                  <p className="text-xs">Klik produk untuk menambahkan</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {cart.map((item) => (
                    <motion.div
                      key={item.productId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      className="mb-2 rounded-lg border border-border/50 bg-card/50 p-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatRp(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive btn-press"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQty(item.productId, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted btn-press"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.productId, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted btn-press"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatRp(item.price * item.quantity)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Cart Summary & Payment */}
            {cart.length > 0 && (
              <div className="border-t border-border bg-card/50 p-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatRp(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>PPN (11%)</span>
                    <span className="tabular-nums">{formatRp(cartTax)}</span>
                  </div>
                  {cartServiceCharge > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Service Charge</span>
                      <span className="tabular-nums">{formatRp(cartServiceCharge)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-bold">TOTAL</span>
                    <span className="text-lg font-extrabold text-gradient-emerald tabular-nums">
                      {formatRp(cartTotal)}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Metode Pembayaran</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PAYMENT_METHODS.map((pm) => {
                      const Icon = pm.icon
                      return (
                        <button
                          key={pm.label}
                          onClick={() => setSelectedPayment(pm)}
                          className={cn(
                            'flex flex-col items-center gap-0.5 rounded-lg border p-2 text-[10px] font-medium transition-all btn-press',
                            selectedPayment?.label === pm.label
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-950/50 dark:text-emerald-400'
                              : 'border-border hover:border-emerald-300 hover:bg-muted dark:hover:border-emerald-700',
                          )}
                        >
                          <Icon className={cn('h-4 w-4', pm.color)} />
                          {pm.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Cash Input */}
                {selectedPayment?.method === 'cash' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 space-y-2"
                  >
                    <div>
                      <Label className="text-xs text-muted-foreground">Uang Diterima</Label>
                      <Input
                        type="number"
                        value={tendered}
                        onChange={(e) => setTendered(e.target.value)}
                        placeholder="0"
                        className="mt-1 text-right text-lg font-bold tabular-nums"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                      <span className="text-xs font-medium text-muted-foreground">Kembalian</span>
                      <span
                        className={cn(
                          'text-sm font-bold tabular-nums',
                          change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
                        )}
                      >
                        {formatRp(Math.max(0, change))}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Pay Button */}
                <Button
                  onClick={() => createTransaction.mutate()}
                  disabled={
                    cart.length === 0 ||
                    !selectedPayment ||
                    !activeShift ||
                    isProcessing ||
                    (selectedPayment.method === 'cash' && tenderedNum < cartTotal)
                  }
                  className="btn-press mt-3 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 py-5 text-base font-bold text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="mr-2 h-4 w-4" />
                  )}
                  Bayar {formatRp(cartTotal)}
                </Button>
              </div>
            )}
          </div>

          {/* Mobile floating cart button */}
          {cart.length > 0 && (
            <button
              onClick={() => setShowMobileCart(true)}
              className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 lg:hidden"
            >
              <ShoppingCart className="h-6 w-6" />
              <Badge className="badge-gradient-emerald absolute -top-1 -right-1 h-5 min-w-5 items-center justify-center rounded-full p-0 text-[10px] font-bold">
                {cartItemCount}
              </Badge>
            </button>
          )}
        </div>
      ) : (
        /* ─── HISTORY TAB ─── */
        <div className="glass-card flex-1 rounded-2xl p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Riwayat Transaksi</h3>
            <div className="flex gap-1">
              {(['shift', 'today', 'all'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-all btn-press',
                    historyFilter === f
                      ? 'bg-emerald-500 text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {f === 'shift' ? 'Shift Ini' : f === 'today' ? 'Hari Ini' : 'Semua'}
                </button>
              ))}
            </div>
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : !historyData?.transactions.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <History className="mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm">Belum ada transaksi</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-2">
                {historyData.transactions.map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => setShowTxDetail(tx)}
                    className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-card/50 p-3 text-left transition-all hover-lift-surface btn-press"
                  >
                    <div>
                      <p className="text-sm font-semibold tabular-nums">{tx.invoiceNo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatRp(tx.totalAmount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {tx._count.items} item • {tx.paymentChannel || tx.paymentMethod}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* ─── SHIFT OPEN DIALOG ─── */}
      <Dialog open={showShiftDialog === 'open'} onOpenChange={() => setShowShiftDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-emerald-500" />
              Buka Shift
            </DialogTitle>
            <DialogDescription>Masukkan jumlah modal awal kas kasir</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Modal Awal (Rp)</Label>
              <Input
                type="number"
                value={shiftOpeningCash}
                onChange={(e) => setShiftOpeningCash(e.target.value)}
                placeholder="contoh: 500000"
                className="mt-1.5 text-right text-lg font-bold tabular-nums"
                autoFocus
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {[0, 100000, 200000, 500000, 1000000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setShiftOpeningCash(String(v))}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all btn-press',
                      shiftOpeningCash === String(v)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : 'border-border hover:border-emerald-300',
                    )}
                  >
                    {v === 0 ? 'Rp 0' : formatRp(v)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowShiftDialog(null)}>
              Batal
            </Button>
            <Button
              onClick={() => shiftMutation.mutate('open')}
              disabled={shiftMutation.isPending}
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              {shiftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buka Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── SHIFT CLOSE DIALOG ─── */}
      <Dialog open={showShiftDialog === 'close'} onOpenChange={() => setShowShiftDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-amber-500" />
              Tutup Shift
            </DialogTitle>
            <DialogDescription>Ringkasan shift dan penutupan kas</DialogDescription>
          </DialogHeader>
          {activeShift && (
            <div className="space-y-3 py-4">
              <div className="rounded-lg bg-muted p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modal Awal</span>
                  <span className="tabular-nums font-medium">{formatRp(activeShift.openingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Penjualan</span>
                  <span className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                    {formatRp(activeShift.totalSales)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Penjualan Tunai</span>
                  <span className="tabular-nums font-medium">{formatRp(activeShift.cashSales)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Uang yang Diharapkan</span>
                  <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatRp(activeShift.openingCash + activeShift.cashSales)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Transaksi</span>
                  <span className="tabular-nums">{activeShift.totalTx}</span>
                </div>
              </div>
              <div>
                <Label>Jumlah Kas Akhir (Rp)</Label>
                <Input
                  type="number"
                  value={shiftClosingCash}
                  onChange={(e) => setShiftClosingCash(e.target.value)}
                  placeholder="Hitung fisik uang di kas"
                  className="mt-1.5 text-right text-lg font-bold tabular-nums"
                  autoFocus
                />
              </div>
              {shiftClosingCash && (
                <div className={cn(
                  'rounded-lg p-3 text-center text-sm font-semibold',
                  parseFloat(shiftClosingCash) - (activeShift.openingCash + activeShift.cashSales) >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
                )}>
                  Selisih: {formatRp(parseFloat(shiftClosingCash) - (activeShift.openingCash + activeShift.cashSales))}
                </div>
              )}
              <div>
                <Label>Catatan (opsional)</Label>
                <Input
                  value={shiftNote}
                  onChange={(e) => setShiftNote(e.target.value)}
                  placeholder="Catatan penutupan shift..."
                  className="mt-1.5"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowShiftDialog(null)}>
              Batal
            </Button>
            <Button
              onClick={() => shiftMutation.mutate('close')}
              disabled={shiftMutation.isPending || !shiftClosingCash}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              {shiftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tutup Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── PAYMENT SUCCESS MODAL ─── */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6">
            {/* Success Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative mb-6"
            >
              <div className="pulse-ring absolute inset-0 rounded-full bg-emerald-400/30" />
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/40">
                <Check className="h-10 w-10 text-white" strokeWidth={3} />
              </div>
            </motion.div>

            <h2 className="mb-1 text-xl font-bold">Pembayaran Berhasil!</h2>
            {lastTx && (
              <>
                <p className="mb-4 text-sm text-muted-foreground">{lastTx.invoiceNo}</p>
                <div className="w-full space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatRp(lastTx.transaction.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Metode</span>
                    <span className="font-medium">
                      {lastTx.payment.paymentChannel || lastTx.payment.paymentMethod}
                    </span>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    {lastTx.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.quantity}× {item.name}</span>
                        <span className="tabular-nums">{formatRp(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex w-full gap-3">
                  <Button
                    onClick={printReceipt}
                    variant="outline"
                    className="flex-1 btn-press"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Struk
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSuccess(false)
                      setLastTx(null)
                    }}
                    className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 btn-press"
                  >
                    Transaksi Baru
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── TX DETAIL DIALOG ─── */}
      <Dialog open={!!showTxDetail} onOpenChange={() => setShowTxDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="tabular-nums">{showTxDetail?.invoiceNo}</DialogTitle>
            <DialogDescription>
              {showTxDetail &&
                new Date(showTxDetail.createdAt).toLocaleString('id-ID')}
            </DialogDescription>
          </DialogHeader>
          {showTxDetail && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatRp(showTxDetail.totalAmount)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Metode</p>
                  <p className="font-medium">{showTxDetail.paymentChannel || showTxDetail.paymentMethod}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Jumlah Item</p>
                  <p className="font-medium tabular-nums">{showTxDetail._count.items}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    className={cn(
                      showTxDetail.status === 'paid' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
                    )}
                  >
                    {showTxDetail.status === 'paid' ? 'Lunas' : showTxDetail.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
