'use client'

import { cn } from '@/lib/utils'
import { useAppStore, type Page } from '@/stores/app-store'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Link2,
  Users,
  Store,
  Calculator,
  Banknote,
  BarChart3,
  Settings,
  ChevronLeft,
  Zap,
  SettingsIcon,
  Building2,
  CreditCard,
  Package,
  ClipboardList,
  UserCog,
  MapPin,
  FileText,
  History,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'

interface NavItemDef {
  id: Page
  label: string
  icon: React.ReactNode
  badge?: number
}

const superAdminNav: NavItemDef[] = [
  { id: 'super-admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'tenant-detail', label: 'Tenant', icon: <Building2 className="h-5 w-5" /> },
  { id: 'subscription-plans', label: 'Paket Langganan', icon: <CreditCard className="h-5 w-5" /> },
]

const ownerNav: NavItemDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'transactions', label: 'Transaksi', icon: <ArrowLeftRight className="h-5 w-5" /> },
  { id: 'produk', label: 'Produk', icon: <Package className="h-5 w-5" /> },
  { id: 'stok', label: 'Stok', icon: <ClipboardList className="h-5 w-5" /> },
  { id: 'karyawan', label: 'Karyawan', icon: <UserCog className="h-5 w-5" /> },
  { id: 'outlet', label: 'Outlet', icon: <MapPin className="h-5 w-5" /> },
  { id: 'reports', label: 'Laporan', icon: <BarChart3 className="h-5 w-5" /> },
]

const managerNav: NavItemDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'stok-opname', label: 'Stok & Opname', icon: <ClipboardList className="h-5 w-5" /> },
  { id: 'laporan-penjualan', label: 'Laporan Penjualan', icon: <BarChart3 className="h-5 w-5" /> },
]

const cashierNav: NavItemDef[] = [
  { id: 'kasir', label: 'Kasir', icon: <Calculator className="h-5 w-5" /> },
  { id: 'riwayat-transaksi', label: 'Riwayat Transaksi', icon: <History className="h-5 w-5" /> },
]

const otherNavItems: NavItemDef[] = [
  { id: 'settings', label: 'Pengaturan', icon: <Settings className="h-5 w-5" /> },
]

function getNavItems(role: string): NavItemDef[] {
  switch (role) {
    case 'super_admin': return superAdminNav
    case 'business_owner': return ownerNav
    case 'manager': return managerNav
    case 'cashier': return cashierNav
    default: return ownerNav
  }
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    super_admin: 'Super Admin',
    business_owner: 'Pemilik Bisnis',
    manager: 'Manager',
    cashier: 'Kasir',
  }
  return map[role] || role
}

function getRoleBadgeColor(role: string): string {
  const map: Record<string, string> = {
    super_admin: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    business_owner: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    manager: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    cashier: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  }
  return map[role] || ''
}

function NavItem({ item, sidebarOpen, activePage, setActivePage }: {
  item: NavItemDef
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
  const { user, activePage, setActivePage, sidebarOpen, toggleSidebar, logout } = useAppStore()

  const navItems = getNavItems(user?.role || 'business_owner')
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

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
                {user?.role === 'super_admin' ? 'Platform Admin' : 'SaaS POS'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-1 px-3 overflow-y-auto">
        {/* Section label */}
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

        {navItems.map((item) => (
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
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 px-3 mb-1 mt-4">
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
        <div className="flex w-full items-center gap-3 rounded-lg p-2">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-emerald text-xs font-bold text-white">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
            </span>
          </div>

          <AnimatePresence>
            {sidebarOpen && user && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-1 flex-col items-start text-left"
                >
                  <span className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0 text-[10px] font-medium', getRoleBadgeColor(user.role))}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </motion.div>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => { e.stopPropagation(); logout() }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  title="Keluar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                </motion.button>
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
