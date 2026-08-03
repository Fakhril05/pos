'use client'

import { useAppStore, type Page } from '@/stores/app-store'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Link2,
  BarChart3,
  MoreHorizontal,
  Users,
  Store,
  Banknote,
  Settings,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

const primaryNavItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'transactions', label: 'Transaksi', icon: <ArrowLeftRight className="h-5 w-5" /> },
  { id: 'payment-links', label: 'Payment Link', icon: <Link2 className="h-5 w-5" /> },
  { id: 'reports', label: 'Laporan', icon: <BarChart3 className="h-5 w-5" /> },
]

const moreNavItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'customers', label: 'Pelanggan', icon: <Users className="h-5 w-5" /> },
  { id: 'merchants', label: 'Merchant', icon: <Store className="h-5 w-5" /> },
  { id: 'payouts', label: 'Payout', icon: <Banknote className="h-5 w-5" /> },
  { id: 'settings', label: 'Pengaturan', icon: <Settings className="h-5 w-5" /> },
]

export function MobileNav() {
  const { activePage, setActivePage } = useAppStore()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <nav className="mobile-nav pb-safe fixed right-0 bottom-0 left-0 z-50 flex border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
        <div className="flex w-full items-center justify-around">
          {primaryNavItems.map((item) => {
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className="mobile-nav-item relative flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileNavIndicator"
                    className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-emerald-500"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span
                  className={isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground'
                  }
                >
                  {item.icon}
                </span>
                <span
                  className={`text-[10px] font-medium leading-tight ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className="mobile-nav-item relative flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-muted-foreground"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-tight">Lainnya</span>
          </button>
        </div>
      </nav>

      {/* More Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Menu Lainnya</SheetTitle>
            <SheetDescription>Pilih halaman yang ingin ditampilkan</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-4 pb-6">
            {moreNavItems.map((item, i) => {
              const isActive = activePage === item.id
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    setActivePage(item.id)
                    setMoreOpen(false)
                  }}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    isActive
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-border hover:border-emerald-500/20 hover:bg-accent'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      isActive
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </motion.button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
