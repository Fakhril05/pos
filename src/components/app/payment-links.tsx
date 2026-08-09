'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Link2,
  Plus,
  Search,
  Copy,
  Pencil,
  Trash2,
  Store,
  CalendarDays,
  Clock,
  Layers,
  Tag,
  LinkIcon,
  MoreHorizontal,
  Eye,
  TrendingUp,
  DollarSign,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

const isExpired = (link: PaymentLinkItem) => {
  if (link.status === 'expired') return true;
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) return true;
  return false;
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

const statusBadgeClass: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-800',
  failed: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
  expired: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
};

const statusLabel: Record<string, string> = {
  success: 'Berhasil',
  pending: 'Menunggu',
  failed: 'Gagal',
  expired: 'Kedaluwarsa',
};

const methodBadgeClass: Record<string, string> = {
  qris: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
  ewallet: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800',
  bank_transfer: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-800',
  credit_card: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
};

const methodLabel: Record<string, string> = {
  qris: 'QRIS',
  ewallet: 'E-Wallet',
  bank_transfer: 'Transfer Bank',
  credit_card: 'Kartu Kredit',
};

const drawerStatusBadgeClass: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
  inactive: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
  expired: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
};

const drawerStatusLabel: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Nonaktif',
  expired: 'Kedaluwarsa',
};

// ── Types ────────────────────────────────────────────────────────────────────

interface TransactionDetailItem {
  id: string;
  invoiceNo: string;
  amount: number;
  netAmount: number;
  fee: number;
  paymentMethod: string;
  paymentChannel: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  paidAt: string | null;
  createdAt: string;
  merchant: { id: string; name: string; logo: string | null };
}

interface PaymentLinkDetail {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  merchantId: string;
  status: string;
  type: string;
  maxQty: number;
  soldQty: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  merchant: { id: string; name: string; logo: string | null };
  transactions: TransactionDetailItem[];
  _count: { transactions: number };
}

interface PaymentLinkItem {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  merchantId: string;
  status: string;
  type: string;
  maxQty: number;
  soldQty: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  merchant: { id: string; name: string; logo: string | null };
  _count: { transactions: number };
}

