'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Store,
  Search,
  Copy,
  Check,
  Mail,
  Phone,
  Key,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Banknote,
  X,
  Plus,
  MapPin,
  Loader2,
  DollarSign,
  ArrowLeftRight,
  TrendingUp,
  Eye,
  EyeOff,
  Link2,
  Receipt,
} from 'lucide-react';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/app/page-header';
import { AnimatedCounter } from '@/components/app/animated-counter';
import { EmptyState } from '@/components/app/empty-state';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const maskKey = (key: string) =>
  key.length > 12
    ? key.slice(0, 8) + '••••' + key.slice(-4)
    : key.slice(0, 4) + '••••' + key.slice(-4);

const statusLabel: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Nonaktif',
};

const statusColor: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  inactive: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

const txStatusLabel: Record<string, string> = {
  success: 'Berhasil',
  pending: 'Menunggu',
  failed: 'Gagal',
  expired: 'Kedaluwarsa',
  refunded: 'Refund',
};

const txStatusColor: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  expired: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  refunded: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
};

const paymentLinkStatusLabel: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Nonaktif',
  expired: 'Kedaluwarsa',
};

const paymentLinkStatusColor: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  expired: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const formatDateTime = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ─── Chart Config ──────────────────────────────────────────────────────────

const revenueChartConfig = {
  revenue: {
    label: 'Pendapatan',
    color: 'oklch(0.6 0.15 160)',
  },
} satisfies ChartConfig;

// ─── Types ─────────────────────────────────────────────────────────────────

interface Merchant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  logo: string | null;
  status: string;
  apiKey: string;
  totalSales: number;
  totalTx: number;
  createdAt: string;
  updatedAt: string;
  _count: { transactions: number; paymentLinks: number; payouts: number };
}

interface MerchantDetail extends Merchant {
  transactions: {
    id: string;
    invoiceNo: string;
    amount: number;
    fee: number;
    status: string;
    paymentMethod: string;
    paymentChannel: string;
    createdAt: string;
    customerName: string | null;
    customer: { id: string; name: string; email: string } | null;
  }[];
  paymentLinks: {
    id: string;
    title: string;
    amount: number;
    status: string;
    type: string;
    soldQty: number;
    maxQty: number;
    createdAt: string;
  }[];
  successRate: number;
  avgAmount: number;
  monthlyRevenue: { month: string; revenue: number }[];
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function Merchants() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // ── Fetch paginated merchants ──
  const { data, isLoading, isError } = useQuery({
    queryKey: ['merchants', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '9',
      });
      if (search) params.set('search', search);
      const res = await fetch(`/api/merchants?${params}`);
      if (!res.ok) throw new Error('Gagal memuat data merchant');
      const json = await res.json();
      return json as {
        data: Merchant[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    },
    staleTime: 15_000,
  });

  // ── Fetch stats (all merchants) ──
  const { data: allMerchants } = useQuery({
    queryKey: ['merchants-stats'],
    queryFn: async () => {
      const res = await fetch('/api/merchants?limit=9999');
      if (!res.ok) throw new Error('Gagal memuat statistik');
      const json = await res.json();
      return json.data as Merchant[];
    },
    staleTime: 30_000,
  });

