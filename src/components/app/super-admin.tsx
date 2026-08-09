'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { AnimatedCounter } from '@/components/app/animated-counter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Building2,
  Users,
  ArrowLeftRight,
  Wallet,
  Search,
  Eye,
  Power,
  CheckCircle2,
  Clock,
  Crown,
  Rocket,
  Sparkles,
  Gem,
  Zap,
} from 'lucide-react'

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

function timeAgo(date: Date | string) {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Hari ini'
  if (diffDays === 1) return 'Kemarin'
  if (diffDays < 7) return `${diffDays} hari lalu`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`
  return `${Math.floor(diffDays / 30)} bulan lalu`
}

// Subscription plan data
const plans = [
  {
    name: 'Free',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-gray-500',
    borderColor: 'border-gray-500/20',
    bgColor: 'bg-gray-500/10',
    price: 0,
    maxOutlets: 1,
    maxUsers: 5,
    maxProducts: 100,
    features: ['1 Outlet', '5 Pengguna', '100 Produk', 'Laporan Dasar', 'Kasir POS'],
  },
  {
    name: 'Starter',
    icon: <Rocket className="h-5 w-5" />,
    color: 'text-emerald-500',
    borderColor: 'border-emerald-500/20',
    bgColor: 'bg-emerald-500/10',
    price: 149000,
    maxOutlets: 3,
    maxUsers: 15,
    maxProducts: 500,
    features: ['3 Outlet', '15 Pengguna', '500 Produk', 'Laporan Lanjutan', 'Stok Multi-Outlet', 'Manajemen Karyawan'],
  },
  {
    name: 'Pro',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-amber-500',
    borderColor: 'border-amber-500/20',
    bgColor: 'bg-amber-500/10',
    price: 449000,
    maxOutlets: 10,
    maxUsers: 50,
    maxProducts: 5000,
    features: ['10 Outlet', '50 Pengguna', '5.000 Produk', 'Semua Laporan', 'API Akses', 'Multi-Payment', 'Prioritas Support'],
    popular: true,
  },
  {
    name: 'Enterprise',
    icon: <Crown className="h-5 w-5" />,
    color: 'text-violet-500',
    borderColor: 'border-violet-500/20',
    bgColor: 'bg-violet-500/10',
    price: 1499000,
    maxOutlets: 99,
    maxUsers: 999,
    maxProducts: 99999,
    features: ['Outlet Unlimited', 'Pengguna Unlimited', 'Produk Unlimited', 'Custom Integration', 'Dedicated Account Manager', 'SLA 99.9%', 'Custom Branding'],
  },
]

export function SuperAdmin() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: () => fetch('/api/super-admin/stats').then((r) => r.json()),
  })

  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['super-admin-tenants', search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      return fetch(`/api/super-admin/tenants?${params}`).then((r) => r.json())
    },
  })

  const statCards = [
    {
      label: 'Tenant Aktif',
      value: stats?.tenantCount || 0,
      icon: <Building2 className="h-5 w-5" />,
      formatFn: (v: number) => new Intl.NumberFormat('id-ID').format(v),
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      label: 'Total Pengguna',
      value: stats?.userCount || 0,
      icon: <Users className="h-5 w-5" />,
      formatFn: (v: number) => new Intl.NumberFormat('id-ID').format(v),
      gradient: 'from-teal-500 to-teal-600',
    },
    {
      label: 'Transaksi Bulan Ini',
      value: stats?.monthlyTx || 0,
      icon: <ArrowLeftRight className="h-5 w-5" />,
      formatFn: (v: number) => new Intl.NumberFormat('id-ID').format(v),
      gradient: 'from-cyan-500 to-cyan-600',
    },
    {
      label: 'Pendapatan Platform',
      value: stats?.platformFees || 0,
      icon: <Wallet className="h-5 w-5" />,
      formatFn: (v: number) => formatRupiah(v),
      gradient: 'from-green-500 to-green-600',
    },
  ]

  const planDistribution = stats?.planDistribution || {}

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'default', label: 'Aktif' },
      trial: { variant: 'secondary', label: 'Trial' },
      suspended: { variant: 'destructive', label: 'Nonaktif' },
      closed: { variant: 'outline', label: 'Ditutup' },
    }
    const config = map[status] || { variant: 'outline' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard <span className="text-gradient-emerald">Super Admin</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola seluruh tenant dan pantau performa platform
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="glass-card card-elevated card-hover group relative overflow-hidden rounded-xl p-5"
          >
            {/* Top accent bar */}
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    <AnimatedCounter value={stat.value} formatFn={stat.formatFn} />
                  </p>
                )}
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Subscription Plans Overview */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Paket Langganan</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
              className={`glass-card card-hover relative overflow-hidden rounded-xl border ${plan.borderColor} p-5`}
            >
              {plan.popular && (
                <div className="absolute right-3 top-3">
                  <Badge className="bg-amber-500 text-white hover:bg-amber-600">Populer</Badge>
                </div>
              )}
              <div className={`mb-3 flex items-center gap-2 ${plan.color}`}>
                {plan.icon}
                <span className="font-semibold">{plan.name}</span>
              </div>
              <div className="mb-4">
                <span className="text-2xl font-bold text-foreground">
                  {plan.price === 0 ? 'Gratis' : formatRupiah(plan.price)}
                </span>
                {plan.price > 0 && (
                  <span className="text-xs text-muted-foreground">/bulan</span>
                )}
              </div>
              <div className="space-y-1.5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${plan.color}`} />
                    {f}
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tenant saat ini</span>
                  <span className={`text-sm font-semibold ${plan.color}`}>
                    {planDistribution[plan.name.toLowerCase()] || 0}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tenant Management Table */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">Daftar Tenant</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari bisnis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-56 pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="trial">Trial</option>
              <option value="suspended">Nonaktif</option>
              <option value="closed">Ditutup</option>
            </select>
          </div>
        </div>

        <div className="glass-card overflow-hidden rounded-xl border">
          {/* Desktop Table */}
          <div className="hidden md:block max-h-[500px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nama Bisnis</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Pemilik</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paket</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Outlet</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground lg:table-cell">Omzet Bulan Ini</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenantsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="table-row-hover">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                      <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="hidden px-4 py-3 sm:table-cell"><Skeleton className="h-4 w-8" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="hidden px-4 py-3 text-right lg:table-cell"><Skeleton className="ml-auto h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="ml-auto h-8 w-16" /></td>
                    </tr>
                  ))
                ) : tenants && tenants.length > 0 ? (
                  tenants.map((t: any, i: number) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="table-row-hover"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.city}</p>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="text-muted-foreground">{t.ownerName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">
                          {t.plan}
                        </Badge>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span className="tabular-nums text-muted-foreground">{t.outletCount}</span>
                      </td>
                      <td className="px-4 py-3">{statusBadge(t.status)}</td>
                      <td className="hidden px-4 py-3 text-right lg:table-cell">
                        <span className="tabular-nums font-medium text-foreground">
                          {formatRupiah(t.monthRevenue)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${t.status === 'active' ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-500/10' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10'}`}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      Tidak ada tenant ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile Card List */}
          <div className="md:hidden divide-y">
            {tenantsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            ) : tenants && tenants.length > 0 ? (
              tenants.map((t: any, i: number) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      {statusBadge(t.status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{t.city} · {t.ownerName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize">{t.plan}</Badge>
                      {t.outletCount != null && <span className="ml-2">{t.outletCount} outlet</span>}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 w-8 p-0 ${t.status === 'active' ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-500/10' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10'}`}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Tidak ada tenant ditemukan</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Pendaftaran Tenant Terbaru</h2>
        <div className="glass-card rounded-xl border p-5">
          <div className="space-y-3">
            {statsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="mt-1 h-3 w-24" />
                  </div>
                </div>
              ))
            ) : stats?.recentTenants && stats.recentTenants.length > 0 ? (
              stats.recentTenants.map((t: any, i: number) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                    <Gem className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.city}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {timeAgo(t.createdAt)}
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">Belum ada data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
