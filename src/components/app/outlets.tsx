'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MapPin,
  Plus,
  Phone,
  Printer,
  Users,
  ArrowLeftRight,
  DollarSign,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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

interface OutletData {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  isOpen: boolean;
  printerIp: string | null;
  employeeCount: number;
  totalTransactions: number;
  todayTxCount: number;
  todayRevenue: number;
  createdAt: string;
}

// ── Component ────────────────────────────────────────────────────────────

export function Outlets() {
  const { user } = useAppStore();
  const tenantId = user?.tenantId ?? '';
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPrinterIp, setFormPrinterIp] = useState('');

  // Fetch outlets
  const { data, isLoading } = useQuery({
    queryKey: ['owner-outlets', tenantId],
    queryFn: () => fetch(`/api/owner/outlets?tenantId=${tenantId}`).then((r) => r.json()),
    enabled: !!tenantId,
  });

  const outlets: OutletData[] = data?.outlets ?? [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/owner/outlets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: formName,
          code: formCode,
          address: formAddress || null,
          city: formCity || null,
          phone: formPhone || null,
          printerIp: formPrinterIp || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal membuat outlet');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-outlets'] });
      toast.success('Outlet berhasil ditambahkan');
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isOpen }: { id: string; isOpen: boolean }) => {
      const res = await fetch(`/api/owner/outlets?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, name: '', code: '', _toggleId: id, _isOpen: isOpen }),
      });
      if (!res.ok) throw new Error('Gagal mengubah status outlet');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-outlets'] });
      toast.success('Status outlet diperbarui');
    },
    onError: () => toast.error('Gagal mengubah status outlet'),
  });

  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormAddress('');
    setFormCity('');
    setFormPhone('');
    setFormPrinterIp('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formCode.trim()) {
      toast.error('Nama dan kode outlet wajib diisi');
      return;
    }
    createMutation.mutate();
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title="Outlet / Cabang"
        description="Kelola lokasi bisnis Anda"
        icon={MapPin}
        iconGradient="teal"
      >
        <Button
          onClick={handleOpenAdd}
          className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm btn-press"
        >
          <Plus className="h-4 w-4" />
          Tambah Outlet
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-5 space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : outlets.length === 0 ? (
        <EmptyState
          title="Belum ada outlet"
          message="Tambahkan outlet pertama untuk bisnis Anda"
          icon="search"
          actionLabel="Tambah Outlet"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {outlets.map((outlet) => (
            <motion.div key={outlet.id} variants={item}>
              <Card className="glass-card card-elevated hover-glow-border hover-lift-surface transition-all duration-300 h-full">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-base font-semibold">{outlet.name}</h3>
                        <Badge
                          variant={outlet.isOpen ? 'default' : 'secondary'}
                          className={`text-[10px] ${outlet.isOpen ? 'badge-gradient-emerald' : ''}`}
                        >
                          {outlet.isOpen ? 'Buka' : 'Tutup'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="font-mono">{outlet.code}</span>
                        {outlet.city && <span>· {outlet.city}</span>}
                      </div>
                    </div>
                    <Switch
                      checked={outlet.isOpen}
                      onCheckedChange={() =>
                        toggleMutation.mutate({ id: outlet.id, isOpen: !outlet.isOpen })
                      }
                    />
                  </div>

                  {/* Address */}
                  {outlet.address && (
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{outlet.address}</p>
                  )}

                  {/* Today Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Transaksi</span>
                      </div>
                      <AnimatedCounter
                        value={outlet.todayTxCount}
                        className="text-lg font-bold tabular-nums"
                      />
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendapatan</span>
                      </div>
                      <AnimatedCounter
                        value={outlet.todayRevenue}
                        formatFn={formatRp}
                        className="text-base font-bold tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{outlet.employeeCount} karyawan</span>
                      <span className="text-border">·</span>
                      <span>{outlet.totalTransactions} total transaksi</span>
                    </div>
                    {outlet.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{outlet.phone}</span>
                      </div>
                    )}
                    {outlet.printerIp && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Printer className="h-3.5 w-3.5" />
                        <span className="font-mono">{outlet.printerIp}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Outlet Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gradient-emerald">Tambah Outlet Baru</DialogTitle>
            <DialogDescription>Isi detail outlet / cabang baru</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="o-name">Nama Outlet *</Label>
                <Input id="o-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Cabang Sudirman" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="o-code">Kode *</Label>
                <Input id="o-code" value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase())} placeholder="OUT-002" className="font-mono" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="o-address">Alamat</Label>
              <Input id="o-address" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Jl. Sudirman No. 123" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="o-city">Kota</Label>
                <Input id="o-city" value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder="Jakarta" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="o-phone">Telepon</Label>
                <Input id="o-phone" type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="02112345678" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="o-printer">IP Printer (Struk Thermal)</Label>
              <Input id="o-printer" value={formPrinterIp} onChange={(e) => setFormPrinterIp(e.target.value)} placeholder="192.168.1.100" className="font-mono" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan Outlet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