  // ── Fetch merchant detail ──
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['merchant-detail', selectedMerchantId],
    queryFn: async () => {
      const res = await fetch(`/api/merchants/${selectedMerchantId}`);
      if (!res.ok) throw new Error('Gagal memuat detail merchant');
      const json = await res.json();
      return json.data as MerchantDetail;
    },
    enabled: !!selectedMerchantId && sheetOpen,
    staleTime: 10_000,
  });

  const detail = detailData ?? null;

  const stats = useMemo(() => {
    if (!allMerchants) return { total: 0, active: 0, revenue: 0 };
    const total = allMerchants.length;
    const active = allMerchants.filter((m) => m.status === 'active').length;
    const revenue = allMerchants.reduce((s, m) => s + m.totalSales, 0);
    return { total, active, revenue };
  }, [allMerchants]);

  const merchants = data?.data ?? [];
  const pagination = data?.pagination;

  // ── Create Merchant Mutation ──
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (body: { name: string; email: string; phone?: string; address?: string }) =>
      fetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e.error));
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      queryClient.invalidateQueries({ queryKey: ['merchants-stats'] });
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', phone: '', address: '' });
      toast.success('Merchant berhasil ditambahkan');
    },
    onError: (err: string) => {
      toast.error(err || 'Gagal menambahkan merchant');
    },
  });

  const handleSubmitCreate = useCallback(() => {
    if (!createForm.name.trim()) {
      toast.error('Nama merchant wajib diisi');
      return;
    }
    if (!createForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      toast.error('Format email tidak valid');
      return;
    }
    createMutation.mutate({
      name: createForm.name.trim(),
      email: createForm.email.trim(),
      phone: createForm.phone.trim() || undefined,
      address: createForm.address.trim() || undefined,
    });
  }, [createForm, createMutation]);

  // ── Handlers ──
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleCopyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    toast.success('API Key berhasil disalin');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenDetail = useCallback((id: string) => {
    setSelectedMerchantId(id);
    setShowApiKey(false);
    setSheetOpen(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    setSelectedMerchantId(null);
    setShowApiKey(false);
  }, []);

  // ── Page range for pagination ──
  const pageRange = useMemo(() => {
    if (!pagination) return [];
    const { page: p, totalPages: tp } = pagination;
    const pages: (number | 'ellipsis')[] = [];
    if (tp <= 7) {
      for (let i = 1; i <= tp; i++) pages.push(i);
    } else {
      pages.push(1);
      if (p > 3) pages.push('ellipsis');
      const start = Math.max(2, p - 1);
      const end = Math.min(tp - 1, p + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (p < tp - 2) pages.push('ellipsis');
      pages.push(tp);
    }
    return pages;
  }, [pagination]);

  // ─── Render ───────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Store className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Gagal memuat data merchant</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-mesh">
      <PageHeader
        title="Merchant"
        description="Kelola merchant dan konfigurasi pembayaran"
        icon={Store}
        iconGradient="amber"
      >
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white btn-press"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Tambah Merchant</span>
        </Button>
      </PageHeader>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Merchant', value: stats.total.toLocaleString('id-ID'), icon: Store, gradient: 'from-emerald-500 to-teal-500' },
          { label: 'Merchant Aktif', value: stats.active.toLocaleString('id-ID'), icon: ArrowUpRight, gradient: 'from-emerald-600 to-green-500' },
          { label: 'Total Pendapatan Merchant', value: formatMoney(stats.revenue), icon: Banknote, gradient: 'from-teal-500 to-emerald-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow card-hover">
              <CardContent className="p-4 sm:p-6 flex items-center gap-4">
                <div className={`flex-shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>{
                  <stat.icon className="h-5 w-5 text-white" />
                }</div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-lg font-bold truncate">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Search + Add ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <form onSubmit={handleSearch} className="flex flex-1 gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau email merchant..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white btn-press">
            <Search className="h-4 w-4 mr-2" />
            Cari
          </Button>
        </form>

      </motion.div>

      {/* ── Active search indicator ── */}
      <AnimatePresence>
        {search && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Badge variant="secondary" className="gap-1 pr-1">
              &ldquo;{search}&rdquo;
              <button onClick={handleClearSearch} className="ml-1 rounded-full p-0.5 hover:bg-muted">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cards Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-1.5 w-full" />
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-4 pt-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : merchants.length === 0 ? (
        <EmptyState
          title="Tidak ada merchant ditemukan"
          description="Coba ubah kata kunci pencarian"
          icon="merchant"
          actionLabel={(!search) ? 'Tambah' : undefined}
          onAction={(!search) ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {merchants.map((m, i) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Card
                  className="overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group card-hover"
                  onClick={() => handleOpenDetail(m.id)}
                >
                  {/* Gradient top border */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${m.status === 'active' ? 'from-emerald-400 via-emerald-500 to-teal-400' : 'from-gray-300 via-gray-400 to-gray-300'}`} />
                  <CardContent className="p-5 space-y-3.5">
                    {/* Name + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3
                          className="font-semibold text-sm truncate text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(m.id);
                          }}
                        >
                          {m.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </div>
                      </div>
                      <Badge className={`text-[10px] px-2 py-0.5 flex-shrink-0 ${statusColor[m.status] || ''}`}>
                        {statusLabel[m.status] || m.status}
                      </Badge>
                    </div>

                    {/* Phone */}
                    {m.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span>{m.phone}</span>
                      </div>
                    )}

                    {/* API Key */}
                    <div className="flex items-center gap-2">
                      <Key className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate">
                        {maskKey(m.apiKey)}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyKey(m.id, m.apiKey);
                        }}
                        className="flex-shrink-0 text-muted-foreground hover:text-emerald-600 transition-colors"
                        aria-label="Salin API Key"
                      >
                        {copiedId === m.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    <Separator />

                    {/* Sales & Transactions */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3 w-3 text-emerald-600" />
                        <span className="font-semibold text-emerald-600">{formatMoney(m.totalSales)}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {m._count.transactions.toLocaleString('id-ID')} transaksi
                      </span>
                    </div>

                    {/* Created date */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3 flex-shrink-0" />
                      <span>Bergabung {formatDate(m.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="space-y-3">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                />
              </PaginationItem>
              {pageRange.map((p, i) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`e${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => setPage(p as number)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className={page === pagination.totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <p className="text-center text-sm text-muted-foreground">
            Menampilkan {(page - 1) * pagination.limit + 1}&ndash;{Math.min(page * pagination.limit, pagination.total)} dari {pagination.total} merchant
          </p>
        </div>
      )}

      {/* ── Merchant Detail Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={handleCloseSheet}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden">
          {detailLoading ? (
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="rounded-xl border p-3">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
              <Separator />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
              <Separator />
              <Skeleton className="h-[120px] w-full rounded-xl" />
              <Separator />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
              <Separator />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : detail ? (
            <div className="flex h-full flex-col">
              {/* ── Drawer Header ─────────────────────────────────── */}
              <SheetHeader className="border-b px-6 py-5 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white text-lg font-bold shadow-lg">
                    {detail.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-lg truncate">
                      {detail.name}
                    </SheetTitle>
                    <SheetDescription className="truncate">
                      {detail.email}
                    </SheetDescription>
                  </div>
                  <Badge
                    className={`text-xs shrink-0 ${statusColor[detail.status] || ''}`}
                  >
                    {statusLabel[detail.status] || detail.status}
                  </Badge>
                </div>

                {/* API Key */}
                <div className="mt-3 rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <Key className="h-3 w-3" />
                    API Key
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1.5 rounded font-mono flex-1 break-all">
                      {showApiKey ? detail.apiKey : maskKey(detail.apiKey)}
                    </code>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label={showApiKey ? 'Sembunyikan API Key' : 'Tampilkan API Key'}
                    >
                      {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
                      onClick={() => handleCopyKey(detail.id, detail.apiKey)}
                    >
                      {copiedId === detail.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </SheetHeader>

              {/* ── Scrollable Content ─────────────────────────────── */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="space-y-6 p-6">
                  {/* ── Stats Section (2x2 grid) ─────────────────── */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    {/* Total Penjualan */}
                    <div className="card-elevated rounded-xl p-3.5">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-400">
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-muted-foreground text-[11px] font-medium">Total Penjualan</p>
                      <p className="mt-0.5 text-sm font-bold">
                        <AnimatedCounter
                          value={detail.totalSales}
                          formatFn={(v) => formatMoney(v)}
                          duration={800}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                      </p>
                    </div>

                    {/* Total Transaksi */}
                    <div className="card-elevated rounded-xl p-3.5">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-400">
                        <ArrowLeftRight className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-muted-foreground text-[11px] font-medium">Total Transaksi</p>
                      <p className="mt-0.5 text-sm font-bold">
                        <AnimatedCounter
                          value={detail.totalTx}
                          duration={800}
                        />
                      </p>
                    </div>

                    {/* Tingkat Keberhasilan */}
                    <div className="card-elevated rounded-xl p-3.5">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-400">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-muted-foreground text-[11px] font-medium">Tingkat Keberhasilan</p>
                      <p className="mt-0.5 text-sm font-bold">
                        <AnimatedCounter
                          value={detail.successRate}
                          duration={800}
                          suffix="%"
                        />
                      </p>
                    </div>

                    {/* Rata-rata Transaksi */}
                    <div className="card-elevated rounded-xl p-3.5">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-400">
                        <CreditCard className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-muted-foreground text-[11px] font-medium">Rata-rata Transaksi</p>
                      <p className="mt-0.5 text-sm font-bold">
                        <AnimatedCounter
                          value={Math.round(detail.avgAmount)}
                          formatFn={(v) => formatMoney(v)}
                          duration={800}
                          className="text-rose-600 dark:text-rose-400"
                        />
                      </p>
                    </div>
                  </motion.div>

                  {/* ── Contact Info Section ────────────────────────── */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="space-y-3"
                  >
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Informasi Kontak
                    </h4>
                    <div className="rounded-xl border p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted-foreground text-[11px]">Email</p>
                          <p className="text-sm font-medium truncate">{detail.email}</p>
                        </div>
                      </div>
                      {detail.phone && (
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-muted-foreground text-[11px]">Telepon</p>
                            <p className="text-sm font-medium">{detail.phone}</p>
                          </div>
                        </div>
                      )}
                      {detail.address && (
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-muted-foreground text-[11px]">Alamat</p>
                            <p className="text-sm font-medium">{detail.address}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted-foreground text-[11px]">Bergabung Sejak</p>
                          <p className="text-sm font-medium">{formatDate(detail.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* ── Revenue Chart ────────────────────────────────── */}
                  {detail.monthlyRevenue && detail.monthlyRevenue.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 }}
                    >
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Pendapatan Bulanan
                      </h4>
                      <div className="rounded-xl border p-4">
                        <ChartContainer
                          config={revenueChartConfig}
                          className="h-[120px] w-full"
                        >
                          <AreaChart data={detail.monthlyRevenue} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                            <defs>
                              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="oklch(0.6 0.15 160)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="oklch(0.6 0.15 160)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="month"
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v: string) => {
                                const [, m] = v.split('-');
                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                                return months[parseInt(m, 10) - 1] ?? m;
                              }}
                              className="text-[10px]"
                              interval={0}
                            />
                            <YAxis tickLine={false} axisLine={false} className="text-[10px]" />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  labelFormatter={(label: string) => {
                                    const parts = label.split('-');
                                    const m = parseInt(parts[1], 10);
                                    const y = parts[0];
                                    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                                    return `${months[m - 1]} ${y}`;
                                  }}
                                  formatter={(value: number) => formatMoney(value)}
                                />
                              }
                            />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="var(--color-revenue)"
                              fill="url(#revenueGradient)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ChartContainer>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Payment Links Section ────────────────────────── */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Link Pembayaran
                      </h4>
                      <Badge variant="secondary" className="text-[10px]">
                        {detail.paymentLinks.length} link
                      </Badge>
                    </div>

                    {detail.paymentLinks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8">
                        <Link2 className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-muted-foreground text-sm">Belum ada link pembayaran</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {detail.paymentLinks.map((pl, idx) => (
                          <motion.div
                            key={pl.id}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15, delay: idx * 0.03 }}
                            className="card-hover rounded-xl border p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{pl.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    {formatMoney(pl.amount)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {pl.soldQty}/{pl.maxQty} terjual
                                  </span>
                                </div>
                              </div>
                              <Badge className={`text-[10px] px-2 py-0.5 shrink-0 ${paymentLinkStatusColor[pl.status] || ''}`}>
                                {paymentLinkStatusLabel[pl.status] || pl.status}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* ── Recent Transactions Section ──────────────────── */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Transaksi Terbaru
                      </h4>
                      <Badge variant="secondary" className="text-[10px]">
                        {detail._count.transactions} total
                      </Badge>
                    </div>

                    {detail.transactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8">
                        <ArrowLeftRight className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-muted-foreground text-sm">Belum ada transaksi</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border overflow-hidden">
                        <Table>
                          <TableHeader className="table-header-enhanced">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="text-[11px]">Invoice</TableHead>
                              <TableHead className="text-[11px]">Pelanggan</TableHead>
                              <TableHead className="text-[11px] text-right">Jumlah</TableHead>
                              <TableHead className="text-[11px]">Metode</TableHead>
                              <TableHead className="text-[11px]">Status</TableHead>
                              <TableHead className="text-[11px]">Tanggal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detail.transactions.slice(0, 5).map((tx, idx) => (
                              <motion.tr
                                key={tx.id}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.15, delay: idx * 0.03 }}
                                className="table-row-hover border-b last:border-0"
                              >
                                <TableCell className="py-2.5">
                                  <span className="font-mono text-[11px] font-medium">{tx.invoiceNo}</span>
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <span className="text-xs truncate block max-w-[100px]">
                                    {tx.customer?.name || tx.customerName || '-'}
                                  </span>
                                </TableCell>
                                <TableCell className="py-2.5 text-right">
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    {formatMoney(tx.amount)}
                                  </span>
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {tx.paymentMethod}
                                  </span>
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] font-medium px-2 py-0 ${txStatusColor[tx.status] || ''}`}
                                  >
                                    {txStatusLabel[tx.status] || tx.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                    {formatDateTime(tx.createdAt)}
                                  </span>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* ── Action Buttons ─────────────────────────────────── */}
              <div className="shrink-0 border-t px-6 py-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 btn-press"
                  onClick={() => {
                    // Navigate to transactions page
                    const event = new CustomEvent('navigate', { detail: '/transaksi' });
                    window.dispatchEvent(event);
                    handleCloseSheet();
                  }}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Lihat Semua Transaksi
                </Button>
                <Button
                  className="flex-1 btn-press bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    const event = new CustomEvent('navigate', { detail: '/payouts' });
                    window.dispatchEvent(event);
                    handleCloseSheet();
                  }}
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Buat Payout
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* ── Create Merchant Dialog ── */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (!open) setCreateForm({ name: '', email: '', phone: '', address: '' });
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              Tambah Merchant Baru
            </DialogTitle>
            <DialogDescription>
              Isi detail di bawah untuk menambahkan merchant baru ke sistem.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Nama */}
            <div className="grid gap-2">
              <Label htmlFor="create-name">Nama Merchant *</Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="create-name"
                  placeholder="contoh: Toko Sejahtera"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="create-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="create-email"
                  type="email"
                  placeholder="contoh: admin@tokosejahtera.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Telepon */}
            <div className="grid gap-2">
              <Label htmlFor="create-phone">Telepon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="create-phone"
                  placeholder="contoh: 081234567890"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Alamat */}
            <div className="grid gap-2">
              <Label htmlFor="create-address">Alamat</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="create-address"
                  placeholder="contoh: Jl. Sudirman No. 123, Jakarta"
                  value={createForm.address}
                  onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setCreateForm({ name: '', email: '', phone: '', address: '' });
              }}
              disabled={createMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitCreate}
              disabled={createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Tambah Merchant'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
