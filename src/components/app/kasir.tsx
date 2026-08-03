'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  Check,
  Printer,
  ChevronUp,
  ChevronDown,
  QrCode,
  Wallet,
  CreditCard,
  Building2,
  Calculator,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/app/page-header';
import { cn } from '@/lib/utils';
import { generateReceiptHtml } from '@/lib/receipt-generator';
import { QRCodeSVG } from 'qrcode.react';

// ── Helpers ──────────────────────────────────────────────────────────────

const formatRp = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

// ── Product Data ─────────────────────────────────────────────────────────

type Category = 'Semua' | 'Makanan' | 'Minuman' | 'Snack' | 'Lainnya';

interface Product {
  id: string;
  name: string;
  price: number;
  category: Exclude<Category, 'Semua'>;
  emoji: string;
}

const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Nasi Goreng Spesial', price: 25000, category: 'Makanan', emoji: '🍛' },
  { id: 'p2', name: 'Mie Ayam Bakso', price: 20000, category: 'Makanan', emoji: '🍜' },
  { id: 'p3', name: 'Sate Ayam', price: 30000, category: 'Makanan', emoji: '🍢' },
  { id: 'p4', name: 'Es Teh Manis', price: 8000, category: 'Minuman', emoji: '🧊' },
  { id: 'p5', name: 'Es Jeruk', price: 10000, category: 'Minuman', emoji: '🍊' },
  { id: 'p6', name: 'Kopi Susu', price: 15000, category: 'Minuman', emoji: '☕' },
  { id: 'p7', name: 'Keripik Singkong', price: 12000, category: 'Snack', emoji: '🥔' },
  { id: 'p8', name: 'Pisang Goreng', price: 10000, category: 'Snack', emoji: '🍌' },
  { id: 'p9', name: 'Tahu Crispy', price: 8000, category: 'Snack', emoji: '🧈' },
  { id: 'p10', name: 'Paket Hemat A', price: 35000, category: 'Lainnya', emoji: '🍱' },
  { id: 'p11', name: 'Paket Hemat B', price: 45000, category: 'Lainnya', emoji: '🥘' },
  { id: 'p12', name: 'Menu Premium', price: 55000, category: 'Lainnya', emoji: '🥩' },
  { id: 'p13', name: 'Ayam Geprek', price: 22000, category: 'Makanan', emoji: '🍗' },
  { id: 'p14', name: 'Jus Alpukat', price: 18000, category: 'Minuman', emoji: '🥑' },
  { id: 'p15', name: 'Cireng Isi', price: 10000, category: 'Snack', emoji: '🫓' },
];

const CATEGORIES: Category[] = ['Semua', 'Makanan', 'Minuman', 'Snack', 'Lainnya'];

// ── Payment Methods ───────────────────────────────────────────────────────

interface PaymentMethod {
  id: string;
  method: string;
  channel: string;
  label: string;
  icon: React.ReactNode;
  feePercent: number;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'qris', method: 'qris', channel: 'QRIS', label: 'QRIS', icon: <QrCode className="h-5 w-5" />, feePercent: 0.7 },
  { id: 'gopay', method: 'ewallet', channel: 'GoPay', label: 'GoPay', icon: <Wallet className="h-5 w-5" />, feePercent: 2.0 },
  { id: 'ovo', method: 'ewallet', channel: 'OVO', label: 'OVO', icon: <Wallet className="h-5 w-5" />, feePercent: 2.0 },
  { id: 'dana', method: 'ewallet', channel: 'Dana', label: 'Dana', icon: <Wallet className="h-5 w-5" />, feePercent: 2.0 },
  { id: 'shopeepay', method: 'ewallet', channel: 'ShopeePay', label: 'ShopeePay', icon: <Wallet className="h-5 w-5" />, feePercent: 2.0 },
  { id: 'bank_transfer', method: 'bank_transfer', channel: 'Bank Transfer', label: 'Bank Transfer', icon: <Building2 className="h-5 w-5" />, feePercent: 1.5 },
  { id: 'credit_card', method: 'credit_card', channel: 'Kartu Kredit', label: 'Kartu Kredit', icon: <CreditCard className="h-5 w-5" />, feePercent: 2.9 },
];

// ── Cart Types ────────────────────────────────────────────────────────────

interface CartItem {
  product: Product;
  qty: number;
}

// ── Component ─────────────────────────────────────────────────────────────

