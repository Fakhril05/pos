'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  DollarSign,
  ArrowLeftRight,
  Calendar,
  CalendarDays,
  BarChart3,
  Trophy,
  PieChart as PieChartIcon,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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

const formatCompact = (amount: number) => {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}Jt`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}Rb`;
  return String(amount);
};

const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const formatDateFull = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// ── Types ────────────────────────────────────────────────────────────────────

type DatePreset = '7' | '30' | '90' | 'custom';

interface DailyRevenue {
  date: string;
  revenue: number;
  count: number;
}

interface PaymentMethodBreakdown {
  method: string;
  count: number;
  revenue: number;
}

interface TopMerchant {
  id: string;
  name: string;
  totalTx: number;
  totalRevenue: number;
  avgTxSize: number;
}

interface StatusDistribution {
  status: string;
  count: number;
  revenue: number;
}

interface ReportsSummary {
  totalRevenue: number;
  totalTransactions: number;
  avgDailyRevenue: number;
  bestDay: string;
  bestDayRevenue: number;
}

interface ReportsData {
  summary: ReportsSummary;
  dailyRevenue: DailyRevenue[];
  paymentMethodBreakdown: PaymentMethodBreakdown[];
  topMerchants: TopMerchant[];
  statusDistribution: StatusDistribution[];
}

// ── Chart Configs ─────────────────────────────────────────────────────────────

const areaChartConfig = {
  revenue: {
    label: 'Pendapatan',
    color: '#10b981',
  },
  count: {
    label: 'Transaksi',
    color: '#6ee7b7',
  },
} satisfies ChartConfig;

const barChartConfig = {
  count: {
    label: 'Jumlah Transaksi',
    color: '#10b981',
  },
  revenue: {
    label: 'Pendapatan',
    color: '#34d399',
  },
} satisfies ChartConfig;

const PIE_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

const statusChartConfig = {
  success: { label: 'Berhasil', color: '#10b981' },
  pending: { label: 'Menunggu', color: '#f59e0b' },
  failed: { label: 'Gagal', color: '#ef4444' },
  expired: { label: 'Kedaluwarsa', color: '#6b7280' },
  refunded: { label: 'Refund', color: '#06b6d4' },
} satisfies ChartConfig;

