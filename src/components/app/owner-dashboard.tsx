'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DollarSign,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Calculator,
  Package,
  BarChart3,
  Plus,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { AnimatedCounter } from '@/components/app/animated-counter';
import { useAppStore } from '@/stores/app-store';

// ── Helpers ──────────────────────────────────────────────────────────────

const formatRp = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const formatShortRp = (amount: number) => {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}Jt`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}Rb`;
  return String(amount);
};

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  paid: { label: 'Lunas', variant: 'default' },
  pending: { label: 'Tertunda', variant: 'secondary' },
  cancelled: { label: 'Dibatalkan', variant: 'destructive' },
  refunded: { label: 'Refund', variant: 'destructive' },
  void: { label: 'Batal', variant: 'destructive' },
};

const revenueChartConfig: ChartConfig = {
  revenue: { label: 'Pendapatan', color: 'var(--chart-1)' },
  count: { label: 'Transaksi', color: 'var(--chart-2)' },
};

const outletChartConfig: ChartConfig = {
  revenue: { label: 'Pendapatan', color: 'var(--chart-1)' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

// ── Component ────────────────────────────────────────────────────────────

export function OwnerDashboard() {
  const { user } = useAppStore();
  const tenantId = user?.tenantId ?? '';

  const { data, isLoading } = useQuery({
    queryKey: ['owner-dashboard', tenantId],
    queryFn: () => fetch(`/api/owner/dashboard?tenantId=${tenantId}`).then((r) => r.json()),
    enabled: !!tenantId,
  });

  const kpis = useMemo(
    () => [
      {
        label: 'Pendapatan Hari Ini',
        value: data?.todayRevenue ?? 0,
        format: formatRp,
        icon: DollarSign,
        gradient: 'from-emerald-500 to-teal-500',
        shadow: 'shadow-emerald-500/20',
        change: data?.todayPctChange ?? 0,
      },
      {
        label: 'Pendapatan Bulan Ini',
        value: data?.monthRevenue ?? 0,
        format: formatRp,
        icon: TrendingUp,
        gradient: 'from-teal-500 to-cyan-500',
        shadow: 'shadow-teal-500/20',
        change: null,
      },
      {
        label: 'Total Transaksi',
        value: data?.monthTxCount ?? 0,
        format: (v: number) => new Intl.NumberFormat('id-ID').format(v),
        icon: ArrowLeftRight,
        gradient: 'from-emerald-600 to-green-500',
        shadow: 'shadow-emerald-600/20',
        change: null,
      },
      {
        label: 'Rata-rata Nilai Transaksi',
        value: data?.avgTxValue ?? 0,
        format: formatRp,
        icon: Calculator,
        gradient: 'from-green-500 to-lime-500',
        shadow: 'shadow-green-500/20',
        change: null,
      },
    ],
    [data],
  );

  const maxProductQty = useMemo(
    () => Math.max(...(data?.topProducts?.map((p: { totalQty: number }) => p.totalQty) ?? [1]), 1),
    [data],
  );

  if (isLoading) return <DashboardSkeleton />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={item}>
            <Card className="glass-card card-elevated hover-glow-border hover-lift-surface transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {kpi.label}
                    </p>
                    <AnimatedCounter
                      value={kpi.value}
                      formatFn={kpi.format}
                      className="text-2xl font-bold tabular-nums"
                    />
                    {kpi.change !== null && (
                      <div className="flex items-center gap-1 mt-1">
                        {kpi.change >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            kpi.change >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {kpi.change >= 0 ? '+' : ''}
                          {kpi.change}% vs kemarin
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.gradient} shadow-lg ${kpi.shadow}`}
                  >
                    <kpi.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="glass-card card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Tren Pendapatan 7 Hari</CardTitle>
              <CardDescription>Pendapatan & jumlah transaksi harian</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
                <AreaChart data={data?.revenueTrend ?? []} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    yAxisId="revenue"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatShortRp}
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    width={60}
                  />
                  <YAxis
                    yAxisId="count"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    width={40}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-1)"
                    fill="url(#fillRevenue)"
                    strokeWidth={2}
                  />
                  <Bar
                    yAxisId="count"
                    dataKey="count"
                    fill="var(--chart-2)"
                    opacity={0.6}
                    radius={[4, 4, 0, 0]}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Outlet Comparison */}
        <motion.div variants={item}>
          <Card className="glass-card card-elevated h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Perbandingan Outlet</CardTitle>
              <CardDescription>Pendapatan per outlet bulan ini</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ChartContainer config={outletChartConfig} className="h-[280px] w-full">
                <BarChart
                  data={data?.outletComparison ?? []}
                  layout="vertical"
                  margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatShortRp}
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    type="category"
                    dataKey="outletName"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    width={90}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top 5 Products */}
        <motion.div variants={item}>
          <Card className="glass-card card-elevated">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4.5 w-4.5 text-emerald-500" />
                <CardTitle className="text-base font-semibold">Top 5 Produk Terlaris</CardTitle>
              </div>
              <CardDescription>Berdasarkan jumlah terjual bulan ini</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.topProducts ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada data penjualan</p>
              ) : (
                (data?.topProducts ?? []).map(
                  (p: { name: string; totalQty: number; totalRevenue: number }, idx: number) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate mr-2">
                          <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>
                          {p.name}
                        </span>
                        <span className="text-muted-foreground tabular-nums whitespace-nowrap">
                          {p.totalQty} unit · {formatRp(p.totalRevenue)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${(p.totalQty / maxProductQty) * 100}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                        />
                      </div>
                    </div>
                  ),
                )
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={item}>
          <Card className="glass-card card-elevated">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-4.5 w-4.5 text-emerald-500" />
                <CardTitle className="text-base font-semibold">Transaksi Terbaru</CardTitle>
              </div>
              <CardDescription>10 transaksi terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[320px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header-enhanced">
                      <TableHead className="text-xs">Invoice</TableHead>
                      <TableHead className="text-xs">Pelanggan</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.recentTransactions ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-8">
                          Belum ada transaksi
                        </TableCell>
                      </TableRow>
                    ) : (
                      (data?.recentTransactions ?? []).map(
                        (tx: {
                          id: string;
                          invoiceNo: string;
                          customerName: string | null;
                          totalAmount: number;
                          status: string;
                          createdAt: string;
                        }) => {
                          const st = statusMap[tx.status] ?? { label: tx.status, variant: 'secondary' as const };
                          return (
                            <TableRow key={tx.id} className="table-stripe">
                              <TableCell className="text-xs font-mono">{tx.invoiceNo}</TableCell>
                              <TableCell className="text-xs">
                                {tx.customerName ?? 'Umum'}
                              </TableCell>
                              <TableCell className="text-xs text-right font-medium tabular-nums">
                                {formatRp(tx.totalAmount)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={st.variant} className="text-[10px] px-1.5 py-0">
                                  {st.label}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        },
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Aksi Cepat</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="gap-2 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                onClick={() => useAppStore.getState().setActivePage('kasir')}
              >
                <Plus className="h-4 w-4" />
                Buat Transaksi
              </Button>
              <Button
                variant="outline"
                className="gap-2 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                onClick={() => useAppStore.getState().setActivePage('produk')}
              >
                <Package className="h-4 w-4" />
                Kelola Produk
              </Button>
              <Button
                variant="outline"
                className="gap-2 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                onClick={() => useAppStore.getState().setActivePage('reports')}
              >
                <BarChart3 className="h-4 w-4" />
                Lihat Laporan
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-5">
              <Skeleton className="h-3 w-28 mb-3" />
              <Skeleton className="h-7 w-36 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <Skeleton className="h-5 w-36 mb-4" />
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="glass-card"><CardContent className="p-6"><Skeleton className="h-[200px] w-full" /></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-6"><Skeleton className="h-[200px] w-full" /></CardContent></Card>
      </div>
    </div>
  );
}