export function Kasir() {
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('Semua');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [cartExpanded, setCartExpanded] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'qris' | 'processing' | 'success'>('select');
  const [qrisExpiry, setQrisExpiry] = useState(300); // 5 minutes
  const [qrisInvoice, setQrisInvoice] = useState('');
  const autoCompleteRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastTx, setLastTx] = useState<{
    invoiceNo: string;
    amount: number;
    fee: number;
    netAmount: number;
    paymentMethod: string;
    paymentChannel: string;
    createdAt: string;
    paidAt: string;
    customerName: string | null;
    merchantName: string;
    items: CartItem[];
    subtotal: number;
    tax: number;
  } | null>(null);

  // Fetch merchants for dropdown
  const { data: merchantsData } = useQuery({
    queryKey: ['merchants-list-pos'],
    queryFn: async () => {
      const res = await fetch('/api/merchants?limit=100');
      const json = await res.json();
      return json.data as { id: string; name: string; status: string }[];
    },
  });

  const merchants = merchantsData ?? [];

  // Filtered products
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchCategory = category === 'Semua' || p.category === category;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [category, search]);

  // Cart calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const tax = Math.round(cartTotal * 0.11);
  const totalWithTax = cartTotal + tax;

  // Add to cart
  const addToCart = useCallback(
    (product: Product) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item,
          );
        }
        return [...prev, { product, qty: 1 }];
      });
      toast.success(`${product.name} ditambahkan ke keranjang`);
    },
    [],
  );

  // Update quantity
  const updateQty = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, qty: Math.max(0, item.qty + delta) } : item,
        )
        .filter((item) => item.qty > 0),
    );
  }, []);

  // Remove from cart
  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
    setLastTx(null);
  }, []);

  // Payment mutation
  const payMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMerchant) throw new Error('Pilih merchant terlebih dahulu');
      if (!selectedPayment) throw new Error('Pilih metode pembayaran');

      const res = await fetch('/api/quick-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: selectedMerchant,
          amount: totalWithTax,
          paymentMethod: selectedPayment.method,
          paymentChannel: selectedPayment.channel,
          customerName: customerName || undefined,
          customerEmail: customerEmail || undefined,
          customerPhone: customerPhone || undefined,
          description: notes || undefined,
          items: cart.map((item) => ({
            name: item.product.name,
            qty: item.qty,
            price: item.product.price,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memproses pembayaran');
      return json.data;
    },
    onSuccess: (data) => {
      setPaymentStep('success');
      const merchant = merchants.find((m) => m.id === selectedMerchant);
      setLastTx({
        invoiceNo: data.invoiceNo,
        amount: data.amount,
        fee: data.fee,
        netAmount: data.netAmount,
        paymentMethod: data.paymentMethod,
        paymentChannel: data.paymentChannel,
        createdAt: data.createdAt,
        paidAt: data.paidAt,
        customerName: data.customerName,
        merchantName: merchant?.name ?? 'Unknown',
        items: [...cart],
        subtotal: cartTotal,
        tax,
      });
      queryClient.invalidateQueries({ queryKey: ['quick-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Pembayaran berhasil!');
    },
    onError: (err: Error) => {
      setPaymentStep('select');
      toast.error(err.message);
    },
  });

  // Print receipt
  const printReceipt = useCallback(() => {
    if (!lastTx) return;
    const html = generateReceiptHtml({
      invoiceNo: lastTx.invoiceNo,
      amount: lastTx.amount,
      fee: lastTx.fee,
      netAmount: lastTx.netAmount,
      merchantName: lastTx.merchantName,
      customerName: lastTx.customerName ?? 'Umum',
      paymentMethod: lastTx.paymentMethod,
      paymentChannel: lastTx.paymentChannel,
      status: 'success',
      createdAt: lastTx.createdAt,
      paidAt: lastTx.paidAt,
      description: `Kasir POS - ${lastTx.items.length} item`,
      formattedAmount: formatRp(lastTx.amount),
      formattedFee: formatRp(lastTx.fee),
      formattedNetAmount: formatRp(lastTx.netAmount),
      formattedCreatedAt: new Date(lastTx.createdAt).toLocaleString('id-ID'),
      formattedPaidAt: lastTx.paidAt
        ? new Date(lastTx.paidAt).toLocaleString('id-ID')
        : null,
      statusLabel: 'Berhasil',
    });
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
  }, [lastTx]);

  // QRIS countdown timer
  useEffect(() => {
    if (paymentStep !== 'qris') return;
    const timer = setInterval(() => {
      setQrisExpiry((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentStep]);

  // QRIS auto-complete simulation (5-8 seconds)
  useEffect(() => {
    if (paymentStep !== 'qris') return;
    const delay = 5000 + Math.random() * 3000;
    autoCompleteRef.current = setTimeout(() => {
      setPaymentStep('processing');
      // After 2s processing, actually submit
      setTimeout(() => {
        payMutation.mutate();
      }, 2000);
    }, delay);
    return () => {
      if (autoCompleteRef.current) {
        clearTimeout(autoCompleteRef.current);
      }
    };
  }, [paymentStep]);

  // Open pay dialog
  const handleOpenPay = () => {
    if (cart.length === 0) return;
    setPayDialogOpen(true);
  };

  // Process payment
  const handlePay = () => {
    if (selectedPayment?.method === 'qris') {
      // Show QRIS screen instead of immediately submitting
      setQrisInvoice(`PR-QR-${Date.now().toString(36).toUpperCase()}`);
      setQrisExpiry(300);
      setPaymentStep('qris');
    } else {
      payMutation.mutate();
    }
  };

  // New transaction
  const handleNewTx = () => {
    setCart([]);
    setLastTx(null);
    setPayDialogOpen(false);
    setSelectedPayment(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setNotes('');
    setPaymentStep('select');
    setQrisExpiry(300);
    setQrisInvoice('');
  };

  // Close pay dialog resets payment state
  const handleClosePayDialog = () => {
    setPayDialogOpen(false);
    if (!lastTx) {
      setSelectedPayment(null);
      setPaymentStep('select');
      setQrisExpiry(300);
      setQrisInvoice('');
      if (autoCompleteRef.current) {
        clearTimeout(autoCompleteRef.current);
      }
    }
  };

  return (
    <div className="bg-mesh rounded-2xl p-4 md:p-6">
      <PageHeader
        title="Kasir"
        description="Terminal pembayaran point-of-sale"
        icon={Calculator}
        iconGradient="emerald"
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* ── Left Panel: Product Catalog ── */}
        <div className="min-w-0 flex-1">
          {/* Search & Categories */}
          <div className="card-elevated mb-4 rounded-xl p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
                    category === cat
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="card-elevated rounded-xl p-4">
            <motion.div
              className="grid grid-cols-2 gap-3 md:grid-cols-3"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.03 } },
              }}
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.button
                    key={product.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 12, scale: 0.95 },
                      show: { opacity: 1, y: 0, scale: 1 },
                      exit: { opacity: 0, scale: 0.9, y: -8 },
                    }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(product)}
                    className="card-hover flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-3 text-left"
                  >
                    <span className="text-2xl leading-none">{product.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">{product.name}</p>
                      <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRp(product.price)}
                      </p>
                    </div>
                    <div className="flex w-full items-center justify-end">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredProducts.length === 0 && (
              <div className="empty-state flex flex-col items-center justify-center py-16 text-center">
                <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">Produk tidak ditemukan</p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Coba kata kunci lain atau ubah kategori
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Cart (Desktop) ── */}
        <div className="hidden w-full lg:block lg:w-[380px]">
          <div className="card-elevated sticky top-24 flex h-[calc(100vh-8rem)] flex-col rounded-xl">
            <CartPanel
              cart={cart}
              cartCount={cartCount}
              cartTotal={cartTotal}
              tax={tax}
              totalWithTax={totalWithTax}
              onUpdateQty={updateQty}
              onRemove={removeFromCart}
              onClear={clearCart}
              onPay={handleOpenPay}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile Cart (Bottom Sheet) ── */}
      <div className="fixed right-0 bottom-16 left-0 z-40 lg:hidden">
        <AnimatePresence mode="wait">
          {cart.length > 0 && (
            <motion.div
              key="cart-bar"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="mx-3 overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl"
            >
              {/* Collapsed bar */}
              {!cartExpanded && (
                <button
                  onClick={() => setCartExpanded(true)}
                  className="flex w-full items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <ShoppingBag className="h-5 w-5 text-emerald-500" />
                      <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                        {cartCount}
                      </span>
                    </div>
                    <span className="text-sm font-medium">Keranjang</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRp(totalWithTax)}
                    </span>
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              )}

              {/* Expanded cart */}
              <AnimatePresence>
                {cartExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
                      <CartPanel
                        cart={cart}
                        cartCount={cartCount}
                        cartTotal={cartTotal}
                        tax={tax}
                        totalWithTax={totalWithTax}
                        onUpdateQty={updateQty}
                        onRemove={removeFromCart}
                        onClear={clearCart}
                        onPay={handleOpenPay}
                        onCollapse={() => setCartExpanded(false)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Payment Dialog ── */}
      <Dialog open={payDialogOpen} onOpenChange={handleClosePayDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <AnimatePresence mode="wait">
            {paymentStep === 'qris' ? (
              <motion.div
                key="qris"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col items-center py-2"
              >
                <div className="mb-4 flex w-full items-center gap-3">
                  <button
                    onClick={() => {
                      setPaymentStep('select');
                      setQrisExpiry(300);
                      if (autoCompleteRef.current) {
                        clearTimeout(autoCompleteRef.current);
                      }
                    }}
                    className="btn-press flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-lg font-semibold">Scan QRIS</h2>
                  </div>
                </div>
                <span className="sr-only">Scan kode QRIS untuk menyelesaikan pembayaran</span>
                <div className="relative mb-5">
                  <div className="gradient-border rounded-2xl">
                    <div className="rounded-2xl bg-white p-4 dark:bg-card">
                      <div className="glow-emerald-sm rounded-xl bg-white p-3 dark:bg-card">
                        <QRCodeSVG
                          value={"https://pay.posril.id/qris/" + qrisInvoice}
                          size={200}
                          className="h-[180px] w-[180px] md:h-[200px] md:w-[200px]"
                          level="M"
                          bgColor="transparent"
                          fgColor="#059669"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="animate-float-slow pointer-events-none absolute -inset-2 rounded-2xl opacity-30 bg-gradient-to-t from-emerald-500/10 to-transparent" />
                </div>
                <p className="mb-1 text-2xl font-extrabold text-gradient-emerald tabular-nums">
                  {formatRp(totalWithTax)}
                </p>
                <p className="mb-4 text-xs text-muted-foreground">
                  {qrisInvoice}
                </p>
                <div className="mb-4 flex items-center gap-2">
                  {qrisExpiry === 0 ? (
                    <span className="text-sm font-semibold text-rose-500">Kadaluarsa</span>
                  ) : (
                    <span className={qrisExpiry < 60 ? 'text-sm tabular-nums font-semibold text-rose-500' : 'text-sm tabular-nums text-muted-foreground'}>
                      Berlaku {String(Math.floor(qrisExpiry / 60)).padStart(2, '0')}:{String(qrisExpiry % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
                {qrisExpiry === 0 && (
                  <Button
                    variant="outline"
                    className="btn-press mb-4"
                    onClick={() => {
                      setQrisInvoice("PR-QR-" + Date.now().toString(36).toUpperCase());
                      setQrisExpiry(300);
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Buat Kode Baru
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="status-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-sm text-muted-foreground">Menunggu pembayaran...</span>
                </div>
              </motion.div>
            ) : paymentStep === 'processing' ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col items-center justify-center py-12"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="mb-6"
                >
                  <Loader2 className="h-14 w-14 text-emerald-500" strokeWidth={2} />
                </motion.div>
                <h3 className="mb-2 text-lg font-bold">Memproses pembayaran...</h3>
                <p className="text-sm text-muted-foreground">Mohon tunggu sebentar</p>
                <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-muted">
                  <div className="shimmer h-full w-full rounded-full" />
                </div>
              </motion.div>
            ) : lastTx ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col items-center py-4"
              >
                {/* Animated checkmark */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1,
                  }}
                  className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 glow-emerald-md"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                      delay: 0.3,
                    }}
                  >
                    <Check className="h-10 w-10 text-white" strokeWidth={3} />
                  </motion.div>
                </motion.div>

                <h3 className="text-lg font-bold">Pembayaran Berhasil!</h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  {lastTx.invoiceNo}
                </p>

                {/* Receipt Summary */}
                <div className="w-full rounded-xl border border-border bg-muted/30 p-4">
                  <div className="mb-3 space-y-1.5">
                    {lastTx.items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {item.qty}x {item.product.name}
                        </span>
                        <span className="font-medium">
                          {formatRp(item.product.price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatRp(lastTx.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pajak (PPN 11%)</span>
                      <span>{formatRp(lastTx.tax)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {formatRp(lastTx.amount)}
                      </span>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Metode</span>
                      <span className="font-medium text-foreground">
                        {lastTx.paymentChannel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Merchant</span>
                      <span className="font-medium text-foreground">
                        {lastTx.merchantName}
                      </span>
                    </div>
                    {lastTx.customerName && (
                      <div className="flex justify-between">
                        <span>Pelanggan</span>
                        <span className="font-medium text-foreground">
                          {lastTx.customerName}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Waktu</span>
                      <span className="font-medium text-foreground">
                        {new Date(lastTx.paidAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-6 flex w-full gap-3">
                  <Button
                    variant="outline"
                    className="btn-press flex-1"
                    onClick={printReceipt}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Struk
                  </Button>
                  <Button
                    className="btn-press flex-1 bg-emerald-500 hover:bg-emerald-600"
                    onClick={handleNewTx}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Transaksi Baru
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <DialogHeader>
                  <DialogTitle>Pembayaran</DialogTitle>
                  <DialogDescription>
                    Pilih metode pembayaran untuk melanjutkan
                  </DialogDescription>
                </DialogHeader>

                {/* Total Amount */}
                <div className="my-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 text-center dark:from-emerald-500/15 dark:to-teal-500/10">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Total Pembayaran
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 glow-emerald-sm inline-block">
                    {formatRp(totalWithTax)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cartCount} item · Subtotal {formatRp(cartTotal)} + PPN {formatRp(tax)}
                  </p>
                </div>

                {/* Merchant Selector */}
                <div className="mb-4 space-y-2">
                  <Label className="text-sm font-medium">Merchant</Label>
                  <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih merchant..." />
                    </SelectTrigger>
                    <SelectContent>
                      {merchants
                        .filter((m) => m.status === 'active')
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Methods */}
                <div className="mb-4 space-y-2">
                  <Label className="text-sm font-medium">Metode Pembayaran</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setSelectedPayment(pm)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-200',
                          selectedPayment?.id === pm.id
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'border-border hover:border-emerald-500/30 hover:bg-muted/50',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                            selectedPayment?.id === pm.id
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {pm.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{pm.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Admin {pm.feePercent}%
                          </p>
                        </div>
                        {selectedPayment?.id === pm.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Info (Optional) */}
                <div className="mb-4 space-y-3">
                  <Label className="text-sm font-medium">
                    Info Pelanggan{' '}
                    <span className="font-normal text-muted-foreground">(opsional)</span>
                  </Label>
                  <Input
                    placeholder="Nama pelanggan"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="No. Telepon"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                    <Input
                      placeholder="Email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      type="email"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-4 space-y-2">
                  <Label className="text-sm font-medium">
                    Catatan{' '}
                    <span className="font-normal text-muted-foreground">(opsional)</span>
                  </Label>
                  <Textarea
                    placeholder="Tambahkan catatan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Pay Button */}
                <Button
                  className="btn-press w-full bg-emerald-500 py-6 text-base font-bold hover:bg-emerald-600"
                  size="lg"
                  disabled={
                    !selectedMerchant ||
                    !selectedPayment ||
                    payMutation.isPending
                  }
                  onClick={handlePay}
                >
                  {payMutation.isPending ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="mr-2 inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                    />
                  ) : null}
                  {payMutation.isPending
                    ? 'Memproses Pembayaran...'
                    : 'Proses Pembayaran'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Cart Panel (reused for desktop & mobile) ──────────────────────────────

function CartPanel({
  cart,
  cartCount,
  cartTotal,
  tax,
  totalWithTax,
  onUpdateQty,
  onRemove,
  onClear,
  onPay,
  onCollapse,
}: {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  tax: number;
  totalWithTax: number;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onPay: () => void;
  onCollapse?: () => void;
}) {
  return (
    <>
      {/* Cart Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4.5 w-4.5 text-emerald-500" />
          <span className="text-sm font-semibold">Keranjang</span>
          {cartCount > 0 && (
            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
              {cartCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {cart.length > 0 && (
            <button
              onClick={onClear}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Kosongkan keranjang"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {cart.length === 0 ? (
          <div className="empty-state flex h-full min-h-[200px] flex-col items-center justify-center px-4 py-8 text-center">
            <ShoppingBag className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              Keranjang kosong
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Tap produk untuk menambahkan
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border p-2">
            <AnimatePresence initial={false}>
              {cart.map((item) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, x: 20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 py-2"
                >
                  <span className="text-lg">{item.product.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRp(item.product.price)} / item
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateQty(item.product.id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.product.id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Subtotal & Remove */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold">
                      {formatRp(item.product.price * item.qty)}
                    </span>
                    <button
                      onClick={() => onRemove(item.product.id)}
                      className="text-muted-foreground/60 transition-colors hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Cart Summary & Pay */}
      {cart.length > 0 && (
        <div className="border-t border-border p-4">
          <div className="mb-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatRp(cartTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pajak (11% PPN)</span>
              <span>{formatRp(tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {formatRp(totalWithTax)}
              </span>
            </div>
          </div>
          <Button
            className="btn-press w-full bg-emerald-500 py-5 font-bold hover:bg-emerald-600"
            size="lg"
            onClick={onPay}
          >
            Bayar Sekarang
          </Button>
        </div>
      )}
    </>
  );
}
