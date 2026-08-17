import { create } from 'zustand'

export type Page =
  | 'dashboard'
  | 'transactions'
  | 'payment-links'
  | 'customers'
  | 'merchants'
  | 'kasir'
  | 'payouts'
  | 'reports'
  | 'settings'
  | 'super-admin'
  | 'tenant-detail'
  | 'subscription-plans'
  | 'produk'
  | 'stok'
  | 'karyawan'
  | 'outlet'
  | 'riwayat-transaksi'
  | 'stok-opname'
  | 'laporan-penjualan'

export interface AppUser {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'business_owner' | 'manager' | 'cashier'
  tenantId: string | null
  outletId: string | null
  tenantName: string | null
  outletName: string | null
}

interface AppState {
  activePage: Page
  sidebarOpen: boolean
  pendingTxId: string | null
  user: AppUser | null
  currentPage: 'login' | 'dashboard'
  setActivePage: (page: Page) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setPendingTxId: (id: string | null) => void
  login: (user: AppUser) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'dashboard',
  sidebarOpen: true,
  pendingTxId: null,
  user: null,
  currentPage: 'login',
  setActivePage: (page) => set({ activePage: page, pendingTxId: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setPendingTxId: (id) => set({ pendingTxId: id }),
  login: (user) => set({ user, currentPage: 'dashboard', activePage: user.role === 'super_admin' ? 'super-admin' : user.role === 'cashier' ? 'kasir' : 'dashboard' }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('posril_user')
    }
    set({ user: null, currentPage: 'login', activePage: 'dashboard' })
  },
}))
