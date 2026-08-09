'use client'

import { useAppStore } from '@/stores/app-store'
import { Bell, Search, Moon, Sun, Menu, CheckCircle, AlertTriangle, Info, CheckCheck, ArrowRight, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '@/hooks/use-mobile'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CommandPalette } from '@/components/app/command-palette'
import { toast } from 'sonner'

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  transactions: 'Transaksi',
  'payment-links': 'Payment Link',
  customers: 'Pelanggan',
  merchants: 'Merchant',
  payouts: 'Payout',
  reports: 'Laporan',
  settings: 'Pengaturan',
  'super-admin': 'Dashboard Super Admin',
  'tenant-detail': 'Tenant',
  'subscription-plans': 'Paket Langganan',
  produk: 'Produk',
  stok: 'Stok & Inventaris',
  'stok-opname': 'Stok & Opname',
  karyawan: 'Karyawan',
  outlet: 'Outlet',
  'laporan-penjualan': 'Laporan Penjualan',
  'riwayat-transaksi': 'Riwayat Transaksi',
  kasir: 'Kasir POS',
}

const pageDescriptions: Record<string, string> = {
  dashboard: 'Ringkasan aktivitas bisnis Anda',
  transactions: 'Kelola semua transaksi pembayaran',
  'payment-links': 'Buat dan kelola link pembayaran',
  customers: 'Data pelanggan Anda',
  merchants: 'Kelola merchant terdaftar',
  payouts: 'Kelola pencairan dana',
  reports: 'Analisis dan laporan keuangan',
  settings: 'Konfigurasi akun dan aplikasi',
  'super-admin': 'Kelola platform dan tenant',
  'tenant-detail': 'Detail dan kelola tenant',
  'subscription-plans': 'Paket langganan tersedia',
  produk: 'Kelola produk dan katalog',
  stok: 'Pantau dan kelola stok produk',
  'stok-opname': 'Pantau dan kelola stok produk',
  karyawan: 'Kelola karyawan dan akses',
  outlet: 'Kelola outlet bisnis',
  'laporan-penjualan': 'Analisis penjualan bisnis',
  'riwayat-transaksi': 'Riwayat transaksi',
  kasir: 'Terminal Point of Sale',
}

type NotificationType = {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

interface SearchResult {
  id: string
  invoiceNo: string
  customerName: string | null
  amount: number
  status: string
  paymentChannel: string
  merchantName?: string
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`
  if (diffHr < 24) return `${diffHr} jam lalu`
  if (diffDay < 7) return `${diffDay} hari lalu`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

const formatRp = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-500" />
  }
}

const statusLabel: Record<string, string> = {
  success: 'Berhasil',
  pending: 'Menunggu',
  failed: 'Gagal',
  expired: 'Kedaluwarsa',
  refunded: 'Refund',
}

const statusColor: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  expired: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
  refunded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

export function Header() {
  const { user, activePage, toggleSidebar, sidebarOpen, setActivePage, setPendingTxId } = useAppStore()
  const { theme, setTheme } = useTheme()
  const isMobile = useIsMobile()
  const [commandOpen, setCommandOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const queryClient = useQueryClient()

  // Global search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(searchQuery, 350)

  const { data: notifData } = useQuery<{ count: number; notifications: NotificationType[] }>({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
    refetchInterval: 30000,
  })

  // Debounced search fetch
  const { data: searchResults, isLoading: searchLoading } = useQuery<{
    data: SearchResult[]
  }>({
    queryKey: ['header-search', debouncedQuery],
    queryFn: () =>
      fetch(`/api/transactions?search=${encodeURIComponent(debouncedQuery)}&limit=5`).then(
        (r) => r.json(),
      ),
    enabled: debouncedQuery.length >= 3,
    staleTime: 5000,
  })

  const searchItems = searchResults?.data ?? []
  const showSearchDropdown = searchOpen && searchQuery.length >= 3

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSelect = useCallback(
    (tx: SearchResult) => {
      setSearchOpen(false)
      setSearchQuery('')
      setPendingTxId(tx.id)
      setActivePage('transactions')
    },
    [setActivePage, setPendingTxId],
  )

  const unreadCount = notifData?.count ?? 0
  const notifications = notifData?.notifications ?? []

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' })
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        toast.success('Semua notifikasi ditandai sudah dibaca')
      }
    } catch {
      toast.error('Gagal menandai notifikasi')
    }
  }

  return (
    <motion.header
      initial={false}
      animate={{ paddingLeft: isMobile ? 0 : sidebarOpen ? 260 : 72 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6 glass-card neon-glow"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{pageTitles[activePage]}</h1>
          <p className="text-xs text-muted-foreground">
            {pageDescriptions[activePage]}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search — transaction quick search */}
        <div className="relative hidden lg:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari transaksi, invoice, pelanggan..."
            className="w-72 pl-9 pr-8 shadow-inner-soft hover-glow-border"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
          />
          {searchQuery.length > 0 && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSearchOpen(false)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Search Dropdown */}
          <AnimatePresence>
            {showSearchDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                className="backdrop-blur-card absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl shadow-xl"
              >
                <div className="border-b border-border px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Hasil Pencarian
                  </p>
                </div>

                {searchLoading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                    <span className="text-sm text-muted-foreground">Mencari...</span>
                  </div>
                ) : searchItems.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
                    <Search className="h-6 w-6 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      Tidak ada transaksi ditemukan
                    </p>
                    <p className="text-[11px] text-muted-foreground/60">
                      Coba kata kunci lain
                    </p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto scrollbar-thin">
                    {searchItems.map((tx) => (
                      <button
                        key={tx.id}
                        onClick={() => handleSearchSelect(tx)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-emerald-500/5"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                          <Search className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">
                              {tx.invoiceNo}
                            </span>
                            <span
                              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${statusColor[tx.status] ?? 'bg-muted text-muted-foreground'}`}
                            >
                              {statusLabel[tx.status] ?? tx.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="truncate">
                              {tx.customerName || tx.merchantName || 'Umum'}
                            </span>
                            <span>·</span>
                            <span>{formatRp(tx.amount)}</span>
                            <span>·</span>
                            <span>{timeAgo(tx.createdAt)}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-border px-3 py-2">
                  <button
                    onClick={() => {
                      setSearchOpen(false)
                      setSearchQuery('')
                      setActivePage('transactions')
                    }}
                    className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    Lihat semua transaksi
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-4 w-4" />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="badge-bounce absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 smooth-corners">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Notifikasi</span>
              </div>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {unreadCount} baru
                </Badge>
              )}
            </div>
            <DropdownMenuSeparator />

            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 opacity-30" />
                  <span className="text-sm">Belum ada notifikasi</span>
                </div>
              ) : (
                notifications.slice(0, 10).map((notif, i) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                  >
                    <DropdownMenuItem
                      className={`flex items-start gap-3 py-3 px-4 transition-colors ${
                        !notif.read
                          ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                          : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        <NotificationIcon type={notif.type} />
                      </div>
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <span className="animate-pulse-subtle shrink-0 h-2 w-2 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {notif.message}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </motion.div>
                ))
              )}
            </div>

            {unreadCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    onClick={(e) => {
                      e.preventDefault()
                      handleMarkAllRead()
                      setNotifOpen(false)
                    }}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Tandai semua dibaca
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" alt={user?.name ?? 'User'} />
                <AvatarFallback className="gradient-emerald text-sm font-bold text-white">
                  {user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name ?? 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email ?? ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setActivePage('settings')}>Profil</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActivePage('settings')}>Pengaturan</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => useAppStore.getState().logout()}>Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </motion.header>
  )
}
