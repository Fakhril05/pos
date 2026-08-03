'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Download,
  Filter,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowLeftRight,
  ChevronDown,
  Copy,
  CalendarDays,
  CreditCard,
  User,
  Store,
  Receipt,
  CircleDot,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

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
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatShortDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// ── Status Config ────────────────────────────────────────────────────────────

const STATUS_MAP: Record<
  string,
  { label: string; color: string; bgClass: string; icon: React.ElementType }
> = {
  success: {
    label: 'Berhasil',
    color: 'text-emerald-700',
    bgClass:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  pending: {
    label: 'Menunggu',
    color: 'text-amber-700',
    bgClass:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
    icon: Clock,
  },
  failed: {
    label: 'Gagal',
    color: 'text-red-700',
    bgClass:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
    icon: XCircle,
  },
  expired: {
    label: 'Kedaluwarsa',
    color: 'text-gray-600',
    bgClass:
      'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
    icon: AlertTriangle,
  },
  refunded: {
    label: 'Refund',
    color: 'text-blue-700',
    bgClass:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800',
    icon: RotateCcw,
  },
};

// ── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  invoiceNo: string;
  amount: number;
  fee: number;
  netAmount: number;
  paymentMethod: string;
  paymentChannel: string;
  status: string;
  description: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  paidAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  merchant: { id: string; name: string; logo: string | null };
  customer: { id: string; name: string; email: string } | null;
}

interface TransactionsResponse {
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface StatusCount {
  status: string;
  count: number;
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending;
  const Icon = s.icon;
  return (
    <Badge variant="outline" className={`${s.bgClass} gap-1.5 font-medium`}>
      <Icon className="h-3 w-3" />
      {s.label}
    </Badge>
  );
}

// ── Timeline Item ────────────────────────────────────────────────────────────

interface TimelineEvent {
  label: string;
  date: string;
  icon: React.ElementType;
  color: string;
}

function buildTimeline(tx: Transaction): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      label: 'Transaksi dibuat',
      date: tx.createdAt,
      icon: Receipt,
      color: 'text-emerald-500',
    },
  ];
  if (tx.paidAt) {
    events.push({
      label: 'Pembayaran diterima',
      date: tx.paidAt,
      icon: CheckCircle2,
      color: 'text-emerald-500',
    });
  }
  if (tx.expiredAt && (tx.status === 'expired' || tx.status === 'failed')) {
    events.push({
      label: 'Transaksi kedaluwarsa',
      date: tx.expiredAt,
      icon: AlertTriangle,
      color: 'text-gray-500',
    });
  }
  if (tx.status === 'failed') {
    events.push({
      label: 'Transaksi gagal',
      date: tx.updatedAt,
      icon: XCircle,
      color: 'text-red-500',
    });
  }
  if (tx.status === 'refunded') {
    events.push({
      label: 'Refund diproses',
      date: tx.updatedAt,
      icon: RotateCcw,
      color: 'text-blue-500',
    });
  }
  return events;
}

function TimelineItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const Icon = event.icon;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ${event.color}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>
      <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
        <p className="text-sm font-medium">{event.label}</p>
        <p className="text-muted-foreground text-xs">{formatDate(event.date)}</p>
      </div>
    </div>
  );
}

// ── Transaction Detail Dialog ────────────────────────────────────────────────