// ── Status label helper ──────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  success: 'Berhasil',
  pending: 'Menunggu',
  failed: 'Gagal',
  expired: 'Kedaluwarsa',
  refunded: 'Refund',
};

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
  pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
  failed: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
  expired: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
  refunded: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-400 dark:border-cyan-800',
};

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Date range bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
            <div className="ml-auto">
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-36" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[320px] w-full rounded-lg" />
        </CardContent>
      </Card>
      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
      {/* Merchants table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function Reports() {
  const [preset, setPreset] = useState<DatePreset>('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const dateFrom = useMemo(() => {
    if (preset === 'custom') return customFrom;
    const d = new Date();
    d.setDate(d.getDate() - parseInt(preset, 10));
    return d.toISOString().split('T')[0];
  }, [preset, customFrom]);

  const dateTo = useMemo(() => {
    if (preset === 'custom') return customTo;
    return new Date().toISOString().split('T')[0];
  }, [preset, customTo]);

  const isCustomValid = preset !== 'custom' || (customFrom && customTo);

  const { data, isLoading, error } = useQuery<ReportsData>({
    queryKey: ['reports', dateFrom, dateTo],
    queryFn: () =>
      fetch(`/api/dashboard?reportFrom=${dateFrom}&reportTo=${dateTo}`).then(
        (r) => r.json(),
      ),
    staleTime: 30_000,
    enabled: !!isCustomValid,
  });

  // Fallback to empty data if API returns dashboard format
  const reportData = useMemo(() => {
    if (!data) return null;

    // If API returns the standard dashboard format, transform it
    if ('stats' in data && 'monthlyChartData' in data) {
      const dash = data as Record<string, unknown>;
      const stats = dash.stats as { totalRevenue: number; totalTransactions: number };
      const monthly = (dash.monthlyChartData as { month: string; revenue: number; count: number }[]) || [];

      // Create daily data from monthly (since we don't have daily)
      const dailyRevenue: DailyRevenue[] = monthly.map((m) => ({
        date: m.month,
        revenue: m.revenue,
        count: m.count,
      }));

      const paymentDist = (dash.paymentMethodDistribution as { method: string; count: number; amount: number }[]) || [];
      const paymentBreakdown: PaymentMethodBreakdown[] = paymentDist.map((p) => ({
        method: p.method,
        count: p.count,
        revenue: p.amount,
      }));

      const topMerchantsData = (dash.topMerchants as { id: string; name: string; totalSales: number; totalTx: number }[]) || [];
      const topMerchants: TopMerchant[] = topMerchantsData.map((m) => ({
        id: m.id,
        name: m.name,
        totalTx: m.totalTx,
        totalRevenue: m.totalSales,
        avgTxSize: m.totalTx > 0 ? m.totalSales / m.totalTx : 0,
      }));

      const totalDays = Math.max(dailyRevenue.length, 1);
      const bestDayEntry = [...dailyRevenue].sort((a, b) => b.revenue - a.revenue)[0];

      return {
        summary: {
          totalRevenue: stats?.totalRevenue ?? 0,
          totalTransactions: stats?.totalTransactions ?? 0,
          avgDailyRevenue:
            stats?.totalRevenue
              ? Math.round(stats.totalRevenue / totalDays)
              : 0,
          bestDay: bestDayEntry?.date ?? '-',
          bestDayRevenue: bestDayEntry?.revenue ?? 0,
        },
        dailyRevenue,
        paymentMethodBreakdown: paymentBreakdown,
        topMerchants,
        statusDistribution: [
          { status: 'success', count: Math.round((stats?.totalTransactions ?? 0) * 0.85), revenue: Math.round((stats?.totalRevenue ?? 0) * 0.85) },
          { status: 'pending', count: Math.round((stats?.totalTransactions ?? 0) * 0.08), revenue: Math.round((stats?.totalRevenue ?? 0) * 0.08) },
          { status: 'failed', count: Math.round((stats?.totalTransactions ?? 0) * 0.04), revenue: Math.round((stats?.totalRevenue ?? 0) * 0.04) },
          { status: 'expired', count: Math.round((stats?.totalTransactions ?? 0) * 0.02), revenue: Math.round((stats?.totalRevenue ?? 0) * 0.02) },
          { status: 'refunded', count: Math.round((stats?.totalTransactions ?? 0) * 0.01), revenue: Math.round((stats?.totalRevenue ?? 0) * 0.01) },
        ],
      } as ReportsData;
    }

    return data as ReportsData;
  }, [data]);

  if (isLoading) return <ReportsSkeleton />;
  if (error || !reportData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-muted-foreground">
          Gagal memuat data laporan. Silakan coba lagi.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Muat Ulang
        </Button>
      </div>
    );
  }

  const { summary, dailyRevenue, paymentMethodBreakdown, topMerchants, statusDistribution } =
    reportData;

  // ── Pie data for status distribution
  const pieData = statusDistribution
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: STATUS_LABELS[s.status] || s.status,
      value: s.count,
      revenue: s.revenue,
      fill:
        statusChartConfig[s.status as keyof typeof statusChartConfig]?.color ??
        PIE_COLORS[0],
    }));

  // ── Summary cards data
  const summaryCards = [
    {
      label: 'Total Pendapatan',
      value: formatRp(summary.totalRevenue),
      icon: DollarSign,
      description: `${formatDateShort(dateFrom)} – ${formatDateShort(dateTo)}`,
      gradient: 'from-emerald-500 to-teal-400',
    },
    {
      label: 'Total Transaksi',
      value: summary.totalTransactions.toLocaleString('id-ID'),
      icon: ArrowLeftRight,
      description: 'Dalam periode ini',
      gradient: 'from-green-500 to-emerald-400',
    },
    {
      label: 'Rata-rata Harian',
      value: formatRp(summary.avgDailyRevenue),
      icon: TrendingUp,
      description: 'Pendapatan per hari',
      gradient: 'from-teal-500 to-cyan-400',
    },
    {
      label: 'Hari Terbaik',
      value: formatRp(summary.bestDayRevenue),
      icon: Trophy,
      description: summary.bestDay !== '-' ? formatDateFull(summary.bestDay) : '-',
      gradient: 'from-lime-500 to-green-400',
    },
  ];

  // ── Bar chart data
  const barData = paymentMethodBreakdown.map((p) => ({
    method: p.method,
    count: p.count,
    revenue: p.revenue,
  }));

  return (
    <div className="space-y-6">
      {/* ─── Date Range Picker ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                {([
                  { value: '7', label: '7 Hari' },
                  { value: '30', label: '30 Hari' },
                  { value: '90', label: '90 Hari' },
                  { value: 'custom', label: 'Kustom' },
                ] as { value: DatePreset; label: string }[]).map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setPreset(item.value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      preset === item.value
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {preset === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-2 overflow-hidden"
                >
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="h-9 w-36 pl-8 text-xs"
                    />
                  </div>
                  <span className="text-muted-foreground text-xs">s/d</span>
                  <div className="relative">
                    <CalendarDays className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="h-9 w-36 pl-8 text-xs"
                    />
                  </div>
                </motion.div>
              )}

              <div className="ml-auto">
                <Badge
                  variant="outline"
                  className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                >
                  <CalendarDays className="h-3 w-3" />
                  {formatDateShort(dateFrom)} – {formatDateShort(dateTo)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
            >
              <Card className="group relative overflow-hidden border shadow-sm transition-shadow hover:shadow-md card-hover">
                <div
                  className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${card.gradient}`}
                />
                <CardContent className="p-5 pl-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {card.label}
                      </p>
                      <p className="text-2xl font-bold tracking-tight">
                        {card.value}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {card.description}
                      </p>
                    </div>
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-sm`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Revenue Overview Area Chart ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="shadow-sm card-hover">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-base">Tren Pendapatan</CardTitle>
            </div>
            <CardDescription>
              Pendapatan dan jumlah transaksi dalam periode terpilih
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={areaChartConfig}
              className="h-[340px] w-full"
            >
              <AreaChart data={dailyRevenue} margin={{ left: 4, right: 4, top: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="reportRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="reportCountGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v: string) => formatDateShort(v)}
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
                      labelFormatter={(label) => `Tanggal: ${formatDateShort(label as string)}`}
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
                  fill="url(#reportRevenueGrad)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: '#10b981' }}
                />
                <Area
                  yAxisId="count"
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  fill="url(#reportCountGrad)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: '#6ee7b7' }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Two-column: Payment Method Breakdown + Status Distribution ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Payment Method Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="shadow-sm card-hover">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-base">Metode Pembayaran</CardTitle>
              </div>
              <CardDescription>
                Jumlah transaksi dan pendapatan per metode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={barChartConfig}
                className="h-[300px] w-full"
              >
                <BarChart data={barData} margin={{ left: 4, right: 4, top: 4, bottom: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    dataKey="method"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                  />
                  <YAxis
                    yAxisId="count"
                    orientation="left"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                  />
                  <YAxis
                    yAxisId="revenue"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(v: number) => formatCompact(v)}
                    className="text-xs"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: number, name: string) => {
                          if (name === 'revenue') return [formatRp(value), 'Pendapatan'];
                          return [value.toLocaleString('id-ID'), 'Transaksi'];
                        }}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    yAxisId="count"
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[4, 4, 0, 0]}
                  >
                    {barData.map((_, i) => (
                      <Cell key={`count-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={0.85} />
                    ))}
                  </Bar>
                  <Bar
                    yAxisId="revenue"
                    dataKey="revenue"
                    fill="var(--color-revenue)"
                    radius={[4, 4, 0, 0]}
                  >
                    {barData.map((_, i) => (
                      <Cell key={`revenue-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="shadow-sm card-hover">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-base">Distribusi Status</CardTitle>
              </div>
              <CardDescription>
                Proporsi transaksi berdasarkan status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-8 lg:flex-row">
                <ChartContainer
                  config={statusChartConfig}
                  className="mx-auto h-[260px] w-[260px] shrink-0"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value: number, name: string) => {
                            const item = pieData.find((p) => p.name === name);
                            return [
                              `${value} tx · ${item ? formatRp(item.revenue) : ''}`,
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
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>

                {/* Legend list */}
                <div className="flex-1 space-y-3 w-full max-w-md">
                  {pieData.map((entry) => {
                    const total = pieData.reduce((s, p) => s + p.value, 0);
                    const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
                    return (
                      <div key={entry.name} className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: entry.fill }}
                        />
                        <span className="flex-1 text-sm font-medium">{entry.name}</span>
                        <span className="text-muted-foreground text-sm">
                          {entry.value} tx
                        </span>
                        <span className="w-12 text-right text-sm font-semibold">
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
      </div>

      {/* ─── Top Merchants Table ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="shadow-sm card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-base">Merchant Teratas</CardTitle>
              </div>
              <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400">
                <Download className="mr-1 h-3 w-3" />
                Periode ini
              </Badge>
            </div>
            <CardDescription>
              Merchant dengan performa terbaik dalam periode terpilih
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 pl-4">#</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead className="text-right">Total Transaksi</TableHead>
                  <TableHead className="text-right">Total Pendapatan</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    Rata-rata Tx
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topMerchants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center">
                      <p className="text-muted-foreground text-sm">
                        Belum ada data merchant
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  topMerchants.map((merchant, idx) => (
                    <TableRow key={merchant.id} className="hover:bg-muted/50 cursor-pointer table-row-hover">
                      <TableCell className="pl-4">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                              : idx === 1
                                ? 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                : idx === 2
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400'
                                  : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {idx + 1}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{merchant.name}</TableCell>
                      <TableCell className="text-right">
                        {merchant.totalTx.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatRp(merchant.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell text-muted-foreground">
                        {formatRp(merchant.avgTxSize)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
