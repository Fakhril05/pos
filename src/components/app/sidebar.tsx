'use client'

import { cn } from '@/lib/utils'
import { useAppStore, type Page } from '@/stores/app-store'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Link2,
  Users,
  Store,
  Banknote,
  BarChart3,
  Settings,
  ChevronLeft,
  Zap,
  SettingsIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'

const mainNavItems: { id: Page; label: string; icon: React.ReactNode; badge?: number }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'transactions', label: 'Transaksi', icon: <ArrowLeftRight className="h-5 w-5" /> },
  { id: 'payment-links', label: 'Payment Link', icon: <Link2 className="h-5 w-5" /> },
  { id: 'customers', label: 'Pelanggan', icon: <Users className="h-5 w-5" /> },
  { id: 'merchants', label: 'Merchant', icon: <Store className="h-5 w-5" /> },
  { id: 'payouts', label: 'Payout', icon: <Banknote className="h-5 w-5" /> },
  { id: 'reports', label: 'Laporan', icon: <BarChart3 className="h-5 w-5" /> },
]

const otherNavItems: { id: Page; label: string; icon: React.ReactNode; badge?: number }[] = [
  { id: 'settings', label: 'Pengaturan', icon: <Settings className="h-5 w-5" /> },
]

function NavItem({ item, sidebarOpen, activePage, setActivePage }: {
  item: { id: Page; label: string; icon: React.ReactNode; badge?: number }
  sidebarOpen: boolean
  activePage: Page
  setActivePage: (page: Page) => void
}) {
  const isActive = activePage === item.id
  const btn = (
    <button
      key={item.id}
      onClick={() => setActivePage(item.id)}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
        isActive
          ? 'text-sidebar-primary'
          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
      )}
    >
      {isActive && (
        <>
          <motion.div
            layoutId="activeNavBg"
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent"
            transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
          />
          <motion.div
            layoutId="activeNavBar"
            className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-emerald-500"
            transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
          />
        </>
      )}
      <span className={cn('relative z-10 shrink-0', isActive && 'text-emerald-500')}>
        {item.icon}
      </span>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {item.badge && sidebarOpen && (
        <span className="relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
          {item.badge}
        </span>
      )}
    </button>
  )

  if (!sidebarOpen) {
    return (
      <Tooltip key={item.id} delayDuration={0}>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }
  return btn
}

export function Sidebar() {
  const { activePage, setActivePage, sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar md:flex"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-emerald">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
                Pos Ril
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
                Payment Gateway
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-1 px-3 overflow-y-auto">
        {/* Section label: MENU UTAMA */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 px-3 mb-1">
                Menu Utama
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {mainNavItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            sidebarOpen={sidebarOpen}
            activePage={activePage}
            setActivePage={setActivePage}
          />
        ))}

        {/* Section label: LAINNYA */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 px-3 mb-1">
                Lainnya
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {otherNavItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            sidebarOpen={sidebarOpen}
            activePage={activePage}
            setActivePage={setActivePage}
          />
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-sidebar-border p-3">
        <div
          onClick={() => setActivePage('settings')}
          className={cn(
            'flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors duration-200',
            'hover:bg-sidebar-accent'
          )}
        >
          {/* Avatar with online indicator */}
          <div className="relative shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-emerald text-xs font-bold text-white">
              AR
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
            </span>
          </div>

          {/* Name, role, and settings - only when expanded */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-1 flex-col items-start text-left"
                >
                  <span className="text-sm font-medium text-sidebar-foreground">
                    Admin Ril
                  </span>
                  <span className="text-[10px] text-sidebar-foreground/50">
                    Super Admin
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/40"
                >
                  <SettingsIcon className="h-3.5 w-3.5" />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse button */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform duration-300',
              !sidebarOpen && 'rotate-180'
            )}
          />
        </Button>
      </div>
    </motion.aside>
  )
}