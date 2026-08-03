'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  CreditCard,
  ArrowLeftRight,
  DollarSign,
  ShoppingBag,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Link2,
  Activity,
  Wallet,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/app/page-header';
import { AnimatedCounter } from '@/components/app/animated-counter';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useTransactionSocket,
  type SocketTransaction,
} from '@/hooks/use-socket';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatRp = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const formatTimeAgo = (dateStr: string): string => {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} hari lalu`;
  if (hours > 0) return `${hours} jam lalu`;
  if (minutes > 0) return `${minutes} menit lalu`;
  return 'Baru saja';
};

const formatCompact = (amount: number) => {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}Jt`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}Rb`;
  return String(amount);
};

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  successRate: number;
  avgTransaction: number;
  activeMerchants: number;
  todayRevenue: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  count: number;
}

interface RecentTransaction {
  id: string;
  invoiceNo: string;
  amount: number;
  paymentMethod: string;
  paymentChannel: string;
  status: string;
  customerName: string | null;
  createdAt: string;
  merchant: { id: string; name: string; logo: string | null };
}

interface TopMerchant {
  id: string;
  name: string;
  totalSales: number;
  totalTx: number;
  status: string;
}

interface PaymentMethodDist {
  method: string;
  count: number;
  amount: number;
}

interface ActivityTransaction {
  id: string;
  invoiceNo: string;
  amount: number;
  status: string;
  customerName: string | null;
  createdAt: string;
  merchant: { id: string; name: string; logo: string | null };
  customer: { id: string; name: string; email: string } | null;
}

interface DashboardData {
  stats: DashboardStats;
  monthlyChartData: MonthlyData[];
  recentTransactions: RecentTransaction[];
  topMerchants: TopMerchant[];
  paymentMethodDistribution: PaymentMethodDist[];
}

// ── Chart configs ─────────────────────────────────────────────────────────────

const revenueChartConfig = {
  revenue: {
    label: 'Pendapatan',
    color: 'hsl(160, 84%, 39%)',
  },
  count: {
    label: 'Jumlah Transaksi',
    color: 'hsl(160, 60%, 65%)',
  },
} satisfies ChartConfig;

const PIE_COLORS = ['hsl(160, 84%, 39%)', 'hsl(152, 70%, 53%)', 'hsl(160, 60%, 65%)', 'hsl(160, 40%, 80%)', 'hsl(160, 20%, 90%)'];

const pieChartConfig = {
  value: {
    label: 'Jumlah Transaksi',
  },
  QRIS: { label: 'QRIS', color: 'hsl(160, 84%, 39%)' },
  'Bank Transfer': { label: 'Bank Transfer', color: 'hsl(152, 70%, 53%)' },
  'E-Wallet': { label: 'E-Wallet', color: 'hsl(160, 60%, 65%)' },
  'Virtual Account': { label: 'Virtual Account', color: 'hsl(160, 40%, 80%)' },
  'Credit Card': { label: 'Credit Card', color: 'hsl(160, 20%, 90%)' },
} satisfies ChartConfig;

// ── Status badge helper ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    success: {
      label: 'Berhasil',
      className:
        'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
    },
    pending: {
      label: 'Menunggu',
      className:
        'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
    },
    failed: {
      label: 'Gagal',
      className:
        'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
    },
    expired: {
      label: 'Kedaluwarsa',
      className:
        'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
    },
    refunded: {
      label: 'Refund',
      className:
        'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800',
    },
  };
  const s = map[status] ?? map.pending;
  return (
    <Badge variant="outline" className={s.className}>
      {s.label}
    </Badge>
  );
}

// ── KPI card data ────────────────────────────────────────────────────────────

function getKpiCards(stats: DashboardStats) {
  return [
    {
      label: 'Total Pendapatan',
      rawValue: stats.totalRevenue,
      formatFn: formatRp,
      icon: DollarSign,
      change: 12.5,
      gradient: 'from-emerald-500 to-teal-400',
    },
    {
      label: 'Total Transaksi',
      rawValue: stats.totalTransactions,
      icon: ArrowLeftRight,
      change: 8.2,
      gradient: 'from-green-500 to-emerald-400',
    },
    {
      label: 'Tingkat Keberhasilan',
      rawValue: stats.successRate,
      formatFn: (v: number) => `${v}%`,
      icon: TrendingUp,
      change: 2.1,
      gradient: 'from-teal-500 to-cyan-400',
    },
    {
      label: 'Rata-rata Transaksi',
      rawValue: stats.avgTransaction,
      formatFn: formatRp,
      icon: CreditCard,
      change: -3.4,
      gradient: 'from-lime-500 to-green-400',
    },
  ];
}

// ── Loading skeletons ────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI skeletons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Chart skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[320px] w-full rounded-lg" />
        </CardContent>
      </Card>
      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
      {/* Pie skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

// ── Activity Feed ───────────────────────────────────────────────────────────

const statusDotColors: Record<string, string> = {
  success: 'bg-emerald-500',
  pending: 'bg-amber-500',
  failed: 'bg-red-500',
  expired: 'bg-gray-400',
  refunded: 'bg-blue-500',
};

function ActivityFeed() {
  const { setActivePage } = useAppStore();
  const [liveItems, setLiveItems] = useState<SocketTransaction[]>([]);

  const { data: activityData, isLoading: activityLoading } = useQuery<{
    data: ActivityTransaction[];
  }>({
    queryKey: ['activity-feed'],
    queryFn: () =>
      fetch('/api/transactions?limit=8&status=success').then((r) => r.json()),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const baseItems = activityData?.data?.slice(0, 6) ?? [];

  // Socket integration — receive live transactions
  useTransactionSocket({
    onTransaction: (tx) => {
      setLiveItems((prev) => [tx, ...prev].slice(0, 10));
      toast('Pembayaran Baru!', {
        description: `${formatRp(tx.amount)} dari ${tx.customerName} — ${tx.merchantName}`,
        icon: <CreditCard className="h-4 w-4 text-emerald-500" />,
      });
    },
  });

  // Merge: live items first, then DB items, deduplicated
  const liveIds = new Set(liveItems.map((t) => t.id));
  const merged: (ActivityTransaction | SocketTransaction)[] = [
    ...liveItems,
    ...baseItems.filter((t) => !liveIds.has(t.id)),
  ].slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <Card className="card-hover shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span className="rounded-full w-2 h-2 bg-emerald-500 inline-block mr-2 status-dot" />
              <CardTitle className="text-base">Aktivitas Terkini</CardTitle>
            </div>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Transaksi terbaru yang berhasil diproses
          </p>
        </CardHeader>
        <CardContent className="scrollbar-thin">
          {activityLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : merged.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada aktivitas terkini.
            </p>
          ) : (
            <div className="relative space-y-0">
              {/* Vertical connecting line */}
              <div className="absolute bottom-0 left-[11px] top-2 w-px bg-border" />

              {merged.map((tx, idx) => {
                // Handle both ActivityTransaction (nested) and SocketTransaction (flat)
                const merchantName =
                  'merchant' in tx && tx.merchant
                    ? (tx as ActivityTransaction).merchant.name
                    : (tx as SocketTransaction).merchantName;
                const customerName =
                  'customer' in tx && tx.customer
                    ? (tx as ActivityTransaction).customer!.name
                    : (tx as SocketTransaction).customerName;

                return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.07 }}
                  className={cn(
                    'group relative flex gap-4 rounded-lg p-2.5 transition-colors hover:bg-muted/50',
                    idx < liveItems.length && 'bg-emerald-50/50 dark:bg-emerald-950/20'
                  )}
                >
                  {/* Timeline dot */}
                  <div className="relative z-10 mt-1 flex shrink-0 items-start justify-center">
                    <div
                      className={cn(
                        'h-3 w-3 rounded-full ring-4 ring-background',
                        statusDotColors[tx.status] ?? 'bg-gray-400'
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pb-3">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                      <p className="text-sm">
                        <span className="font-semibold">{merchantName}</span>
                        <span className="text-muted-foreground"> — </span>
                        <span className="text-muted-foreground">
                          {customerName.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </p>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatRp(tx.amount)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatTimeAgo(tx.createdAt)}
                    </p>
                  </div>
                </motion.div>
                );
              })}
            </div>
          )}

          {/* View all link */}
          <div className="mt-2 border-t pt-3">
            <button
              onClick={() => setActivePage('transactions')}
              className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Lihat Semua →
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Live Clock Widget ───────────────────────────────────────────────────────

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const date = `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="glass-card flex flex-col items-end rounded-xl px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/70">
          Live
        </span>
      </div>
      <span className="mt-0.5 text-xl font-bold tabular-nums tracking-wide text-white">
        {time}
      </span>
      <span className="mt-0.5 text-xs text-white/70">{date}</span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { setActivePage } = useAppStore();

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then((r) => r.json()),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">
          Gagal memuat data dashboard. Silakan coba lagi.
        </p>
      </div>
    );
  }

  const kpiCards = getKpiCards(data.stats);
  const monthLabels = data.monthlyChartData.map((d) => {
    const [, m] = d.month.split('-');
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];
    return months[parseInt(m, 10) - 1];
  });

  const enrichedMonthly = data.monthlyChartData.map((d, i) => ({
    ...d,
    label: monthLabels[i],
  }));

  // Pie chart data
  const pieData = data.paymentMethodDistribution
    .sort((a, b) => b.count - a.count)
    .map((d) => ({
      name: d.method,
      value: d.count,
      amount: d.amount,
      fill: pieChartConfig[d.method as keyof typeof pieChartConfig]?.color ?? PIE_COLORS[0],
    }));

  return (
    <div className="space-y-6 bg-mesh pattern-grid">
      {/* ─── Page Header ────────────────────────────────────────── */}
      <PageHeader
        title="Dashboard"
        description="Ringkasan aktivitas dan performa bisnis Anda"
        icon={TrendingUp}
        iconGradient="emerald"
      >
        <Button onClick={() => setActivePage('payment-links')} className="gap-2 btn-press">
          <Link2 className="h-4 w-4" />
          <span className="hidden sm:inline">Buat Payment Link</span>
        </Button>
        <Button variant="outline" onClick={() => setActivePage('transactions')} className="gap-2 btn-press">
          <ArrowLeftRight className="h-4 w-4" />
          <span className="hidden sm:inline">Lihat Transaksi</span>
        </Button>
      </PageHeader>

      {/* ─── Welcome Banner ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card-elevated gradient-border relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 p-6 text-white glow-emerald-sm">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 animate-float rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 right-16 h-40 w-40 animate-float rounded-full bg-white/[0.07]" />
          <div className="pointer-events-none absolute left-1/2 -top-4 h-24 w-24 animate-float rounded-full bg-white/[0.05]" />
          <div className="pointer-events-none absolute bottom-2 left-8 h-16 w-16 animate-float rounded-full bg-white/[0.06]" />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-lg">
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl text-shadow-subtle">
                Selamat Datang, Admin Ril 👋
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/80 sm:text-base">
                Kelola semua transaksi dan pantau pertumbuhan bisnis Anda dari satu tempat.
              </p>
            </div>
            <LiveClock />
          </div>
        </div>
      </motion.div>

      {/* ─── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          const isPositive = card.change >= 0;
          const tooltipMap: Record<string, string> = {
            'Total Pendapatan': 'Lihat Laporan',
            'Total Transaksi': 'Lihat Transaksi',
            'Tingkat Keberhasilan': 'Lihat Transaksi',
            'Rata-rata Transaksi': 'Lihat Laporan',
          };
          const navMap: Record<string, 'reports' | 'transactions'> = {
            'Total Pendapatan': 'reports',
            'Total Transaksi': 'transactions',
            'Tingkat Keberhasilan': 'transactions',
            'Rata-rata Transaksi': 'reports',
          };
          const tooltip = tooltipMap[card.label] ?? '';
          const targetPage = navMap[card.label];
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: 'easeOut' }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card
                    className="card-hover hover-glow-border group relative cursor-pointer overflow-hidden bg-card/80 backdrop-blur-sm border border-border/60 shadow-sm hover-scale"
                    onClick={() => setActivePage(targetPage)}
                  >
                    {/* gradient top accent */}
                    <div
                      className={`absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r ${card.gradient}`}
                    />
                    <CardContent className="p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                            {card.label}
                          </p>
                          <AnimatedCounter
                            value={card.rawValue}
                            formatFn={'formatFn' in card && card.formatFn ? card.formatFn : undefined}
                            className={cn(
                              "text-2xl font-bold tracking-tight tabular-nums",
                              card.label === 'Total Pendapatan' && "gradient-text-emerald",
                            )}
                          />
                          <div
                            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                                : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            <span className="text-xs font-semibold">
                              {Math.abs(card.change)}%
                            </span>
                            <span className="text-xs opacity-70">
                              vs bulan lalu
                            </span>
                          </div>
                        </div>
                        <div className="relative">
                          <div
                            className={`absolute inset-0 rounded-xl bg-gradient-to-br ${card.gradient} blur-xl opacity-30`}
                          />
                          <div
                            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-sm`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </div>
                      {/* Navigation arrow indicator */}
                      <ArrowUpRight className="absolute top-4 right-4 h-4 w-4 text-muted-foreground/40 transition-all duration-200 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
              </Tooltip>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Revenue Chart ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="card-hover shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Pendapatan Bulanan</CardTitle>
            <p className="text-muted-foreground text-sm">
              Tren pendapatan dan jumlah transaksi 12 bulan terakhir
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={revenueChartConfig}
              className="h-[320px] w-full"
            >
              <AreaChart data={enrichedMonthly} margin={{ left: 4, right: 4, top: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 60%, 65%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(160, 60%, 65%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis
                  yAxisId="revenue"
                  orientation="left"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v: number) => formatCompact(v)}
                  className="text-xs"
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => `Bulan: ${label}`}
                      formatter={(value: number, name: string) => {
                        if (name === 'revenue') return [formatRp(value), 'Pendapatan'];
                        return [value.toLocaleString('id-ID'), 'Transaksi'];
                      }}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="url(#revenueGradient)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: 'hsl(160, 84%, 39%)' }}
                />
                <Area
                  yAxisId="count"
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  fill="url(#countGradient)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: 'hsl(160, 60%, 65%)' }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Two-column: Recent Transactions + Top Merchants ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="card-hover shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
              </div>
              <p className="text-muted-foreground text-sm">5 transaksi terakhir</p>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {data.recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wallet className="h-16 w-16 text-muted-foreground/20" />
                  <p className="mt-4 text-sm font-medium text-muted-foreground">
                    Belum ada transaksi
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
                    Transaksi akan muncul di sini saat pelanggan melakukan pembayaran
                  </p>
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Invoice</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="pl-4 font-mono text-xs">
                        {tx.invoiceNo}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm">
                        {tx.merchant.name}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatRp(tx.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={tx.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Merchants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="card-hover shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-base">Merchant Teratas</CardTitle>
              </div>
              <p className="text-muted-foreground text-sm">Berdasarkan total penjualan</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.topMerchants.map((merchant, idx) => {
                const maxSales = data.topMerchants[0]?.totalSales ?? 1;
                const pct = (merchant.totalSales / maxSales) * 100;
                return (
                  <div
                    key={merchant.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActivePage('merchants')}
                    onKeyDown={(e) => { if (e.key === 'Enter') setActivePage('merchants'); }}
                    className="group/merchant flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-all duration-200 hover:bg-muted/60 hover:shadow-sm hover-scale"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 text-sm font-bold text-white shadow-sm">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {merchant.name}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {merchant.totalTx} tx
                        </span>
                      </div>
                      {/* Thin progress bar under sales amount */}
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500/60 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatRp(merchant.totalSales)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/0 transition-all duration-200 group-hover/merchant:text-emerald-500 group-hover/merchant:translate-x-0.5" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Payment Method Distribution ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="card-hover shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Distribusi Metode Pembayaran</CardTitle>
            <p className="text-muted-foreground text-sm">
              Berdasarkan jumlah transaksi berhasil
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-8 lg:flex-row">
              <ChartContainer
                config={pieChartConfig}
                className="mx-auto h-[280px] w-[280px] shrink-0"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: number, name: string) => {
                          const item = pieData.find((p) => p.name === name);
                          return [
                            `${value} tx · ${item ? formatRp(item.amount) : ''}`,
                            name,
                          ];
                        }}
                      />
                    }
                  />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              {/* Legend list */}
              <div className="flex-1 space-y-3 w-full max-w-md">
                {pieData.map((entry, i) => {
                  const total = pieData.reduce((s, p) => s + p.value, 0);
                  const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={entry.name} className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-all duration-150 hover:bg-muted/60">
                      <div
                        className="h-3 w-3 shrink-0 rounded-sm ring-1 ring-black/5 dark:ring-white/10"
                        style={{
                          backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                      <span className="flex-1 text-sm font-medium">
                        {entry.name}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {entry.value} tx
                      </span>
                      <span className="w-12 text-right text-sm font-semibold tabular-nums">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Live Activity Feed ───────────────────────────────────── */}
      <ActivityFeed />
    </div>
  );
}
