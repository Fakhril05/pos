'use client';

import { useState, useCallback, useEffect } from 'react';
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

// ── Types ────────────────────────────────────────────────────────────────────

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
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${link.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Tautan berhasil disalin ke clipboard');
    });
  }, []);

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
    <div className="space-y-6">
      {/* ─── Header + Filters ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Link Pembayaran</h2>
            <p className="text-muted-foreground text-sm">
              Kelola dan pantau semua link pembayaran Anda
            </p>
          </div>
          <Button onClick={openCreate} className="w-full sm:w-auto btn-press">
            <Plus className="mr-2 h-4 w-4" />
            Buat Link Baru
          </Button>
        </div>
      </motion.div>

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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16"
        >
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-2xl">
            <LinkIcon className="text-muted-foreground h-8 w-8" />
          </div>
          <p className="mt-4 text-lg font-medium">Tidak ada link pembayaran</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {search || statusFilter !== 'all'
              ? 'Coba ubah filter pencarian Anda'
              : 'Buat link pembayaran pertama Anda'}
          </p>
        </motion.div>
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
                        <h3 className="truncate text-base font-semibold leading-tight">
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
    </div>
  );
}
