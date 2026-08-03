'use client'

import { useAppStore } from '@/stores/app-store'
import { Bell, Search, Moon, Sun, Menu, CheckCircle, AlertTriangle, Info, CheckCheck } from 'lucide-react'
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
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CommandPalette } from '@/components/app/command-palette'
import { toast } from 'sonner'

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

const pageDescriptions: Record<string, string> = {
  dashboard: 'Ringkasan aktivitas pembayaran Anda',
  transactions: 'Kelola semua transaksi pembayaran',
  'payment-links': 'Buat dan kelola link pembayaran',
  customers: 'Data pelanggan Anda',
  merchants: 'Kelola merchant terdaftar',
  payouts: 'Kelola pencairan dana',
  reports: 'Analisis dan laporan keuangan',
  settings: 'Konfigurasi akun dan aplikasi',
}

type NotificationType = {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`
  if (diffHr < 24) return `${diffHr} jam lalu`
  if (diffDay < 7) return `${diffDay} hari lalu`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-500" />
  }
}

export function Header() {
  const { activePage, toggleSidebar, sidebarOpen } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [commandOpen, setCommandOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: notifData } = useQuery<{ count: number; notifications: NotificationType[] }>({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
    refetchInterval: 30000,
  })

  const unreadCount = notifData?.count ?? 0
  const notifications = notifData?.notifications ?? []

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' })
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        toast.success('Semua notifikasi ditandai sudah dibaca')
      }
    } catch {
      toast.error('Gagal menandai notifikasi')
    }
  }

  return (
    <motion.header
      initial={false}
      animate={{ paddingLeft: sidebarOpen ? 260 : 72 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6 glass-card"
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
            {pageDescriptions[activePage]}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search — opens Command Palette */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            readOnly
            placeholder="Cari transaksi, merchant... ⌘K"
            className="w-64 cursor-pointer pl-9 hover-glow-border"
            onClick={() => setCommandOpen(true)}
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
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-4 w-4" />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="badge-bounce absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Notifikasi</span>
              </div>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {unreadCount} baru
                </Badge>
              )}
            </div>
            <DropdownMenuSeparator />

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 opacity-30" />
                  <span className="text-sm">Belum ada notifikasi</span>
                </div>
              ) : (
                notifications.slice(0, 10).map((notif, i) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                  >
                    <DropdownMenuItem
                      className={`flex items-start gap-3 py-3 px-4 transition-colors ${
                        !notif.read
                          ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                          : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        <NotificationIcon type={notif.type} />
                      </div>
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <span className="shrink-0 h-2 w-2 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {notif.message}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </motion.div>
                ))
              )}
            </div>

            {unreadCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    onClick={(e) => {
                      e.preventDefault()
                      handleMarkAllRead()
                      setNotifOpen(false)
                    }}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Tandai semua dibaca
                  </Button>
                </div>
              </>
            )}
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

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </motion.header>
  )
}
