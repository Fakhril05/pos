import { create } from 'zustand'

export type Page = 'dashboard' | 'transactions' | 'payment-links' | 'customers' | 'merchants' | 'kasir' | 'payouts' | 'reports' | 'settings'

interface AppState {
  activePage: Page
  sidebarOpen: boolean
  pendingTxId: string | null
  setActivePage: (page: Page) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setPendingTxId: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'dashboard',
  sidebarOpen: true,
  pendingTxId: null,
  setActivePage: (page) => set({ activePage: page, pendingTxId: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setPendingTxId: (id) => set({ pendingTxId: id }),
}))
