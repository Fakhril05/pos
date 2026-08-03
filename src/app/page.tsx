'use client'

import { useAppStore } from '@/stores/app-store'
import { Sidebar } from '@/components/app/sidebar'
import { Header } from '@/components/app/header'
import { MobileNav } from '@/components/app/mobile-nav'
import { LoadingBar } from '@/components/app/loading-bar'
import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'

const Dashboard = dynamic(() => import('@/components/app/dashboard'), { ssr: false })
const Transactions = dynamic(() => import('@/components/app/transactions'), { ssr: false })
const PaymentLinks = dynamic(() => import('@/components/app/payment-links'), { ssr: false })
const Customers = dynamic(() => import('@/components/app/customers'), { ssr: false })
const Merchants = dynamic(() => import('@/components/app/merchants'), { ssr: false })
const Payouts = dynamic(() => import('@/components/app/payouts'), { ssr: false })
const Reports = dynamic(() => import('@/components/app/reports'), { ssr: false })
const Settings = dynamic(() => import('@/components/app/settings'), { ssr: false })

const pageComponents: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  transactions: Transactions,
  'payment-links': PaymentLinks,
  customers: Customers,
  merchants: Merchants,
  payouts: Payouts,
  reports: Reports,
  settings: Settings,
}

export default function Home() {
  const { activePage, sidebarOpen } = useAppStore()

  const ActiveComponent = pageComponents[activePage]

  return (
    <div className="min-h-screen bg-background">
      <LoadingBar />
      <Sidebar />
      <Header />
      <motion.main
        initial={false}
        animate={{ paddingLeft: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex min-h-[calc(100vh-4rem)] flex-col pt-16 pb-20 md:pb-0"
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
    </div>
  )
}
