'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  AlertTriangle,
  PackageX,
  Warehouse,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  PackageCheck,
  Search,
  Filter,
  X,
  History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { AnimatedCounter } from '@/components/app/animated-counter';
import { useAppStore } from '@/stores/app-store';
import { toast } from 'sonner';

// ── Helpers ──────────────────────────────────────────────────────────────

const formatRp = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

interface StockProduct {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  minStock: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  isAvailable: boolean;
  stockStatus: 'cukup' | 'rendah' | 'habis';
  category: { id: string; name: string } | null;
}

interface StockLog {
  id: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  performedBy: string | null;
  createdAt: string;
  productName: string;
  productSku: string | null;
}

const adjustmentTypes = [
  { value: 'in', label: 'Stok Masuk', icon: ArrowDownToLine, color: 'text-emerald-500' },
  { value: 'out', label: 'Stok Keluar', icon: ArrowUpFromLine, color: 'text-rose-500' },
  { value: 'adjustment', label: 'Penyesuaian', icon: RefreshCw, color: 'text-amber-500' },
  { value: 'initial', label: 'Stok Awal', icon: PackageCheck, color: 'text-blue-500' },
];

const typeLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  in: { label: 'Masuk', variant: 'default' },
  out: { label: 'Keluar', variant: 'destructive' },
  adjustment: { label: 'Penyesuaian', variant: 'secondary' },
  initial: { label: 'Stok Awal', variant: 'outline' },
};

const stockStatusBadge = (status: string) => {
  switch (status) {
    case 'habis':
      return <Badge variant="destructive" className="badge-gradient-rose text-[10px]">Habis</Badge>;
    case 'rendah':
      return <Badge className="badge-gradient-amber text-[10px]">Rendah</Badge>;
    default:
      return <Badge variant="default" className="badge-gradient-emerald text-[10px]">Cukup</Badge>;
  }
};

// ── Component ────────────────────────────────────────────────────────────

