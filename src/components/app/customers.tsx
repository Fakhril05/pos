'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users,
  Wallet,
  TrendingUp,
  Search,
  Mail,
  Phone,
  ArrowLeftRight,
  CalendarDays,
  MapPin,
  XCircle,
  Plus,
  Bell,
  ShoppingCart,
} from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { PageHeader } from '@/components/app/page-header';
import { AnimatedCounter } from '@/components/app/animated-counter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatRp = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

// ── Types ────────────────────────────────────────────────────────────────────

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  totalSpent: number;
  totalTx: number;
  createdAt: string;
  updatedAt: string;
  _count: { transactions: number };
}

interface CustomerTransaction {
  id: string;
  invoiceNo: string;
  amount: number;
  fee: number;
  netAmount: number;
  paymentMethod: string;
  paymentChannel: string;
  status: string;
  description: string | null;
  paidAt: string | null;
  createdAt: string;
  merchant: { id: string; name: string; logo: string | null };
}

interface MonthlyActivity {
  month: string;
  count: number;
  amount: number;
}

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  totalSpent: number;
  totalTx: number;
  successRate: number;
  lastTransactionDate: string | null;
  createdAt: string;
  updatedAt: string;
  transactions: CustomerTransaction[];
  monthlyActivity: MonthlyActivity[];
}

interface CustomersResponse {
  data: CustomerItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Status Badge ─────────────────────────────────────────────────────────────

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
        'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-800',
    },
  };
  const cfg = map[status] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <Badge
      variant="outline"
      className={`text-[11px] font-medium px-2 py-0.5 ${cfg.className}`}
    >
      {cfg.label}
    </Badge>
  );
}

function PaymentMethodBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    qris: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    ewallet: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    bank_transfer: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
    credit_card: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  };
  const className = map[method] ?? 'bg-muted text-muted-foreground';
  const labelMap: Record<string, string> = {
    qris: 'QRIS',
    ewallet: 'E-Wallet',
    bank_transfer: 'Transfer Bank',
    credit_card: 'Kartu Kredit',
  };
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${className}`}>
      {labelMap[method] ?? method}
    </span>
  );
}

// ── Pagination Helper ────────────────────────────────────────────────────────

function getPaginationRange(current: number, total: number) {
  const delta = 2;
  const range: (number | 'dots')[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push('dots');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push('dots');
  if (total > 1) range.push(total);

  return range;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function CustomersSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search skeleton */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <Skeleton className="h-10 w-full max-w-sm" />
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="border-b px-4 py-3">
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="ml-auto h-4 w-24 hidden sm:block" />
                <Skeleton className="h-4 w-28 hidden md:block" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Skeleton className="h-9 w-72" />
      </div>
    </div>
  );
}

// ── Chart Config ────────────────────────────────────────────────────────────

const activityChartConfig = {
  count: {
    label: 'Jumlah Transaksi',
    color: 'oklch(0.6 0.15 160)',
  },
} satisfies ChartConfig;

// ── Main Component ───────────────────────────────────────────────────────────

export default function Customers() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '' });
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({});

  const limit = 10;

  // ─── Queries ──────────────────────────────────────────────────────────

  // Paginated customer list
  const {
    data: listData,
    isLoading: listLoading,
    error: listError,
  } = useQuery<CustomersResponse>({
    queryKey: ['customers', page, search],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      return fetch(`/api/customers?${params.toString()}`).then((r) =>
        r.json(),
      );
    },
    staleTime: 15_000,
  });

  // Stats query: fetch all customers (no pagination) for accurate aggregates
  const { data: statsData } = useQuery<{ data: CustomerItem[] }>({
    queryKey: ['customers-stats', search],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '9999');
      if (search) params.set('search', search);
      return fetch(`/api/customers?${params.toString()}`).then((r) =>
        r.json(),
      );
    },
    staleTime: 30_000,
  });

  // Customer detail with transactions
  const {
    data: detailData,
    isLoading: detailLoading,
  } = useQuery<{ data: CustomerDetail }>({
    queryKey: ['customer-detail', selectedCustomerId],
    queryFn: () =>
      fetch(`/api/customers/${selectedCustomerId}`).then((r) => r.json()),
    enabled: !!selectedCustomerId && sheetOpen,
    staleTime: 15_000,
  });

  // ─── Mutations ───────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (body: { name: string; email: string; phone?: string }) =>
      fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e.error));
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers-stats'] });
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', phone: '' });
      setFormErrors({});
      toast.success('Pelanggan berhasil ditambahkan');
    },
    onError: (err: string) => {
      toast.error(err || 'Gagal menambahkan pelanggan');
    },
  });

  // ─── Derived ─────────────────────────────────────────────────────────

  const customers = listData?.data ?? [];
  const pagination = listData?.pagination;
  const customerDetail = detailData?.data ?? null;

  const stats = useMemo(() => {
    const items = statsData?.data ?? [];
    const totalCustomers = items.length;
    const totalSpent = items.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
    return { totalCustomers, totalSpent, avgSpent };
  }, [statsData]);

  const pageRange = useMemo(() => {
    if (!pagination) return [];
    return getPaginationRange(pagination.page, pagination.totalPages);
  }, [pagination]);

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleRowClick = useCallback((customer: CustomerItem) => {
    setSelectedCustomerId(customer.id);
    setSheetOpen(true);
  }, []);

  const validateCreateForm = () => {
    const errors: { name?: string; email?: string } = {};
    if (!createForm.name.trim()) errors.name = 'Nama wajib diisi';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!createForm.email.trim()) {
      errors.email = 'Email wajib diisi';
    } else if (!emailRegex.test(createForm.email)) {
      errors.email = 'Format email tidak valid';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = () => {
    if (!validateCreateForm()) return;
    createMutation.mutate({
      name: createForm.name.trim(),
      email: createForm.email.trim(),
      phone: createForm.phone.trim() || undefined,
    });
  };

  // ─── Avatar colors ───────────────────────────────────────────────────

  const avatarColors = [
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400',
    'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
  ];

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  // ─── Render ──────────────────────────────────────────────────────────

  if (listLoading) return <CustomersSkeleton />;
  if (listError || !listData) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <XCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">
          Gagal memuat data pelanggan. Silakan coba lagi.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-mesh">
      <PageHeader
        title="Pelanggan"
        description="Kelola data pelanggan dan riwayat transaksi"
        icon={Users}
        iconGradient="teal"
      >
        <Button
          onClick={() => setCreateOpen(true)}
          className="btn-press bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Tambah Pelanggan</span>
        </Button>
      </PageHeader>

      {/* ─── Stats Row ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {/* Total Pelanggan */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="shadow-sm transition-shadow hover:shadow-md card-hover">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-bold tracking-tight">
                    {stats.totalCustomers.toLocaleString('id-ID')}
                  </p>
                  <p className="text-muted-foreground text-sm">Total Pelanggan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Belanja */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="shadow-sm transition-shadow hover:shadow-md card-hover">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-400">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-bold tracking-tight">
                    {formatRp(stats.totalSpent)}
                  </p>
                  <p className="text-muted-foreground text-sm">Total Belanja</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rata-rata Belanja */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="shadow-sm transition-shadow hover:shadow-md card-hover">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-400">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-bold tracking-tight">
                    {formatRp(stats.avgSpent)}
                  </p>
                  <p className="text-muted-foreground text-sm">Rata-rata Belanja</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ─── Search + Table ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="shadow-sm card-hover card-elevated">
          <CardContent className="p-0">
            {/* Header with search */}
            <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-semibold">Daftar Pelanggan</h3>
                <span className="text-muted-foreground text-xs">
                  ({pagination?.total?.toLocaleString('id-ID')} pelanggan)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <form onSubmit={handleSearch} className="relative w-full sm:w-auto sm:max-w-xs">
                  <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Cari nama, email, telepon..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9"
                  />
                </form>
              </div>
            </div>

            {/* Active search indicator */}
            {search && (
              <div className="flex items-center gap-2 border-b px-4 py-2 bg-muted/30">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground text-xs">
                  Hasil pencarian untuk &ldquo;{search}&rdquo;
                </span>
                <button
                  onClick={() => {
                    setSearch('');
                    setSearchInput('');
                    setPage(1);
                  }}
                  className="ml-auto text-muted-foreground text-xs hover:text-foreground transition-colors"
                  aria-label="Hapus pencarian"
                >
                  ✕ Hapus
                </button>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="table-header-enhanced">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Pelanggan</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Telepon</TableHead>
                    <TableHead className="text-right">Total Transaksi</TableHead>
                    <TableHead className="text-right">Total Belanja</TableHead>
                    <TableHead className="hidden lg:table-cell">Terdaftar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-48 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                              <Users className="h-7 w-7 text-muted-foreground/50" />
                            </div>
                            <p className="text-muted-foreground text-sm font-medium">
                              Tidak ada pelanggan ditemukan
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Coba ubah kata kunci pencarian Anda
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer) => (
                        <motion.tr
                          key={customer.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.2 }}
                          className="group cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50 table-row-hover"
                          onClick={() => handleRowClick(customer)}
                        >
                          {/* Avatar + Name */}
                          <TableCell className="pl-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback
                                  className={`text-xs font-semibold ${getAvatarColor(customer.name)}`}
                                >
                                  {getInitials(customer.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium cursor-pointer text-emerald-600 dark:text-emerald-400 hover:underline">
                                  {customer.name}
                                </p>
                                <p className="text-muted-foreground truncate text-xs sm:hidden">
                                  {customer.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Email */}
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm text-muted-foreground truncate max-w-[180px]">
                                {customer.email}
                              </span>
                            </div>
                          </TableCell>

                          {/* Phone */}
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm text-muted-foreground">
                                {customer.phone || '-'}
                              </span>
                            </div>
                          </TableCell>

                          {/* Total Transaksi */}
                          <TableCell className="text-right">
                            <span className="text-sm font-medium">
                              {customer._count.transactions}
                            </span>
                          </TableCell>

                          {/* Total Belanja */}
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatRp(customer.totalSpent)}
                            </span>
                          </TableCell>

                          {/* Terdaftar */}
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(customer.createdAt)}
                            </span>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
                <p className="text-muted-foreground text-xs">
                  Menampilkan {(pagination.page - 1) * pagination.limit + 1}
                  –{Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{' '}
                  dari {pagination.total} pelanggan
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.page > 1)
                            setPage(pagination.page - 1);
                        }}
                        className={
                          pagination.page <= 1
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                    {pageRange.map((p, idx) =>
                      p === 'dots' ? (
                        <PaginationItem key={`dots-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            href="#"
                            isActive={pagination.page === p}
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(p as number);
                            }}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.page < pagination.totalPages)
                            setPage(pagination.page + 1);
                        }}
                        className={
                          pagination.page >= pagination.totalPages
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Customer Detail Sheet ─────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={(open) => {
        setSheetOpen(open);
        if (!open) setSelectedCustomerId(null);
      }}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden">
          {detailLoading ? (
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
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
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : customerDetail ? (
            <div className="flex h-full flex-col">
              {/* ── Drawer Header ─────────────────────────────────── */}
              <SheetHeader className="border-b px-6 py-5 shrink-0">
                <div className="flex items-center gap-4">
                  <div className={
                    `flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white text-lg font-bold shadow-lg`
                  }>
                    {getInitials(customerDetail.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-lg truncate">
                      {customerDetail.name}
                    </SheetTitle>
                    <SheetDescription className="truncate">
                      {customerDetail.email}
                    </SheetDescription>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 shrink-0">
                    Aktif
                  </Badge>
                </div>
              </SheetHeader>

              {/* ── Scrollable Content ─────────────────────────────── */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="space-y-6 p-6">
                  {/* ── Stats Section ────────────────────────────── */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="grid grid-cols-3 gap-3"
                  >
                    {/* Total Belanja */}
                    <div className="card-elevated rounded-xl p-3.5">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-400">
                        <Wallet className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-muted-foreground text-[11px] font-medium">Total Belanja</p>
                      <p className="mt-0.5 text-sm font-bold">
                        <AnimatedCounter
                          value={customerDetail.totalSpent}
                          formatFn={(v) => formatRp(v)}
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
                          value={customerDetail.totalTx}
                          duration={800}
                        />
                      </p>
                    </div>

                    {/* Rata-rata Belanja */}
                    <div className="card-elevated rounded-xl p-3.5">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-400">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-muted-foreground text-[11px] font-medium">Rata-rata</p>
                      <p className="mt-0.5 text-sm font-bold">
                        <AnimatedCounter
                          value={customerDetail.totalTx > 0 ? Math.round(customerDetail.totalSpent / customerDetail.totalTx) : 0}
                          formatFn={(v) => formatRp(v)}
                          duration={800}
                        />
                      </p>
                    </div>
                  </motion.div>

                  {/* ── Contact Info Section ──────────────────────── */}
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
                          <p className="text-sm font-medium truncate">{customerDetail.email}</p>
                        </div>
                      </div>
                      {customerDetail.phone && (
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-muted-foreground text-[11px]">Telepon</p>
                            <p className="text-sm font-medium">{customerDetail.phone}</p>
                          </div>
                        </div>
                      )}
                      {customerDetail.address && (
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-muted-foreground text-[11px]">Alamat</p>
                            <p className="text-sm font-medium">{customerDetail.address}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted-foreground text-[11px]">Bergabung Sejak</p>
                          <p className="text-sm font-medium">{formatDate(customerDetail.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* ── Activity Chart ────────────────────────────── */}
                  {customerDetail.monthlyActivity && customerDetail.monthlyActivity.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 }}
                    >
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Aktivitas Transaksi
                      </h4>
                      <div className="rounded-xl border p-4">
                        <ChartContainer
                          config={activityChartConfig}
                          className="h-[120px] w-full"
                        >
                          <BarChart data={customerDetail.monthlyActivity} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
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
                                />
                              }
                            />
                            <Bar
                              dataKey="count"
                              fill="var(--color-count)"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={32}
                            />
                          </BarChart>
                        </ChartContainer>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Transaction History ───────────────────────── */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Riwayat Transaksi
                      </h4>
                      <Badge variant="secondary" className="text-[10px]">
                        {customerDetail.totalTx} total
                      </Badge>
                    </div>

                    {customerDetail.transactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10">
                        <ArrowLeftRight className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-muted-foreground text-sm">Belum ada transaksi</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border overflow-hidden">
                        <Table>
                          <TableHeader className="table-header-enhanced">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="text-[11px]">Invoice</TableHead>
                              <TableHead className="text-[11px]">Merchant</TableHead>
                              <TableHead className="text-[11px] text-right">Jumlah</TableHead>
                              <TableHead className="text-[11px]">Metode</TableHead>
                              <TableHead className="text-[11px]">Status</TableHead>
                              <TableHead className="text-[11px]">Tanggal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customerDetail.transactions.map((tx, idx) => (
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
                                  <span className="text-xs truncate block max-w-[100px]">{tx.merchant.name}</span>
                                </TableCell>
                                <TableCell className="py-2.5 text-right">
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    {formatRp(tx.amount)}
                                  </span>
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <PaymentMethodBadge method={tx.paymentMethod} />
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <StatusBadge status={tx.status} />
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatDateTime(tx.createdAt)}</span>
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
                  className="flex-1 btn-press bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => toast.info('Notifikasi dikirim ke ' + customerDetail.name)}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Kirim Notifikasi
                </Button>
                <Button variant="outline" className="flex-1 btn-press">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Buat Transaksi
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* ─── Create Customer Dialog ──────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (!open) {
          setCreateForm({ name: '', email: '', phone: '' });
          setFormErrors({});
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              Tambah Pelanggan Baru
            </DialogTitle>
            <DialogDescription>
              Isi detail di bawah untuk menambahkan pelanggan baru.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Nama */}
            <div className="grid gap-2">
              <Label htmlFor="create-name">Nama *</Label>
              <Input
                id="create-name"
                placeholder="Nama lengkap pelanggan"
                value={createForm.name}
                onChange={(e) => {
                  setCreateForm((f) => ({ ...f, name: e.target.value }));
                  if (formErrors.name) setFormErrors((f) => ({ ...f, name: undefined }));
                }}
                className={formErrors.name ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
              {formErrors.name && (
                <p className="text-xs text-red-500">{formErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="contoh: email@domain.com"
                value={createForm.email}
                onChange={(e) => {
                  setCreateForm((f) => ({ ...f, email: e.target.value }));
                  if (formErrors.email) setFormErrors((f) => ({ ...f, email: undefined }));
                }}
                className={formErrors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
              {formErrors.email && (
                <p className="text-xs text-red-500">{formErrors.email}</p>
              )}
            </div>

            {/* Telepon */}
            <div className="grid gap-2">
              <Label htmlFor="create-phone">Telepon</Label>
              <Input
                id="create-phone"
                placeholder="contoh: 08123456789"
                value={createForm.phone}
                onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createMutation.isPending ? 'Menyimpan...' : 'Tambah Pelanggan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
