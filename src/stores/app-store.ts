import { create } from 'zustand'

type Page = 'dashboard' | 'transactions' | 'payment-links' | 'customers' | 'merchants' | 'payouts' | 'reports' | 'settings'

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