export function Stock() {
  const { user } = useAppStore();
  const tenantId = user?.tenantId ?? '';
  const isManager = user?.role === 'manager';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adjType, setAdjType] = useState('in');
  const [adjProductId, setAdjProductId] = useState('');
  const [adjQty, setAdjQty] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [showLog, setShowLog] = useState(false);

  const outletId = user?.outletId;

  // Fetch stock data
  const { data, isLoading } = useQuery({
    queryKey: ['owner-stock', tenantId, search, categoryFilter, lowStockOnly, outletId],
    queryFn: () => {
      const p = new URLSearchParams({ tenantId });
      if (search) p.set('search', search);
      if (categoryFilter) p.set('categoryId', categoryFilter);
      if (lowStockOnly) p.set('lowStockOnly', 'true');
      if (outletId) p.set('outletId', outletId);
      return fetch(`/api/owner/stock?${p.toString()}`).then((r) => r.json());
    },
    enabled: !!tenantId,
  });

  const products: StockProduct[] = data?.products ?? [];
  const categories = data?.categories ?? [];
  const recentLogs: StockLog[] = data?.recentLogs ?? [];

  // Adjust mutation
  const adjustMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/owner/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          productId: adjProductId,
          outletId: user?.outletId || null,
          type: adjType,
          quantity: Number(adjQty),
          reason: adjReason || null,
          adjustedBy: user?.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyesuaikan stok');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-stock'] });
      toast.success('Stok berhasil disesuaikan');
      setDialogOpen(false);
      resetAdjForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetAdjForm = () => {
    setAdjType('in');
    setAdjProductId('');
    setAdjQty('');
    setAdjReason('');
  };

  const handleOpenAdjust = () => {
    resetAdjForm();
    setDialogOpen(true);
  };

  const handleSubmitAdjust = () => {
    if (!adjProductId || !adjQty || Number(adjQty) <= 0) {
      toast.error('Produk dan jumlah wajib diisi');
      return;
    }
    adjustMutation.mutate();
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title="Stok & Inventaris"
        description="Pantau dan kelola stok produk Anda"
        icon={ClipboardList}
        iconGradient="teal"
      >
        <Button
          variant="outline"
          className={
            showLog
              ? 'gap-2 border-emerald-500/50 bg-emerald-500/10 text-emerald-500'
              : 'gap-2'
          }
          onClick={() => setShowLog(!showLog)}
        >
          <History className="h-4 w-4" />
          {showLog ? 'Tutup Log' : 'Riwayat'}
        </Button>
        <Button
          onClick={handleOpenAdjust}
          className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm btn-press"
        >
          <Plus className="h-4 w-4" />
          Penyesuaian Stok
        </Button>
      </PageHeader>

      {/* Stock Overview Cards */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <Card className="glass-card card-elevated">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
              <Warehouse className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Produk</p>
              <AnimatedCounter value={data?.totalProducts ?? 0} className="text-lg font-bold tabular-nums" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card card-elevated">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stok Rendah</p>
              <AnimatedCounter value={data?.lowStockCount ?? 0} className="text-lg font-bold tabular-nums text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card card-elevated">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/20">
              <PackageX className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stok Habis</p>
              <AnimatedCounter value={data?.outOfStockCount ?? 0} className="text-lg font-bold tabular-nums text-rose-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card card-elevated">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/20">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nilai Inventaris</p>
              <AnimatedCounter
                value={data?.inventoryValue ?? 0}
                formatFn={formatRp}
                className="text-lg font-bold tabular-nums"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        {showLog ? (
          <motion.div
            key="log"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="glass-card card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Riwayat Penyesuaian Stok</CardTitle>
                <CardDescription>20 penyesuaian terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="table-header-enhanced">
                        <TableHead className="text-xs">Waktu</TableHead>
                        <TableHead className="text-xs">Produk</TableHead>
                        <TableHead className="text-xs">Tipe</TableHead>
                        <TableHead className="text-xs text-right">Perubahan</TableHead>
                        <TableHead className="text-xs">Stok</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Alasan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">
                            Belum ada riwayat penyesuaian
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentLogs.map((log) => (
                          <TableRow key={log.id} className="table-stripe">
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{log.productName}</div>
                              {log.productSku && <div className="text-xs text-muted-foreground font-mono">{log.productSku}</div>}
                            </TableCell>
                            <TableCell>
                              <Badge variant={typeLabel[log.type]?.variant ?? 'secondary'} className="text-[10px]">
                                {typeLabel[log.type]?.label ?? log.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`text-sm font-medium tabular-nums ${log.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {log.quantity > 0 ? '+' : ''}{log.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs tabular-nums">
                              {log.previousStock} → {log.newStock}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden sm:table-cell max-w-[200px] truncate">
                              {log.reason ?? '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari produk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={categoryFilter || '__all__'} onValueChange={(v) => setCategoryFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua Kategori</SelectItem>
                  {categories.map((c: { id: string; name: string }) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={lowStockOnly ? 'default' : 'outline'}
                size="sm"
                className={`gap-2 ${lowStockOnly ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                onClick={() => setLowStockOnly(!lowStockOnly)}
              >
                <AlertTriangle className="h-4 w-4" />
                Stok Rendah
              </Button>
            </div>

            {/* Stock Table */}
            {isLoading ? (
              <Card className="glass-card">
                <CardContent className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </CardContent>
              </Card>
            ) : products.length === 0 ? (
              <EmptyState
                title="Tidak ada produk ditemukan"
                message={lowStockOnly ? 'Tidak ada produk dengan stok rendah' : 'Ubah filter atau tambahkan produk baru'}
                icon="search"
              />
            ) : (
              <Card className="glass-card card-elevated overflow-hidden">
                <div className="max-h-[calc(100vh-24rem)] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="table-header-enhanced">
                        <TableHead className="text-xs">Produk</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Kategori</TableHead>
                        <TableHead className="text-xs text-right">Stok</TableHead>
                        <TableHead className="text-xs text-right hidden sm:table-cell">Min. Stok</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs text-right hidden lg:table-cell">Nilai Stok</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p) => (
                        <TableRow key={p.id} className="table-stripe">
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{p.name}</p>
                              {p.sku && <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="text-[10px]">{p.category?.name ?? '-'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`text-sm font-medium tabular-nums ${p.stockStatus === 'habis' ? 'text-rose-500' : p.stockStatus === 'rendah' ? 'text-amber-500' : ''}`}>
                              {p.stock}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">{p.unit}</span>
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums text-muted-foreground hidden sm:table-cell">
                            {p.minStock}
                          </TableCell>
                          <TableCell>{stockStatusBadge(p.stockStatus)}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums text-muted-foreground hidden lg:table-cell">
                            {formatRp(p.stock * p.buyPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Adjustment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gradient-emerald">Penyesuaian Stok</DialogTitle>
            <DialogDescription>Atur jumlah stok produk</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Type Selection */}
            <div className="grid gap-2">
              <Label>Tipe Penyesuaian</Label>
              <div className="grid grid-cols-2 gap-2">
                {adjustmentTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all ${
                      adjType === t.value
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-border hover:border-border/80 hover:bg-muted/50'
                    }`}
                    onClick={() => setAdjType(t.value)}
                  >
                    <t.icon className={`h-4 w-4 ${adjType === t.value ? t.color : 'text-muted-foreground'}`} />
                    <span className="font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Product Selection */}
            <div className="grid gap-2">
              <Label>Produk *</Label>
              <Select value={adjProductId} onValueChange={setAdjProductId}>
                <SelectTrigger><SelectValue placeholder="Pilih produk" /></SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.sku ? `(${p.sku})` : ''} — Stok: {p.stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="grid gap-2">
              <Label htmlFor="adj-qty">Jumlah * {adjType === 'adjustment' || adjType === 'initial' ? '(stok akhir)' : ''}</Label>
              <Input
                id="adj-qty"
                type="number"
                min="0"
                value={adjQty}
                onChange={(e) => setAdjQty(e.target.value)}
                placeholder={adjType === 'adjustment' || adjType === 'initial' ? 'Masukkan stok akhir' : 'Masukkan jumlah'}
              />
            </div>

            {/* Reason */}
            <div className="grid gap-2">
              <Label htmlFor="adj-reason">Alasan</Label>
              <Textarea
                id="adj-reason"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="Contoh: Pembelian dari supplier, barang rusak, dst."
                rows={2}
              />
            </div>

            {isManager && (
              <p className="text-xs text-muted-foreground bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg p-3">
                Sebagai manager, Anda hanya dapat menyesuaikan stok untuk outlet Anda saat ini.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleSubmitAdjust}
              disabled={adjustMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {adjustMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
