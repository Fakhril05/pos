'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Star,
  ArrowUpDown,
  Filter,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
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
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  buyPrice: number;
  sellPrice: number;
  wholesalePrice: number | null;
  stock: number;
  minStock: number;
  unit: string;
  isAvailable: boolean;
  isFavorite: boolean;
  category: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductFormData {
  name: string;
  categoryId: string;
  sku: string;
  barcode: string;
  buyPrice: string;
  sellPrice: string;
  wholesalePrice: string;
  stock: string;
  minStock: string;
  unit: string;
  description: string;
  isFavorite: boolean;
}

const emptyForm: ProductFormData = {
  name: '',
  categoryId: '',
  sku: '',
  barcode: '',
  buyPrice: '',
  sellPrice: '',
  wholesalePrice: '',
  stock: '0',
  minStock: '5',
  unit: 'pcs',
  description: '',
  isFavorite: false,
};

const sortOptions = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'name', label: 'Nama A-Z' },
  { value: 'price-asc', label: 'Harga Terendah' },
  { value: 'price-desc', label: 'Harga Tertinggi' },
  { value: 'stock-low', label: 'Stok Terendah' },
];

// ── Component ────────────────────────────────────────────────────────────

export function Products() {
  const { user } = useAppStore();
  const tenantId = user?.tenantId ?? '';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);

  // Fetch categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['owner-categories', tenantId],
    queryFn: () =>
      fetch(`/api/owner/stock?tenantId=${tenantId}`).then((r) => r.json()),
    enabled: !!tenantId,
    select: (d) => d.categories ?? [],
  });

  // Fetch products
  const queryParams = new URLSearchParams({
    tenantId,
    search,
    categoryId: categoryFilter,
    sort,
    page: String(page),
    limit: '20',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['owner-products', tenantId, search, categoryFilter, sort, page],
    queryFn: () => fetch(`/api/owner/products?${queryParams}`).then((r) => r.json()),
    enabled: !!tenantId,
  });

  const products: ProductRow[] = data?.products ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (formData: ProductFormData) => {
      const res = await fetch('/api/owner/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: formData.name,
          categoryId: formData.categoryId || null,
          sku: formData.sku || null,
          barcode: formData.barcode || null,
          buyPrice: Number(formData.buyPrice) || 0,
          sellPrice: Number(formData.sellPrice),
          wholesalePrice: Number(formData.wholesalePrice) || null,
          stock: Number(formData.stock) || 0,
          minStock: Number(formData.minStock) || 5,
          unit: formData.unit,
          description: formData.description || null,
          isFavorite: formData.isFavorite,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal membuat produk');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-products'] });
      toast.success('Produk berhasil ditambahkan');
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleOpenDetail = useCallback((product: ProductRow) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  }, []);

  const handleOpenAdd = useCallback(() => {
    setForm(emptyForm);
    setDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.name.trim() || !form.sellPrice) {
      toast.error('Nama dan harga jual wajib diisi');
      return;
    }
    createMutation.mutate(form);
  }, [form, createMutation]);

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title="Produk"
        description="Kelola katalog produk bisnis Anda"
        icon={Package}
        iconGradient="emerald"
      >
        <Button onClick={handleOpenAdd} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm btn-press">
          <Plus className="h-4 w-4" />
          Tambah Produk
        </Button>
      </PageHeader>

      {/* Filters */}
      <motion.div variants={item} className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama, SKU, barcode..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Semua Kategori</SelectItem>
            {(categoriesData ?? []).map((c: { id: string; name: string }) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table / Empty */}
      <motion.div variants={item}>
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
            title="Belum ada produk"
            message="Tambahkan produk pertama Anda untuk memulai"
            icon="search"
            actionLabel="Tambah Produk"
            onAction={handleOpenAdd}
          />
        ) : (
          <Card className="glass-card card-elevated overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block max-h-[calc(100vh-22rem)] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header-enhanced">
                    <TableHead className="text-xs">Produk</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Kategori</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">SKU</TableHead>
                    <TableHead className="text-xs text-right hidden lg:table-cell">Harga Beli</TableHead>
                    <TableHead className="text-xs text-right">Harga Jual</TableHead>
                    <TableHead className="text-xs text-right">Stok</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => {
                    const isLow = p.stock > 0 && p.stock <= p.minStock;
                    const isOut = p.stock === 0;
                    return (
                      <TableRow
                        key={p.id}
                        className="table-stripe cursor-pointer hover:bg-emerald-500/5 transition-colors"
                        onClick={() => handleOpenDetail(p)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            {p.isFavorite && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{p.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-[10px]">{p.category?.name ?? '-'}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs font-mono text-muted-foreground">{p.sku ?? '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-right text-xs tabular-nums text-muted-foreground">{formatRp(p.buyPrice)}</TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums">{formatRp(p.sellPrice)}</TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm font-medium tabular-nums ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : ''}`}>
                            {p.stock}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">{p.unit}</span>
                        </TableCell>
                        <TableCell>
                          {isOut ? (
                            <Badge variant="destructive" className="badge-gradient-rose text-[10px]">Habis</Badge>
                          ) : isLow ? (
                            <Badge className="badge-gradient-amber text-[10px]">Stok Rendah</Badge>
                          ) : p.isAvailable ? (
                            <Badge variant="default" className="badge-gradient-emerald text-[10px]">Aktif</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Nonaktif</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {/* Mobile Card List */}
            <div className="md:hidden divide-y">
              {products.map((p) => {
                const isLow = p.stock > 0 && p.stock <= p.minStock;
                const isOut = p.stock === 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleOpenDetail(p)}
                    className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 active:bg-muted"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {p.isFavorite && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
                        <p className="text-sm font-medium truncate">{p.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.category?.name ?? '-'}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums">{formatRp(p.sellPrice)}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <span className={`text-xs font-medium tabular-nums ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : ''}`}>
                          {p.stock}{p.unit}
                        </span>
                        {isOut ? (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Habis</Badge>
                        ) : isLow ? (
                          <Badge className="text-[9px] px-1.5 py-0">Rendah</Badge>
                        ) : p.isAvailable ? (
                          <Badge variant="default" className="text-[9px] px-1.5 py-0">Aktif</Badge>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-border/50 px-4 py-3 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} className={page <= 1 ? 'pointer-events-none opacity-50' : ''} />

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === 'ellipsis' ? (
                          <PaginationEllipsis key={`e${i}`} />
                        ) : (
                          <PaginationItem key={p}>
                            <PaginationLink
                              isActive={page === p}
                              onClick={() => setPage(p)}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )}
                    <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={page >= totalPages ? 'pointer-events-none opacity-50' : ''} />
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </Card>
        )}
      </motion.div>

      {/* Add Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gradient-emerald">Tambah Produk Baru</DialogTitle>
            <DialogDescription>Isi detail produk yang akan ditambahkan</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="p-name">Nama Produk *</Label>
              <Input id="p-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Contoh: Kopi Arabika 250g" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="p-sku">SKU</Label>
                <Input id="p-sku" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="PRD-001" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-barcode">Barcode</Label>
                <Input id="p-barcode" value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} placeholder="8991234567890" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Kategori</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {(categoriesData ?? []).map((c: { id: string; name: string }) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="p-buy">Harga Beli</Label>
                <Input id="p-buy" type="number" value={form.buyPrice} onChange={(e) => setForm((f) => ({ ...f, buyPrice: e.target.value }))} placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-sell">Harga Jual *</Label>
                <Input id="p-sell" type="number" value={form.sellPrice} onChange={(e) => setForm((f) => ({ ...f, sellPrice: e.target.value }))} placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-wholesale">Harga Grosir</Label>
                <Input id="p-wholesale" type="number" value={form.wholesalePrice} onChange={(e) => setForm((f) => ({ ...f, wholesalePrice: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="p-stock">Stok</Label>
                <Input id="p-stock" type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-minstock">Min. Stok</Label>
                <Input id="p-minstock" type="number" value={form.minStock} onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-unit">Satuan</Label>
                <Input id="p-unit" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-desc">Deskripsi</Label>
              <Textarea id="p-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Deskripsi singkat produk" rows={3} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isFavorite} onCheckedChange={(v) => setForm((f) => ({ ...f, isFavorite: v }))} />
              <Label className="cursor-pointer">Tandai sebagai favorit (akses cepat di POS)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan Produk'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedProduct && (
            <>
              <SheetHeader>
                <SheetTitle className="text-gradient-emerald">Detail Produk</SheetTitle>
                <SheetDescription>{selectedProduct.name}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <DetailRow label="SKU" value={selectedProduct.sku ?? '-'} />
                <DetailRow label="Barcode" value={selectedProduct.barcode ?? '-'} />
                <DetailRow label="Kategori" value={selectedProduct.category?.name ?? '-'} />
                <DetailRow label="Harga Beli" value={formatRp(selectedProduct.buyPrice)} />
                <DetailRow label="Harga Jual" value={formatRp(selectedProduct.sellPrice)} />
                <DetailRow label="Harga Grosir" value={selectedProduct.wholesalePrice ? formatRp(selectedProduct.wholesalePrice) : '-'} />
                <DetailRow label="Stok" value={`${selectedProduct.stock} ${selectedProduct.unit}`} />
                <DetailRow label="Min. Stok" value={String(selectedProduct.minStock)} />
                {selectedProduct.description && <DetailRow label="Deskripsi" value={selectedProduct.description} />}
                <DetailRow label="Favorit" value={selectedProduct.isFavorite ? 'Ya' : 'Tidak'} />
                <DetailRow label="Dibuat" value={new Date(selectedProduct.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right break-all">{value}</span>
    </div>
  );
}
