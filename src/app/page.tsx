'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Sidebar } from '@/components/app/sidebar'
import { Header } from '@/components/app/header'
import { MobileNav } from '@/components/app/mobile-nav'
import { QuickStats } from '@/components/app/quick-stats'
import { LoadingBar } from '@/components/app/loading-bar'
import { KeyboardShortcutsOverlay } from '@/components/app/keyboard-shortcuts'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'

const Dashboard = dynamic(() => import('@/components/app/dashboard'), { ssr: false })
const Transactions = dynamic(() => import('@/components/app/transactions'), { ssr: false })
const PaymentLinks = dynamic(() => import('@/components/app/payment-links'), { ssr: false })
const Customers = dynamic(() => import('@/components/app/customers'), { ssr: false })
const Merchants = dynamic(() => import('@/components/app/merchants'), { ssr: false })
const Payouts = dynamic(() => import('@/components/app/payouts'), { ssr: false })
const Reports = dynamic(() => import('@/components/app/reports'), { ssr: false })
const Settings = dynamic(() => import('@/components/app/settings'), { ssr: false })
const Kasir = dynamic(() => import('@/components/app/kasir').then(m => ({ default: m.Kasir })), { ssr: false })

const pageComponents: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  transactions: Transactions,
  'payment-links': PaymentLinks,
  customers: Customers,
  merchants: Merchants,
  kasir: Kasir,
  payouts: Payouts,
  reports: Reports,
  settings: Settings,
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
  const { activePage, sidebarOpen, setActivePage } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const ActiveComponent = pageComponents[activePage]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      // Don't capture if modifier keys are held (except for Cmd+K)
      if (e.ctrlKey || e.altKey || e.metaKey) return

      const key = e.key

      // Number keys 1-8 for page navigation
      if (PAGE_KEYS[key]) {
        e.preventDefault()
        setActivePage(PAGE_KEYS[key] as Parameters<typeof setActivePage>[0])
        return
      }

      // D - toggle theme
      if (key === 'd' || key === 'D') {
        e.preventDefault()
        setTheme(theme === 'dark' ? 'light' : 'dark')
        return
      }

      // K - go to kasir
      if (key === 'k' || key === 'K') {
        e.preventDefault()
        setActivePage('kasir')
        return
      }

      // N - go to payment links
      if (key === 'n' || key === 'N') {
        e.preventDefault()
        setActivePage('payment-links')
        return
      }

      // T - go to transactions
      if (key === 't' || key === 'T') {
        e.preventDefault()
        setActivePage('transactions')
        return
      }

      // ? - toggle shortcuts overlay
      if (key === '?') {
        e.preventDefault()
        setShortcutsOpen((prev) => !prev)
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setActivePage, theme, setTheme])

  return (
    <div className="min-h-screen bg-background">
      <LoadingBar />
      <Sidebar />
      <Header />
      <motion.div
        initial={false}
        animate={{ paddingLeft: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <QuickStats />
      </motion.div>
      <motion.main
        initial={false}
        animate={{ paddingLeft: sidebarOpen ? 260 : 72 }}
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
        <footer className="mt-auto border-t border-border py-4 px-4 md:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-1 sm:flex-row">
            <span className="text-xs text-muted-foreground">
              © 2026 Pos Ril. Semua hak dilindungi.
            </span>
            <span className="text-xs text-muted-foreground">
              v2.0.0 · Dibuat dengan ❤️ di Indonesia
            </span>
          </div>
        </footer>
      </motion.main>
      <MobileNav />
      <KeyboardShortcutsOverlay open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  )
}
