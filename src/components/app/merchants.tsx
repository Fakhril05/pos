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
  Receipt,
  Plus,
  MapPin,
  Loader2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/app/page-header';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
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

const payoutStatusLabel: Record<string, string> = {
  pending: 'Menunggu',
  processing: 'Diproses',
  completed: 'Berhasil',
  failed: 'Gagal',
  cancelled: 'Dibatalkan',
};

const payoutStatusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  processing: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
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
    createdAt: string;
  }[];
  payouts: {
    id: string;
    amount: number;
    fee: number;
    status: string;
    bankName: string;
    accountNo: string;
    createdAt: string;
  }[];
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function Merchants() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['merchant-detail', selectedMerchant],
    queryFn: async () => {
      const res = await fetch(`/api/merchants/${selectedMerchant}`);
      if (!res.ok) throw new Error('Gagal memuat detail merchant');
      const json = await res.json();
      return json.data as MerchantDetail;
    },
    enabled: !!selectedMerchant,
    staleTime: 10_000,
  });

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
      toast.success('Merchant baru berhasil ditambahkan');
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed"
        >
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Store className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Tidak ada merchant ditemukan</p>
          <p className="text-sm text-muted-foreground mt-1">Coba ubah kata kunci pencarian</p>
        </motion.div>
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
                  onClick={() => setSelectedMerchant(m.id)}
                >
                  {/* Gradient top border */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${m.status === 'active' ? 'from-emerald-400 via-emerald-500 to-teal-400' : 'from-gray-300 via-gray-400 to-gray-300'}`} />
                  <CardContent className="p-5 space-y-3.5">
                    {/* Name + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate group-hover:text-emerald-600 transition-colors">
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

      {/* ── Merchant Detail Dialog ── */}
      <Dialog open={!!selectedMerchant} onOpenChange={() => setSelectedMerchant(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-600" />
              Detail Merchant
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex-1 space-y-4 p-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Separator />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : detail ? (
            <ScrollArea className="flex-1 pr-1">
              <div className="space-y-5 pb-4">
                {/* Merchant Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                      {detail.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{detail.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${statusColor[detail.status] || ''}`}>
                          {statusLabel[detail.status] || detail.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{detail.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Mail, label: 'Email', value: detail.email },
                      { icon: Phone, label: 'Telepon', value: detail.phone || '-' },
                      { icon: CalendarDays, label: 'Bergabung', value: formatDate(detail.createdAt) },
                      { icon: CreditCard, label: 'Total Transaksi', value: String(detail._count.transactions) },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <item.icon className="h-3 w-3" />
                          {item.label}
                        </div>
                        <p className="text-sm font-medium truncate">{item.value}</p>
                      </div>
                    ))}
                    <div className="rounded-lg border p-3 col-span-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Banknote className="h-3 w-3" />
                        Total Penjualan
                      </div>
                      <p className="text-sm font-semibold text-emerald-600">{formatMoney(detail.totalSales)}</p>
                    </div>
                  </div>

                  {/* API Key */}
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Key className="h-3 w-3" />
                      API Key
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1.5 rounded font-mono flex-1 break-all">
                        {detail.apiKey}
                      </code>
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
                </div>

                <Separator />

                {/* Recent Transactions */}
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                    Transaksi Terbaru
                  </h4>
                  {detail.transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Belum ada transaksi</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.transactions.map((tx) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono text-muted-foreground">{tx.invoiceNo}</code>
                              <Badge className={`text-[10px] px-1.5 py-0 ${txStatusColor[tx.status] || ''}`}>
                                {txStatusLabel[tx.status] || tx.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(tx.createdAt)}</p>
                          </div>
                          <span className="text-sm font-semibold text-emerald-600 ml-3">
                            {formatMoney(tx.amount)}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Recent Payouts */}
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    Pencairan Terbaru
                  </h4>
                  {detail.payouts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Belum ada pencairan</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.payouts.map((po) => (
                        <motion.div
                          key={po.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{po.bankName} - {po.accountNo}</span>
                              <Badge className={`text-[10px] px-1.5 py-0 ${payoutStatusColor[po.status] || ''}`}>
                                {payoutStatusLabel[po.status] || po.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(po.createdAt)}</p>
                          </div>
                          <span className="text-sm font-semibold ml-3">
                            {formatMoney(po.amount)}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