function TransactionDetailDialog({
  tx,
  open,
  onOpenChange,
}: {
  tx: Transaction | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [refunding, setRefunding] = useState(false);

  const timeline = useMemo(() => (tx ? buildTimeline(tx) : []), [tx]);

  const handleRefund = async () => {
    if (!tx) return;
    setRefunding(true);
    try {
      const res = await fetch(`/api/transactions/${tx.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: tx.amount, reason: 'Permintaan refund dari dashboard' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Gagal memproses refund' }));
        throw new Error(err.error || 'Gagal memproses refund');
      }
      toast.success('Refund berhasil diajukan');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memproses refund');
    } finally {
      setRefunding(false);
    }
  };

  const handleCopyInvoice = () => {
    if (tx) {
      navigator.clipboard.writeText(tx.invoiceNo);
      toast.success('Nomor invoice disalin');
    }
  };

  if (!tx) return null;

  const statusInfo = STATUS_MAP[tx.status] ?? STATUS_MAP.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50">
              <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-base">Detail Transaksi</DialogTitle>
              <DialogDescription>
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  {tx.invoiceNo}
                  <button
                    onClick={handleCopyInvoice}
                    className="inline-flex hover:text-foreground transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status Banner */}
          <div
            className={`flex items-center gap-3 rounded-lg border p-4 ${statusInfo.bgClass}`}
          >
            <StatusIcon className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">Status: {statusInfo.label}</p>
              <p className="text-xs opacity-80">
                {tx.status === 'success'
                  ? 'Pembayaran telah berhasil diterima'
                  : tx.status === 'pending'
                    ? 'Menunggu pembayaran dari pelanggan'
                    : tx.status === 'failed'
                      ? 'Pembayaran gagal diproses'
                      : tx.status === 'expired'
                        ? 'Batas waktu pembayaran telah habis'
                        : 'Dana telah dikembalikan ke pelanggan'}
              </p>
            </div>
          </div>

          {/* Amount Section */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
              Jumlah Pembayaran
            </p>
            <p className="text-2xl font-bold tracking-tight">{formatRp(tx.amount)}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>
                Biaya Admin: <span className="font-medium text-foreground">{formatRp(tx.fee)}</span>
              </span>
              <span>
                Jumlah Bersih: <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatRp(tx.netAmount)}</span>
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem
              icon={Store}
              label="Merchant"
              value={tx.merchant.name}
            />
            <DetailItem
              icon={User}
              label="Pelanggan"
              value={tx.customerName || tx.customer?.name || '-'}
            />
            <DetailItem
              icon={CreditCard}
              label="Metode Pembayaran"
              value={tx.paymentMethod}
            />
            <DetailItem
              icon={CircleDot}
              label="Saluran"
              value={tx.paymentChannel}
            />
            <DetailItem
              icon={CalendarDays}
              label="Tanggal Dibuat"
              value={formatDate(tx.createdAt)}
            />
            {tx.paidAt && (
              <DetailItem
                icon={CheckCircle2}
                label="Tanggal Dibayar"
                value={formatDate(tx.paidAt)}
              />
            )}
            {tx.customerEmail && (
              <DetailItem
                icon={Receipt}
                label="Email Pelanggan"
                value={tx.customerEmail}
              />
            )}
            {tx.customerPhone && (
              <DetailItem
                icon={Receipt}
                label="Telepon Pelanggan"
                value={tx.customerPhone}
              />
            )}
            {tx.description && (
              <div className="sm:col-span-2">
                <DetailItem
                  icon={Receipt}
                  label="Deskripsi"
                  value={tx.description}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Timeline</h4>
            <div>
              {timeline.map((event, idx) => (
                <TimelineItem
                  key={idx}
                  event={event}
                  isLast={idx === timeline.length - 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Refund button */}
        {tx.status === 'success' && (
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={refunding}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {refunding ? 'Memproses...' : 'Proses Refund'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function TransactionsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter bar skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Skeleton className="h-9 w-full lg:w-72" />
            <Skeleton className="h-9 w-full lg:w-36" />
            <Skeleton className="h-9 w-full lg:w-36" />
            <Skeleton className="h-9 w-full lg:w-36" />
            <Skeleton className="h-9 w-full lg:w-36" />
            <Skeleton className="h-9 w-full lg:w-28" />
          </div>
        </CardContent>
      </Card>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Table skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination skeleton */}
      <div className="flex justify-center">
        <Skeleton className="h-9 w-72" />
      </div>
    </div>
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

// ── Main Component ───────────────────────────────────────────────────────────

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const limit = 10;

  const buildQueryParams = useCallback(
    (overrides?: { page?: number; status?: string; search?: string }) => {
      const params = new URLSearchParams();
      params.set('page', String(overrides?.page ?? page));
      params.set('limit', String(limit));
      const s = overrides?.search ?? search;
      if (s) params.set('search', s);
      const st = overrides?.status ?? status;
      if (st && st !== 'all') params.set('status', st);
      if (paymentMethod && paymentMethod !== 'all')
        params.set('paymentMethod', paymentMethod);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return params.toString();
    },
    [page, search, status, paymentMethod, dateFrom, dateTo],
  );

  const { data, isLoading, error } = useQuery<TransactionsResponse>({
    queryKey: ['transactions', page, search, status, paymentMethod, dateFrom, dateTo],
    queryFn: () => {
      const qs = buildQueryParams();
      return fetch(`/api/transactions?${qs}`).then((r) => r.json());
    },
    staleTime: 15_000,
  });

  // Fetch status counts (always use no filters except what's needed)
  const { data: statusCountsData } = useQuery<StatusCount[]>({
    queryKey: ['transactions-status-counts', search, paymentMethod, dateFrom, dateTo],
    queryFn: async () => {
      // We query the same endpoint but with different pages to get counts via pagination.total
      // More efficient: just get all statuses in parallel
      const statuses = ['success', 'pending', 'failed', 'expired', 'refunded'];
      const baseParams = new URLSearchParams();
      baseParams.set('limit', '1');
      baseParams.set('page', '1');
      if (search) baseParams.set('search', search);
      if (paymentMethod && paymentMethod !== 'all')
        baseParams.set('paymentMethod', paymentMethod);
      if (dateFrom) baseParams.set('dateFrom', dateFrom);
      if (dateTo) baseParams.set('dateTo', dateTo);

      const results = await Promise.all(
        statuses.map(async (s) => {
          const params = new URLSearchParams(baseParams);
          params.set('status', s);
          const res = await fetch(`/api/transactions?${params.toString()}`);
          const json = await res.json();
          return { status: s, count: json.pagination?.total ?? 0 };
        }),
      );
      return results;
    },
    staleTime: 15_000,
  });

  const transactions = data?.data ?? [];
  const pagination = data?.pagination;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value);
    setPage(1);
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setPage(1);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setPage(1);
  };

  const handleStatusCardClick = (s: string) => {
    if (status === s) {
      setStatus('all');
    } else {
      setStatus(s);
    }
    setPage(1);
  };

  const handleExportCSV = () => {
    const qs = buildQueryParams();
    window.open(`/api/transactions?export=csv&${qs}`, '_blank');
    toast.success('File CSV sedang diunduh');
  };

  const handleRowClick = (tx: Transaction) => {
    setSelectedTx(tx);
    setDialogOpen(true);
  };

  const statusCards = [
    {
      key: 'success',
      label: 'Berhasil',
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-400',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      textColor: 'text-emerald-700 dark:text-emerald-400',
    },
    {
      key: 'pending',
      label: 'Menunggu',
      icon: Clock,
      gradient: 'from-amber-500 to-orange-400',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-700 dark:text-amber-400',
    },
    {
      key: 'failed',
      label: 'Gagal',
      icon: XCircle,
      gradient: 'from-red-500 to-rose-400',
      bgLight: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-700 dark:text-red-400',
    },
    {
      key: 'expired',
      label: 'Kedaluwarsa',
      icon: AlertTriangle,
      gradient: 'from-gray-500 to-slate-400',
      bgLight: 'bg-gray-50 dark:bg-gray-900/30',
      borderColor: 'border-gray-200 dark:border-gray-700',
      textColor: 'text-gray-600 dark:text-gray-400',
    },
    {
      key: 'refunded',
      label: 'Refund',
      icon: RotateCcw,
      gradient: 'from-blue-500 to-sky-400',
      bgLight: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-400',
    },
  ];

  const getStatusCount = (key: string) =>
    statusCountsData?.find((s) => s.status === key)?.count ?? 0;

  const pageRange = useMemo(() => {
    if (!pagination) return [];
    return getPaginationRange(pagination.page, pagination.totalPages);
  }, [pagination]);

  if (isLoading) return <TransactionsSkeleton />;
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <XCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">
          Gagal memuat data transaksi. Silakan coba lagi.
        </p>
        <Button
          variant="outline"
          onClick={() =>
            window.location.reload()
          }
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ─── Filter Bar ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="shadow-sm card-hover">
          <CardContent className="p-4">
            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-3 lg:flex-row lg:items-center"
            >
              {/* Search */}
              <div className="relative flex-1 lg:max-w-xs">
                <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Cari invoice, pelanggan, merchant..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status Filter */}
              <Select
                value={status}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="success">Berhasil</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="failed">Gagal</SelectItem>
                  <SelectItem value="expired">Kedaluwarsa</SelectItem>
                  <SelectItem value="refunded">Refund</SelectItem>
                </SelectContent>
              </Select>

              {/* Payment Method Filter */}
              <Select
                value={paymentMethod}
                onValueChange={handlePaymentMethodChange}
              >
                <SelectTrigger className="w-full lg:w-44">
                  <SelectValue placeholder="Metode Pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Metode</SelectItem>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                  <SelectItem value="Virtual Account">Virtual Account</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                </SelectContent>
              </Select>

              {/* Date From */}
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="w-full lg:w-40"
                placeholder="Dari tanggal"
              />

              {/* Date To */}
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="w-full lg:w-40"
                placeholder="Sampai tanggal"
              />

              {/* Export Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleExportCSV}
                className="w-full gap-2 lg:w-auto btn-press"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Ekspor CSV</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Stats Summary Bar ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {statusCards.map((card) => {
            const count = getStatusCount(card.key);
            const isActive = status === card.key;
            const Icon = card.icon;
            return (
              <motion.button
                key={card.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStatusCardClick(card.key)}
                className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 ${
                  isActive
                    ? `${card.bgLight} ${card.borderColor} ring-2 ring-offset-1 ring-offset-background ${card.textColor.replace('text-', 'ring-')}`
                    : 'bg-card hover:border-border/80 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isActive ? `bg-gradient-to-br ${card.gradient}` : 'bg-muted'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          isActive ? 'text-white' : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-lg font-bold leading-none">{count}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isActive ? card.textColor : 'text-muted-foreground'
                        }`}
                      >
                        {card.label}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <div
                      className={`h-2 w-2 rounded-full bg-gradient-to-br ${card.gradient}`}
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ─── Transactions Table ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="shadow-sm card-hover">
          <CardContent className="p-0">
            {/* Table Header Info */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-semibold">Daftar Transaksi</h3>
                <span className="text-muted-foreground text-xs">
                  ({pagination?.total?.toLocaleString('id-ID')} transaksi)
                </span>
              </div>
              <div className="text-muted-foreground text-xs">
                Halaman {pagination?.page} dari {pagination?.totalPages}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Invoice</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Biaya</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Saluran</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="h-40 text-center"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Search className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-muted-foreground text-sm">
                              Tidak ada transaksi ditemukan
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Coba ubah filter atau kata kunci pencarian
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx) => (
                        <motion.tr
                          key={tx.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.2 }}
                          className="group cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50 table-row-hover"
                          onClick={() => handleRowClick(tx)}
                        >
                          <TableCell className="pl-4">
                            <span className="font-mono text-xs font-medium">
                              {tx.invoiceNo}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                                <Store className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <span className="max-w-[120px] truncate text-sm">
                                {tx.merchant.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {tx.customerName ||
                                tx.customer?.name ||
                                '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold">
                              {formatRp(tx.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-muted-foreground text-xs">
                              {formatRp(tx.fee)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <CreditCard className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{tx.paymentMethod}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {tx.paymentChannel}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={tx.status} />
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {formatShortDate(tx.createdAt)}
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
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-muted-foreground text-xs">
                  Menampilkan {(pagination.page - 1) * pagination.limit + 1}
                  –{Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                  dari {pagination.total} transaksi
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.page > 1) setPage(pagination.page - 1);
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

      {/* ─── Detail Dialog ───────────────────────────────────────────── */}
      <TransactionDetailDialog
        tx={selectedTx}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
