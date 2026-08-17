'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Sidebar } from '@/components/app/sidebar'
import { Header } from '@/components/app/header'
import { MobileNav } from '@/components/app/mobile-nav'
import { QuickStats } from '@/components/app/quick-stats'
import { LoadingBar } from '@/components/app/loading-bar'
import { KeyboardShortcutsOverlay } from '@/components/app/keyboard-shortcuts'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useIsMobile } from '@/hooks/use-mobile'
import dynamic from 'next/dynamic'

const LoginPage = dynamic(() => import('@/components/app/login-page').then(m => ({ default: m.LoginPage })), { ssr: false })
const SuperAdmin = dynamic(() => import('@/components/app/super-admin').then(m => ({ default: m.SuperAdmin })), { ssr: false })
const OwnerDashboard = dynamic(() => import('@/components/app/owner-dashboard').then(m => ({ default: m.OwnerDashboard })), { ssr: false })
const Transactions = dynamic(() => import('@/components/app/transactions'), { ssr: false })
const PaymentLinks = dynamic(() => import('@/components/app/payment-links'), { ssr: false })
const Customers = dynamic(() => import('@/components/app/customers'), { ssr: false })
const Merchants = dynamic(() => import('@/components/app/merchants'), { ssr: false })
const Payouts = dynamic(() => import('@/components/app/payouts'), { ssr: false })
const Reports = dynamic(() => import('@/components/app/reports'), { ssr: false })
const Settings = dynamic(() => import('@/components/app/settings'), { ssr: false })
const Kasir = dynamic(() => import('@/components/app/kasir').then(m => ({ default: m.Kasir })), { ssr: false })
const Products = dynamic(() => import('@/components/app/products').then(m => ({ default: m.Products })), { ssr: false })
const Stock = dynamic(() => import('@/components/app/stock').then(m => ({ default: m.Stock })), { ssr: false })
const Employees = dynamic(() => import('@/components/app/employees').then(m => ({ default: m.Employees })), { ssr: false })
const Outlets = dynamic(() => import('@/components/app/outlets').then(m => ({ default: m.Outlets })), { ssr: false })

const pageComponents: Record<string, React.ComponentType> = {
  dashboard: OwnerDashboard,
  transactions: Transactions,
  'payment-links': PaymentLinks,
  customers: Customers,
  merchants: Merchants,
  kasir: Kasir,
  payouts: Payouts,
  reports: Reports,
  settings: Settings,
  'super-admin': SuperAdmin,
  'tenant-detail': SuperAdmin,
  'subscription-plans': SuperAdmin,
  produk: Products,
  stok: Stock,
  'stok-opname': Stock,
  karyawan: Employees,
  outlet: Outlets,
  'laporan-penjualan': Reports,
  'riwayat-transaksi': Transactions,
}

const PAGE_KEYS: Record<string, string> = {
  '1': 'dashboard',
  '2': 'transactions',
  '3': 'payment-links',
  '4': 'customers',
  '5': 'merchants',
  '6': 'payouts',
  '7': 'reports',
  '8': 'settings',
  '9': 'kasir',
  'k': 'kasir',
}

export default function Home() {
  const { user, currentPage, activePage, sidebarOpen, setActivePage, login } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const isMobile = useIsMobile()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  // Restore user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('posril_user')
    if (stored) {
      try {
        const userData = JSON.parse(stored)
        login(userData)
      } catch {
        localStorage.removeItem('posril_user')
      }
    }
  }, [])

  const ActiveComponent = pageComponents[activePage]

  useEffect(() => {
    if (currentPage === 'login') return
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.ctrlKey || e.altKey || e.metaKey) return

      const key = e.key

      if (PAGE_KEYS[key]) {
        e.preventDefault()
        setActivePage(PAGE_KEYS[key] as Parameters<typeof setActivePage>[0])
        return
      }

      if (key === 'd' || key === 'D') {
        e.preventDefault()
        setTheme(theme === 'dark' ? 'light' : 'dark')
        return
      }

      if (key === 'k' || key === 'K') {
        e.preventDefault()
        setActivePage('kasir')
        return
      }

      if (key === 'n' || key === 'N') {
        e.preventDefault()
        setActivePage('payment-links')
        return
      }

      if (key === 't' || key === 'T') {
        e.preventDefault()
        setActivePage('transactions')
        return
      }

      if (key === '?') {
        e.preventDefault()
        setShortcutsOpen((prev) => !prev)
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setActivePage, theme, setTheme, currentPage])

  // Show nothing until client-side mount to avoid hydration issues
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  // Show login page if not authenticated
  if (currentPage === 'login') {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-background">
      <LoadingBar />
      <Sidebar />
      <Header />
      <motion.div
        initial={false}
        animate={{ paddingLeft: isMobile ? 0 : sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <QuickStats />
      </motion.div>
      <motion.main
        initial={false}
        animate={{ paddingLeft: isMobile ? 0 : sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex min-h-[calc(100vh-5.5rem)] flex-col pt-[4.75rem] pb-20 md:pb-0"
      >
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {ActiveComponent ? <ActiveComponent /> : null}
            </motion.div>
          </AnimatePresence>
        </div>
        <footer className="mt-auto border-t border-border py-4 px-4 md:px-6 lg:px-8 inset-shadow">
          <div className="flex flex-col items-center justify-between gap-1 sm:flex-row">
            <span className="text-xs text-muted-foreground">
              © 2026 Pos Ril. Semua hak dilindungi.
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="text-gradient-emerald">v2.1.0</span> · Dibuat dengan <span className="animate-breathe">❤️</span> di Indonesia
            </span>
          </div>
        </footer>
      </motion.main>
      <MobileNav />
      <KeyboardShortcutsOverlay open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  )
}
