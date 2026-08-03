'use client'

import { useAppStore } from '@/stores/app-store'
import { Bell, Search, Moon, Sun, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  transactions: 'Transaksi',
  'payment-links': 'Payment Link',
  customers: 'Pelanggan',
  merchants: 'Merchant',
  payouts: 'Payout',
  reports: 'Laporan',
  settings: 'Pengaturan',
}

export function Header() {
  const { activePage, toggleSidebar, sidebarOpen } = useAppStore()
  const { theme, setTheme } = useTheme()

  return (
    <motion.header
      initial={false}
      animate={{ paddingLeft: sidebarOpen ? 260 : 72 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{pageTitles[activePage]}</h1>
          <p className="text-xs text-muted-foreground">
            {activePage === 'dashboard' && 'Ringkasan aktivitas pembayaran Anda'}
            {activePage === 'transactions' && 'Kelola semua transaksi pembayaran'}
            {activePage === 'payment-links' && 'Buat dan kelola link pembayaran'}
            {activePage === 'customers' && 'Data pelanggan Anda'}
            {activePage === 'merchants' && 'Kelola merchant terdaftar'}
            {activePage === 'payouts' && 'Kelola pencairan dana'}
            {activePage === 'reports' && 'Analisis dan laporan keuangan'}
            {activePage === 'settings' && 'Konfigurasi akun dan aplikasi'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari transaksi, merchant..."
            className="w-64 pl-9"
          />
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifikasi
              <Badge variant="secondary" className="text-xs">3 baru</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="text-sm font-medium">Pembayaran berhasil</span>
              <span className="text-xs text-muted-foreground">Rp 2.500.000 dari Toko Makmur</span>
              <span className="text-[10px] text-muted-foreground">2 menit lalu</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="text-sm font-medium">Refund diproses</span>
              <span className="text-xs text-muted-foreground">Rp 150.000 untuk INV-2024015</span>
              <span className="text-[10px] text-muted-foreground">15 menit lalu</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="text-sm font-medium">Payout berhasil</span>
              <span className="text-xs text-muted-foreground">Rp 15.000.000 ke BCA</span>
              <span className="text-[10px] text-muted-foreground">1 jam lalu</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" alt="Admin" />
                <AvatarFallback className="gradient-emerald text-sm font-bold text-white">
                  AR
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Admin Ril</p>
                <p className="text-xs text-muted-foreground">admin@posril.id</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Pengaturan</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}
