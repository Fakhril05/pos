'use client';

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
  CreditCard,
  ArrowLeftRight,
  DollarSign,
  ShoppingBag,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
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
    color: '#10b981',
  },
  count: {
    label: 'Jumlah Transaksi',
    color: '#6ee7b7',
  },
} satisfies ChartConfig;

const PIE_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

const pieChartConfig = {
  value: {
    label: 'Jumlah Transaksi',
  },
  QRIS: { label: 'QRIS', color: '#10b981' },
  'Bank Transfer': { label: 'Bank Transfer', color: '#34d399' },
  'E-Wallet': { label: 'E-Wallet', color: '#6ee7b7' },
  'Virtual Account': { label: 'Virtual Account', color: '#a7f3d0' },
  'Credit Card': { label: 'Credit Card', color: '#d1fae5' },
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
      value: formatRp(stats.totalRevenue),
      icon: DollarSign,
      change: 12.5,
      gradient: 'from-emerald-500 to-teal-400',
    },
    {
      label: 'Total Transaksi',
      value: stats.totalTransactions.toLocaleString('id-ID'),
      icon: ArrowLeftRight,
      change: 8.2,
      gradient: 'from-green-500 to-emerald-400',
    },
    {
      label: 'Tingkat Keberhasilan',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      change: 2.1,
      gradient: 'from-teal-500 to-cyan-400',
    },
    {
      label: 'Rata-rata Transaksi',
      value: formatRp(stats.avgTransaction),
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

// ── Main component ───────────────────────────────────────────────────────────

export default function Dashboard() {
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
    <div className="space-y-6">
      {/* ─── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          const isPositive = card.change >= 0;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: 'easeOut' }}
            >
              <Card className="group relative overflow-hidden border shadow-sm transition-shadow hover:shadow-md">
                {/* gradient left accent */}
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
                      <div className="flex items-center gap-1">
                        {isPositive ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span
                          className={`text-xs font-semibold ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {Math.abs(card.change)}%
                        </span>
                        <span className="text-muted-foreground text-xs">
                          vs bulan lalu
                        </span>
                      </div>
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

      {/* ─── Revenue Chart ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="shadow-sm">
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
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.02} />
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
                  activeDot={{ r: 5, strokeWidth: 2, fill: '#10b981' }}
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
                  activeDot={{ r: 4, strokeWidth: 2, fill: '#6ee7b7' }}
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
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
              </div>
              <p className="text-muted-foreground text-sm">5 transaksi terakhir</p>
            </CardHeader>
            <CardContent className="px-2 pb-4">
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Merchants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="shadow-sm">
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
                    className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
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
                    </div>
                    <span className="text-sm font-semibold">
                      {formatRp(merchant.totalSales)}
                    </span>
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
        <Card className="shadow-sm">
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
                    <div key={entry.name} className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 shrink-0 rounded-sm"
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
  );
}
