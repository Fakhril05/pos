'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Banknote,
  CheckCircle2,
  Clock,
  Plus,
  Play,
  Loader2,
  Store,
  Building2,
  User,
  X,
  Filter,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  DialogFooter,
  DialogDescription,
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

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const statusLabel: Record<string, string> = {
  pending: 'Menunggu',
  processing: 'Diproses',
  completed: 'Berhasil',
  failed: 'Gagal',
  cancelled: 'Dibatalkan',
};

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  processing: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const statusIcon: Record<string, typeof CheckCircle2> = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle2,
  failed: X,
  cancelled: X,
};

const statusFilters = [
  { value: 'all', label: 'Semua' },
  { value: 'completed', label: 'Berhasil' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'processing', label: 'Diproses' },
];

// ─── Types ─────────────────────────────────────────────────────────────────

interface Payout {
  id: string;
  merchantId: string;
  amount: number;
  fee: number;
  status: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  notes: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  merchant: { id: string; name: string; logo: string | null };
}

interface MerchantOption {
  id: string;
  name: string;
  email: string;
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function Payouts() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  // ── Form state ──
  const [formMerchant, setFormMerchant] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formFee, setFormFee] = useState('0');
  const [formBankName, setFormBankName] = useState('');
  const [formAccountNo, setFormAccountNo] = useState('');
  const [formAccountName, setFormAccountName] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // ── Fetch paginated payouts ──
  const { data, isLoading, isError } = useQuery({
    queryKey: ['payouts', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/payouts?${params}`);
      if (!res.ok) throw new Error('Gagal memuat data pencairan');
      const json = await res.json();
      return json as {
        data: Payout[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    },
    staleTime: 15_000,
  });

  // ── Fetch stats ──
  const { data: statsData } = useQuery({
    queryKey: ['payouts-stats'],
    queryFn: async () => {
      const [allRes, successRes, pendingRes] = await Promise.all([
        fetch('/api/payouts?limit=1'),
        fetch('/api/payouts?status=completed&limit=1'),
        fetch('/api/payouts?status=pending&limit=1'),
      ]);
      const [all, success, pending] = await Promise.all([
        allRes.json(),
        successRes.json(),
        pendingRes.json(),
      ]);
      return {
        total: all.pagination?.total ?? 0,
        completed: success.pagination?.total ?? 0,
        pending: pending.pagination?.total ?? 0,
      };
    },
    staleTime: 30_000,
  });

  // ── Fetch merchants for create form ──
  const { data: merchants } = useQuery({
    queryKey: ['merchants-select'],
    queryFn: async () => {
      const res = await fetch('/api/merchants?limit=9999');
      if (!res.ok) throw new Error('Gagal memuat daftar merchant');
      const json = await res.json();
      return json.data as MerchantOption[];
    },
    staleTime: 60_000,
  });

  // ── Process payout mutation ──
  const processMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/payouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memproses pencairan');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Pencairan berhasil diproses');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['payouts-stats'] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // ── Create payout mutation ──
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: formMerchant,
          amount: Number(formAmount),
          fee: Number(formFee) || 0,
          bankName: formBankName,
          accountNo: formAccountNo,
          accountName: formAccountName,
          notes: formNotes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal membuat pencairan');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Pencairan berhasil dibuat');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['payouts-stats'] });
      setCreateOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const payouts = data?.data ?? [];
  const payoutPagination = data?.pagination;

  const resetForm = () => {
    setFormMerchant('');
    setFormAmount('');
    setFormFee('0');
    setFormBankName('');
    setFormAccountNo('');
    setFormAccountName('');
    setFormNotes('');
  };

  const handleFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMerchant || !formAmount || !formBankName || !formAccountNo || !formAccountName) {
      toast.error('Lengkapi semua field yang wajib diisi');
      return;
    }
    createMutation.mutate();
  };

  const handleProcess = (id: string) => {
    processMutation.mutate({ id, status: 'processing' });
  };

  // ── Page range ──
  const pageRange = useMemo(() => {
    if (!payoutPagination) return [];
    const { page: p, totalPages: tp } = payoutPagination;
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
  }, [payoutPagination]);

  // ─── Render ───────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Banknote className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Gagal memuat data pencairan</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Payout', value: (statsData?.total ?? 0).toLocaleString('id-ID'), icon: Banknote, gradient: 'from-emerald-500 to-teal-500' },
          { label: 'Payout Berhasil', value: (statsData?.completed ?? 0).toLocaleString('id-ID'), icon: CheckCircle2, gradient: 'from-emerald-600 to-green-500' },
          { label: 'Payout Menunggu', value: (statsData?.pending ?? 0).toLocaleString('id-ID'), icon: Clock, gradient: 'from-amber-500 to-orange-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow card-hover">
              <CardContent className="p-4 sm:p-6 flex items-center gap-4">
                <div className={`flex-shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-lg font-bold truncate">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Filter Bar + Create Button ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
      >
        <div className="relative flex-1 w-full sm:w-auto">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="pl-9 w-full sm:w-48">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto btn-press"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Buat Pencairan
        </Button>
      </motion.div>

      {/* ── Active filter indicator ── */}
      <AnimatePresence>
        {statusFilter !== 'all' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Badge variant="secondary" className="gap-1 pr-1">
              {statusFilters.find((f) => f.value === statusFilter)?.label || statusFilter}
              <button
                onClick={() => handleFilterChange('all')}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Payouts Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.28 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="h-5 w-5 text-emerald-600" />
                Daftar Pencairan
              </CardTitle>
              {payoutPagination && (
                <span className="text-xs text-muted-foreground">
                  {payoutPagination.total} pencairan
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : payouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Banknote className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Tidak ada pencairan ditemukan</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusFilter ? 'Coba ubah filter status' : 'Buat pencairan pertama Anda'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Merchant</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Biaya</TableHead>
                      <TableHead className="text-right hidden md:table-cell">Jumlah Bersih</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Tanggal</TableHead>
                      <TableHead className="pr-6 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {payouts.map((po, i) => {
                        const StatusIcon = statusIcon[po.status] || Clock;
                        return (
                          <motion.tr
                            key={po.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2, delay: i * 0.03 }}
                            className="hover:bg-muted/50 transition-colors table-row-hover"
                          >
                            <TableCell className="pl-6">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {po.merchant.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-sm truncate max-w-[140px]">
                                  {po.merchant.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium">{po.bankName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {po.accountNo} • {po.accountName}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm font-semibold">{formatMoney(po.amount)}</span>
                            </TableCell>
                            <TableCell className="text-right hidden sm:table-cell">
                              <span className="text-sm text-muted-foreground">{formatMoney(po.fee)}</span>
                            </TableCell>
                            <TableCell className="text-right hidden md:table-cell">
                              <span className="text-sm font-medium text-emerald-600">
                                {formatMoney(po.amount - po.fee)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${statusColor[po.status] || ''}`}>
                                <StatusIcon className={`h-3 w-3 mr-1 ${po.status === 'processing' ? 'animate-spin' : ''}`} />
                                {statusLabel[po.status] || po.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="text-sm text-muted-foreground">{formatDate(po.createdAt)}</span>
                            </TableCell>
                            <TableCell className="pr-6 text-right">
                              {po.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950"
                                  onClick={() => handleProcess(po.id)}
                                  disabled={processMutation.isPending}
                                >
                                  {processMutation.isPending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                  ) : (
                                    <Play className="h-3.5 w-3.5 mr-1" />
                                  )}
                                  Proses
                                </Button>
                              )}
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Pagination ── */}
      {payoutPagination && payoutPagination.totalPages > 1 && (
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
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(payoutPagination.totalPages, p + 1))}
                  className={page === payoutPagination.totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <p className="text-center text-sm text-muted-foreground">
            Menampilkan {(page - 1) * payoutPagination.limit + 1}&ndash;{Math.min(page * payoutPagination.limit, payoutPagination.total)} dari {payoutPagination.total} pencairan
          </p>
        </div>
      )}

      {/* ── Create Payout Dialog ── */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setCreateOpen(open);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Buat Pencairan Baru
            </DialogTitle>
            <DialogDescription>
              Isi detail pencairan dana untuk merchant
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitCreate} className="space-y-4">
            {/* Merchant Select */}
            <div className="space-y-2">
              <Label htmlFor="merchant-select" className="flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" />
                Merchant <span className="text-red-500">*</span>
              </Label>
              <Select value={formMerchant} onValueChange={setFormMerchant}>
                <SelectTrigger id="merchant-select">
                  <SelectValue placeholder="Pilih merchant" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Array.isArray(merchants) && merchants.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount + Fee */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="payout-amount" className="flex items-center gap-1.5">
                  <Banknote className="h-3.5 w-3.5" />
                  Jumlah <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                  <Input
                    id="payout-amount"
                    type="number"
                    placeholder="0"
                    className="pl-10"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payout-fee" className="flex items-center gap-1.5">
                  Biaya
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                  <Input
                    id="payout-fee"
                    type="number"
                    placeholder="0"
                    className="pl-10"
                    value={formFee}
                    onChange={(e) => setFormFee(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Live net amount preview */}
            {formAmount && Number(formAmount) > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 flex items-center justify-between"
              >
                <span className="text-sm text-emerald-700 dark:text-emerald-400">Jumlah Bersih</span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {formatMoney(Number(formAmount) - (Number(formFee) || 0))}
                </span>
              </motion.div>
            )}

            <Separator />

            {/* Bank Details */}
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Detail Rekening Bank
            </p>

            <div className="space-y-2">
              <Label htmlFor="bank-name" className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Nama Bank <span className="text-red-500">*</span>
              </Label>
              <Select value={formBankName} onValueChange={setFormBankName}>
                <SelectTrigger id="bank-name">
                  <SelectValue placeholder="Pilih bank" />
                </SelectTrigger>
                <SelectContent>
                  {['BCA', 'BNI', 'BRI', 'Mandiri', 'BSI', 'CIMB Niaga', 'Danamon', 'Permata', 'Bank Mega', 'Bank Sinarmas', 'OCBC NISP', 'Lainnya'].map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="account-no" className="flex items-center gap-1.5">
                  Nomor Rekening <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="account-no"
                  placeholder="Masukkan nomor rekening"
                  value={formAccountNo}
                  onChange={(e) => setFormAccountNo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-name" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Nama Pemilik <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="account-name"
                  placeholder="Nama pemilik rekening"
                  value={formAccountName}
                  onChange={(e) => setFormAccountName(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="payout-notes">Catatan</Label>
              <Textarea
                id="payout-notes"
                placeholder="Catatan opsional..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setCreateOpen(false);
                }}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Buat Pencairan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
