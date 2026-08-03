import { create } from 'zustand'

export type Page = 'dashboard' | 'transactions' | 'payment-links' | 'customers' | 'merchants' | 'kasir' | 'payouts' | 'reports' | 'settings'

interface AppState {
  activePage: Page
  sidebarOpen: boolean
  setActivePage: (page: Page) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'dashboard',
  sidebarOpen: true,
  setActivePage: (page) => set({ activePage: page }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