interface MerchantOption {
  id: string;
  name: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Form state type ──────────────────────────────────────────────────────────

type FormData = {
  title: string;
  description: string;
  amount: string;
  merchantId: string;
  type: string;
  maxQty: string;
  expiresAt: string;
};

const emptyForm: FormData = {
  title: '',
  description: '',
  amount: '',
  merchantId: '',
  type: 'single',
  maxQty: '1',
  expiresAt: '',
};

// ── Page range helper ────────────────────────────────────────────────────────

function getPageRange(current: number, total: number) {
  const pages: (number | 'ellipsis')[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('ellipsis');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push('ellipsis');
    pages.push(total);
  }
  return pages;
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const expired = status === 'expired';
  return (
    <Badge
      variant="outline"
      className={
        expired
          ? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700'
          : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
      }
    >
      <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${expired ? 'bg-gray-500' : 'bg-emerald-500'}`} />
      {expired ? 'Kedaluwarsa' : 'Aktif'}
    </Badge>
  );
}

// ── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  if (type === 'multi') {
    return (
      <Badge variant="outline" className="bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-800">
        <Layers className="mr-1 h-3 w-3" />
        Multi Pakai
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-800">
      <Tag className="mr-1 h-3 w-3" />
      Sekali Pakai
    </Badge>
  );
}

// ── Mock analytics data ───────────────────────────────────────────────

const analyticsSummary = [
  {
    label: 'Total Klik',
    value: '15,847',
    icon: Eye,
    theme: 'emerald' as const,
  },
  {
    label: 'Konversi',
    value: '24.3%',
    icon: TrendingUp,
    theme: 'emerald' as const,
    change: '+3.2%',
  },
  {
    label: 'Pendapatan Link',
    value: 'Rp 189.450.000',
    icon: DollarSign,
    theme: 'emerald' as const,
  },
];

const topPerformingLinks = [
  { name: 'Pembayaran Tiket Konser JKT48', clicks: 3842, conversion: '31.2%', revenue: 'Rp 48.200.000', status: 'active' },
  { name: 'Donasi Bencana Alam', clicks: 2915, conversion: '28.7%', revenue: 'Rp 35.800.000', status: 'active' },
  { name: 'Langganan Premium Bulanan', clicks: 2543, conversion: '26.4%', revenue: 'Rp 42.100.000', status: 'active' },
  { name: 'Pendaftaran Seminar Digital', clicks: 2187, conversion: '22.1%', revenue: 'Rp 31.500.000', status: 'active' },
  { name: 'Pembayaran Sewa Gedung', clicks: 1860, conversion: '19.8%', revenue: 'Rp 31.850.000', status: 'expired' },
];

// ── Analytics Section ────────────────────────────────────────────────────────

function AnalyticsSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="space-y-6"
    >
      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {analyticsSummary.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.18 + i * 0.08, ease: 'easeOut' }}
            >
              <Card className="card-hover stat-card-gradient bg-card border-border/60 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {item.label}
                      </p>
                      <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                        {item.value}
                      </p>
                      {item.change && (
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {item.change} vs periode lalu
                        </p>
                      )}
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50">
                      <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Top Performing Links Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.42 }}
      >
        <Card className="card-hover border-border/60 shadow-sm">
          <CardContent className="p-5">
            <h3 className="mb-4 text-base font-semibold">Link Terbaik</h3>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Nama Link</th>
                    <th className="pb-3 pr-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">Klik</th>
                    <th className="pb-3 pr-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">Konversi</th>
                    <th className="pb-3 pr-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">Pendapatan</th>
                    <th className="pb-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformingLinks.map((row, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: 0.48 + idx * 0.06 }}
                      className="border-b last:border-0 table-row-hover"
                    >
                      <td className="py-3 pr-4 font-medium">{row.name}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{row.clicks.toLocaleString('id-ID')}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">{row.conversion}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{row.revenue}</td>
                      <td className="py-3">
                        <StatusBadge status={row.status} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Card List */}
            <div className="md:hidden divide-y">
              {topPerformingLinks.map((row, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.48 + idx * 0.06 }}
                  className="flex items-center justify-between py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{row.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{row.clicks.toLocaleString('id-ID')} klik · {row.conversion}</p>
                  </div>
                  <div className="shrink-0 text-right ml-3">
                    <p className="text-sm font-bold tabular-nums">{row.revenue}</p>
                    <StatusBadge status={row.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function PaymentLinksSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter bar skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[160px]" />
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-7 w-36" />
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-full" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PaymentLinks() {
  const queryClient = useQueryClient();

  // ─── Local state ─────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<PaymentLinkItem | null>(null);
  const [selectedPaymentLinkId, setSelectedPaymentLinkId] = useState<string | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);

  // ─── Queries ─────────────────────────────────────────────────────────
  const { data, isLoading, error } = useQuery<{
    data: PaymentLinkItem[];
    pagination: PaginationInfo;
  }>({
    queryKey: ['payment-links', page, search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '9',
      });
      if (search) params.set('search', search);
      return fetch(`/api/payment-links?${params}`).then((r) => r.json());
    },
    staleTime: 15_000,
  });

  const { data: merchantsData } = useQuery<{ data: MerchantOption[] }>({
    queryKey: ['merchants-select'],
    queryFn: () =>
      fetch('/api/merchants?limit=100').then((r) => r.json()),
    staleTime: 60_000,
  });

  const merchants = merchantsData?.data ?? [];

  // ─── Detail query for drawer ────────────────────────────────────────
  const {
    data: detailData,
    isLoading: detailLoading,
  } = useQuery<{
    data: PaymentLinkDetail;
    totalRevenue: number;
    conversionRate: number;
    successRate: number;
  }>({
    queryKey: ['payment-link-detail', selectedPaymentLinkId],
    queryFn: () =>
      fetch(`/api/payment-links/${selectedPaymentLinkId}`).then((r) => r.json()),
    enabled: !!selectedPaymentLinkId && detailSheetOpen,
    staleTime: 10_000,
  });

  const detail = detailData?.data;

  // Client-side status filtering (API doesn't support status filter directly)
  const filteredData = data?.data.filter((link) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return !isExpired(link);
    if (statusFilter === 'expired') return isExpired(link);
    return true;
  });

  const pagination = data?.pagination;
  const links = filteredData ?? [];

  // ─── Mutations ───────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e.error));
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
      setCreateOpen(false);
      setForm(emptyForm);
      toast.success('Link pembayaran berhasil dibuat');
    },
    onError: (err: string) => {
      toast.error(err || 'Gagal membuat link pembayaran');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      fetch(`/api/payment-links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e.error));
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
      setEditOpen(false);
      setSelectedLink(null);
      setForm(emptyForm);
      toast.success('Link pembayaran berhasil diperbarui');
    },
    onError: (err: string) => {
      toast.error(err || 'Gagal memperbarui link pembayaran');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/payment-links/${id}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e.error));
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
      setDeleteOpen(false);
      setSelectedLink(null);
      toast.success('Link pembayaran berhasil dihapus');
    },
    onError: (err: string) => {
      toast.error(err || 'Gagal menghapus link pembayaran');
    },
  });

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(searchInput);
      setPage(1);
    },
    [searchInput],
  );

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((link: PaymentLinkItem) => {
    setSelectedLink(link);
    setForm({
      title: link.title,
      description: link.description ?? '',
      amount: String(link.amount),
      merchantId: link.merchantId,
      type: link.type,
      maxQty: String(link.maxQty),
      expiresAt: link.expiresAt
        ? new Date(link.expiresAt).toISOString().split('T')[0]
        : '',
    });
    setEditOpen(true);
  }, []);

  const openDelete = useCallback((link: PaymentLinkItem) => {
    setSelectedLink(link);
    setDeleteOpen(true);
  }, []);

  const handleCopyLink = useCallback((link: PaymentLinkItem) => {
    const url = `https://pay.posril.id/${link.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Tautan berhasil disalin ke clipboard');
    });
  }, []);

  const openDetailSheet = useCallback((linkId: string) => {
    setSelectedPaymentLinkId(linkId);
    setDetailSheetOpen(true);
  }, []);

  const handleCopyDetailLink = useCallback(() => {
    if (!selectedPaymentLinkId) return;
    const url = `https://pay.posril.id/${selectedPaymentLinkId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Tautan berhasil disalin ke clipboard');
    });
  }, [selectedPaymentLinkId]);

  const handleSubmitCreate = useCallback(() => {
    if (!form.title || !form.amount || !form.merchantId) {
      toast.error('Judul, jumlah, dan merchant wajib diisi');
      return;
    }
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      amount: Number(form.amount),
      merchantId: form.merchantId,
      type: form.type,
      maxQty: form.type === 'multi' ? Number(form.maxQty) || 1 : 1,
      expiresAt: form.expiresAt || undefined,
    });
  }, [form, createMutation]);

  const handleSubmitEdit = useCallback(() => {
    if (!selectedLink || !form.title || !form.amount || !form.merchantId) {
      toast.error('Judul, jumlah, dan merchant wajib diisi');
      return;
    }
    updateMutation.mutate({
      id: selectedLink.id,
      body: {
        title: form.title,
        description: form.description || undefined,
        amount: Number(form.amount),
        merchantId: form.merchantId,
        type: form.type,
        maxQty: form.type === 'multi' ? Number(form.maxQty) || 1 : 1,
        expiresAt: form.expiresAt || null,
      },
    });
  }, [form, selectedLink, updateMutation]);

  const handleConfirmDelete = useCallback(() => {
    if (selectedLink) deleteMutation.mutate(selectedLink.id);
  }, [selectedLink, deleteMutation]);

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Reset maxQty when switching to single
      if (field === 'type' && value === 'single') {
        next.maxQty = '1';
      }
      return next;
    });
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────

  if (isLoading) return <PaymentLinksSkeleton />;
  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">
          Gagal memuat data link pembayaran. Silakan coba lagi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-mesh animate-fade-in-up">
      <PageHeader
        title="Link Pembayaran"
        description="Kelola dan pantau semua link pembayaran Anda"
        icon={Link2}
        iconGradient="emerald"
      >
        <Button onClick={openCreate} className="w-full sm:w-auto btn-press">
          <Plus className="mr-2 h-4 w-4" />
          Buat Link Baru
        </Button>
      </PageHeader>

      {/* ─── Filter bar ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Cari link atau merchant..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="expired">Kedaluwarsa</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* ─── Analytics Section ────────────────────────────────────── */}
      <AnalyticsSection />

      {/* ─── Summary bar ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Link2 className="h-4 w-4" />
        <span>
          Menampilkan {links.length} dari {pagination?.total ?? 0} link pembayaran
        </span>
        {search && (
          <Badge variant="secondary" className="ml-2">
            &ldquo;{search}&rdquo;
            <button
              onClick={() => {
                setSearch('');
                setSearchInput('');
                setPage(1);
              }}
              className="ml-1.5 hover:text-foreground"
              aria-label="Hapus pencarian"
            >
              ✕
            </button>
          </Badge>
        )}
      </motion.div>

      {/* ─── Cards Grid ───────────────────────────────────────────── */}
      {links.length === 0 ? (
        <EmptyState
          title="Tidak ada link pembayaran"
          description={search || statusFilter !== 'all'
            ? 'Coba ubah filter pencarian Anda'
            : 'Buat link pembayaran pertama Anda'}
          icon="payment-link"
          actionLabel={(!search && statusFilter === 'all') ? 'Tambah' : undefined}
          onAction={(!search && statusFilter === 'all') ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {links.map((link, idx) => {
              const expired = isExpired(link);
              const progressPct =
                link.maxQty > 0
                  ? Math.min(100, (link.soldQty / link.maxQty) * 100)
                  : 0;

              return (
                <motion.div
                  key={link.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{
                    duration: 0.35,
                    delay: idx * 0.05,
                    ease: 'easeOut',
                  }}
                >
                  <Card
                    className={
                      'group relative overflow-hidden border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg card-hover' +
                      (expired ? ' opacity-70' : '')
                    }
                  >
                    {/* Gradient accent top */}
                    <div
                      className={
                        'absolute left-0 top-0 h-1 w-full bg-gradient-to-r ' +
                        (expired
                          ? 'from-gray-400 to-gray-300 dark:from-gray-600 dark:to-gray-500'
                          : 'from-emerald-500 to-teal-400')
                      }
                    />

                    <CardContent className="p-5">
                      {/* Top row: badges + menu */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={expired ? 'expired' : link.status} />
                          <TypeBadge type={link.type} />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCopyLink(link)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Salin Tautan
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(link)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDelete(link)}
                              className="text-red-600 focus:text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Title + merchant */}
                      <div className="mt-3 space-y-1">
                        <h3
                          className="cursor-pointer truncate text-base font-semibold leading-tight text-emerald-600 hover:underline dark:text-emerald-400"
                          onClick={() => openDetailSheet(link.id)}
                        >
                          {link.title}
                        </h3>
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <Store className="h-3.5 w-3.5" />
                          <span className="truncate">{link.merchant.name}</span>
                        </div>
                      </div>

                      {/* Description */}
                      {link.description && (
                        <p className="text-muted-foreground mt-2 line-clamp-2 text-xs leading-relaxed">
                          {link.description}
                        </p>
                      )}

                      {/* Amount */}
                      <div className="mt-4">
                        <p className="text-lg font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                          {formatRp(link.amount)}
                        </p>
                      </div>

                      {/* Progress bar (for multi-use) */}
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {link.type === 'multi' ? 'Terjual' : 'Transaksi'}
                          </span>
                          <span className="font-medium">
                            {link.soldQty}
                            {link.type === 'multi' && (
                              <span className="text-muted-foreground">
                                {' '}/ {link.maxQty}
                              </span>
                            )}
                          </span>
                        </div>
                        {link.type === 'multi' && (
                          <Progress
                            value={progressPct}
                            className="h-2"
                          />
                        )}
                      </div>

                      {/* Footer: dates */}
                      <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          <span>{formatDate(link.createdAt)}</span>
                        </div>
                        {link.expiresAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className={expired ? 'text-gray-500' : ''}>
                              {formatDate(link.expiresAt)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quick action: copy link button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full gap-2 text-xs"
                        onClick={() => handleCopyLink(link)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Salin Tautan Pembayaran
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Pagination ────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="flex flex-col items-center gap-3"
        >
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={
                    page <= 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                  aria-disabled={page <= 1}
                />
              </PaginationItem>
              {getPageRange(page, pagination.totalPages).map((p, i) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`el-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => setPage(p)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className={
                    page >= pagination.totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                  aria-disabled={page >= pagination.totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <p className="text-muted-foreground text-xs">
            Halaman {page} dari {pagination.totalPages}
          </p>
        </motion.div>
      )}

      {/* ─── Create Dialog ─────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto scrollbar-thin sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              Buat Link Pembayaran Baru
            </DialogTitle>
            <DialogDescription>
              Isi detail di bawah untuk membuat link pembayaran baru.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="create-title">Judul *</Label>
              <Input
                id="create-title"
                placeholder="contoh: Pembayaran Tiket Konser"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="create-desc">Deskripsi</Label>
              <Textarea
                id="create-desc"
                placeholder="Deskripsi singkat tentang link pembayaran ini (opsional)"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="create-amount">Jumlah (IDR) *</Label>
              <div className="relative">
                <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium">
                  Rp
                </span>
                <Input
                  id="create-amount"
                  type="number"
                  placeholder="0"
                  className="pl-10"
                  value={form.amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                />
              </div>
              {form.amount && Number(form.amount) > 0 && (
                <p className="text-muted-foreground text-xs">
                  {formatRp(Number(form.amount))}
                </p>
              )}
            </div>

            {/* Merchant */}
            <div className="grid gap-2">
              <Label>Merchant *</Label>
              <Select
                value={form.merchantId}
                onValueChange={(v) => updateField('merchantId', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih merchant" />
                </SelectTrigger>
                <SelectContent>
                  {merchants.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="grid gap-2">
              <Label>Tipe</Label>
              <Select
                value={form.type}
                onValueChange={(v) => updateField('type', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Sekali Pakai</SelectItem>
                  <SelectItem value="multi">Multi Pakai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Max Qty (multi only) */}
            {form.type === 'multi' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid gap-2"
              >
                <Label htmlFor="create-maxqty">Jumlah Maksimal</Label>
                <Input
                  id="create-maxqty"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={form.maxQty}
                  onChange={(e) => updateField('maxQty', e.target.value)}
                />
              </motion.div>
            )}

            {/* Expiry */}
            <div className="grid gap-2">
              <Label htmlFor="create-expiry">Tanggal Kedaluwarsa</Label>
              <Input
                id="create-expiry"
                type="date"
                value={form.expiresAt}
                onChange={(e) => updateField('expiresAt', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
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
              onClick={handleSubmitCreate}
              disabled={createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createMutation.isPending ? 'Menyimpan...' : 'Buat Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto scrollbar-thin sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-emerald-500" />
              Edit Link Pembayaran
            </DialogTitle>
            <DialogDescription>
              Perbarui detail link pembayaran.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Judul *</Label>
              <Input
                id="edit-title"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-desc">Deskripsi</Label>
              <Textarea
                id="edit-desc"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-amount">Jumlah (IDR) *</Label>
              <div className="relative">
                <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium">
                  Rp
                </span>
                <Input
                  id="edit-amount"
                  type="number"
                  className="pl-10"
                  value={form.amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                />
              </div>
              {form.amount && Number(form.amount) > 0 && (
                <p className="text-muted-foreground text-xs">
                  {formatRp(Number(form.amount))}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Merchant *</Label>
              <Select
                value={form.merchantId}
                onValueChange={(v) => updateField('merchantId', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih merchant" />
                </SelectTrigger>
                <SelectContent>
                  {merchants.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Tipe</Label>
              <Select
                value={form.type}
                onValueChange={(v) => updateField('type', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Sekali Pakai</SelectItem>
                  <SelectItem value="multi">Multi Pakai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.type === 'multi' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid gap-2"
              >
                <Label htmlFor="edit-maxqty">Jumlah Maksimal</Label>
                <Input
                  id="edit-maxqty"
                  type="number"
                  min="1"
                  value={form.maxQty}
                  onChange={(e) => updateField('maxQty', e.target.value)}
                />
              </motion.div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-expiry">Tanggal Kedaluwarsa</Label>
              <Input
                id="edit-expiry"
                type="date"
                value={form.expiresAt}
                onChange={(e) => updateField('expiresAt', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={updateMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete AlertDialog ────────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Link Pembayaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Link pembayaran{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{selectedLink?.title}&rdquo;
              </span>{" "}
              akan dihapus secara permanen beserta data terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Payment Link Detail Sheet Drawer ────────────────────────── */}
      <Sheet open={detailSheetOpen} onOpenChange={(open) => {
        setDetailSheetOpen(open);
        if (!open) setSelectedPaymentLinkId(null);
      }}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-hidden">
          {detailLoading ? (
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-36" />
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
              <Separator />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Separator />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          ) : detail ? (
            <div className="flex h-full flex-col">
              {/* ── Drawer Header ────────────────────────────────────── */}
              <SheetHeader className="border-b px-6 py-5 shrink-0">
                <div className="flex items-start justify-between gap-3 pr-6">
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-lg leading-snug">{detail.title}</SheetTitle>
                    {detail.description && (
                      <SheetDescription className="mt-1 line-clamp-2">{detail.description}</SheetDescription>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={drawerStatusBadgeClass[detail.status] || drawerStatusBadgeClass.active}
                  >
                    {drawerStatusLabel[detail.status] || 'Aktif'}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="text-muted-foreground flex min-w-0 flex-1 items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs">
                    <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">https://pay.posril.id/{detail.id}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleCopyDetailLink}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
                  <CalendarDays className="h-3 w-3" />
                  <span>Dibuat {formatDate(detail.createdAt)}</span>
                </div>
              </SheetHeader>

              {/* ── Scrollable Content ──────────────────────────────── */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="space-y-6 p-6">
                  {/* ── Stats Cards ──────────────────────────────────── */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="grid grid-cols-3 gap-3"
                  >
                    {/* Total Pendapatan */}
                    <div className="card-elevated rounded-xl p-3.5">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-400">
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-muted-foreground text-[11px] font-medium">Total Pendapatan</p>
                      <p className="mt-0.5 text-sm font-bold">
                        <AnimatedCounter
                          value={detailData?.totalRevenue ?? 0}
                          formatFn={(v) => formatRp(v)}
                          duration={800}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                      </p>
                    </div>

                    {/* Total Terjual */}
                    <div className="card-elevated rounded-xl p-3.5">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-400">
                        <Layers className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-muted-foreground text-[11px] font-medium">Total Terjual</p>
                      <p className="mt-0.5 text-sm font-bold">
                        <AnimatedCounter
                          value={detail.soldQty}
                          duration={800}
                        />
                      </p>
                    </div>

                    {/* Tingkat Konversi */}
                    <div className="card-elevated rounded-xl p-3.5">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-400">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-muted-foreground text-[11px] font-medium">Tingkat Konversi</p>
                      <p className="mt-0.5 text-sm font-bold">
                        <AnimatedCounter
                          value={detailData?.conversionRate ?? 0}
                          suffix="%"
                          duration={800}
                          className="text-amber-600 dark:text-amber-400"
                        />
                      </p>
                    </div>
                  </motion.div>

                  {/* ── Progress Bar ──────────────────────────────────── */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Proses Penjualan</span>
                      <span className="font-semibold">
                        {detail.soldQty} / {detail.maxQty} terjual
                      </span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={detail.maxQty > 0 ? Math.min(100, (detail.soldQty / detail.maxQty) * 100) : 0}
                        className="h-2.5"
                      />
                    </div>
                  </motion.div>

                  <Separator />

                  {/* ── Transaction History ──────────────────────────── */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="space-y-3"
                  >
                    <h4 className="flex items-center gap-2 text-sm font-semibold">
                      <Receipt className="h-4 w-4 text-emerald-500" />
                      Riwayat Transaksi
                    </h4>

                    {detail.transactions.length === 0 ? (
                      <div className="empty-state flex flex-col items-center justify-center rounded-xl py-10">
                        <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-2xl">
                          <CreditCard className="text-muted-foreground h-6 w-6" />
                        </div>
                        <p className="mt-3 text-sm font-medium">Belum ada transaksi untuk link ini</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border">
                        <Table className="text-xs">
                          <TableHeader className="table-header-enhanced">
                            <TableRow>
                              <TableHead>Invoice</TableHead>
                              <TableHead>Pelanggan</TableHead>
                              <TableHead className="text-right">Jumlah</TableHead>
                              <TableHead>Metode</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Tanggal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detail.transactions.map((tx) => (
                              <TableRow key={tx.id} className="table-row-hover">
                                <TableCell className="font-medium">{tx.invoiceNo}</TableCell>
                                <TableCell>{tx.customerName || '-'}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatRp(tx.amount)}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={methodBadgeClass[tx.paymentMethod] || ''}
                                  >
                                    {methodLabel[tx.paymentMethod] || tx.paymentMethod}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={statusBadgeClass[tx.status] || ''}
                                  >
                                    {statusLabel[tx.status] || tx.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {formatDateTime(tx.createdAt)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* ── Action Buttons Footer ─────────────────────────────── */}
              <div className="border-t px-6 py-4 shrink-0">
                <div className="flex gap-3">
                  <Button
                    onClick={handleCopyDetailLink}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 btn-press"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Salin Link
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 btn-press"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Buat Transaksi
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
