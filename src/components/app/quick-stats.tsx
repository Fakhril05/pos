'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  ArrowLeftRight,
  Clock,
  Store,
  DollarSign,
} from 'lucide-react'

const formatRp = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)

interface DashboardStats {
  todayRevenue: number
  totalTransactions: number
  pendingTransactions: number
  activeMerchants: number
  successRate: number
}

export function QuickStats() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['quick-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      const stats = json.stats ?? {}
      return {
        todayRevenue: stats.todayRevenue ?? 0,
        totalTransactions: stats.totalTransactions ?? 0,
        pendingTransactions: stats.pendingTransactions ?? 0,
        activeMerchants: stats.activeMerchants ?? 0,
        successRate: stats.successRate ?? 0,
      }
    },
    refetchInterval: 60000,
    staleTime: 30000,
  })

  const items = [
    {
      label: 'Hari Ini',
      value: data ? formatRp(data.todayRevenue) : '-',
      icon: DollarSign,
      color: 'text-emerald-500',
    },
    {
      label: 'Total Transaksi',
      value: data ? `${data.totalTransactions.toLocaleString('id-ID')}` : '-',
      icon: ArrowLeftRight,
      color: 'text-teal-500',
    },
    {
      label: 'Menunggu',
      value: data ? String(data.pendingTransactions) : '-',
      icon: Clock,
      color: 'text-amber-500',
      highlight: (data?.pendingTransactions ?? 0) > 0,
      pulse: true,
    },
    {
      label: 'Keberhasilan',
      value: data ? `${data.successRate}%` : '-',
      icon: TrendingUp,
      color: 'text-emerald-500',
    },
    {
      label: 'Merchant Aktif',
      value: data ? String(data.activeMerchants) : '-',
      icon: Store,
      color: 'text-emerald-500',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="quick-stats-bar glass-card hidden md:flex items-center gap-4 px-6 py-1.5 inset-shadow smooth-corners divide-x divide-border"
    >
      <AnimatePresence>
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="quick-stat-item stat-card-gradient hover-scale ripple flex items-center gap-1.5 rounded-md px-2 py-1"
            >
              <Icon className={`h-3 w-3 ${item.color}`} />
              <span className="text-[10px] text-muted-foreground leading-none">
                {item.label}
              </span>
              <span className={`text-[10px] font-semibold leading-none tabular-nums ${
                'highlight' in item && item.highlight
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-foreground'
              }${'pulse' in item && item.pulse && (data?.pendingTransactions ?? 0) > 0 ? ' badge-pulse' : ''}`}>
                {isLoading ? (
                  <span className="inline-block h-3 w-10 rounded skeleton-card" />
                ) : (
                  item.value
                )}
              </span>
              {i < items.length - 1 && (
                <div className="quick-stat-divider ml-4" />
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}
