'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  UserCog,
  Plus,
  Pencil,
  Ban,
  KeyRound,
  Shield,
  ShoppingBag,
  Crown,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/empty-state';
import { useAppStore } from '@/stores/app-store';
import { toast } from 'sonner';

// ── Helpers ──────────────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  pin: string | null;
  isActive: boolean;
  assignedOutletId: string | null;
  assignedOutlet: { id: string; name: string; code: string } | null;
  createdAt: string;
  lastLoginAt: string | null;
}

const roleConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  business_owner: { label: 'Pemilik', icon: Crown, className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  manager: { label: 'Manager', icon: Shield, className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  cashier: { label: 'Kasir', icon: ShoppingBag, className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const maskPin = (pin: string | null) => {
  if (!pin) return '—';
  return '•'.repeat(pin.length - 1) + pin.slice(-1);
};

// ── Component ────────────────────────────────────────────────────────────

export function Employees() {
  const { user } = useAppStore();
  const tenantId = user?.tenantId ?? '';
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('cashier');
  const [formOutlet, setFormOutlet] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formPhone, setFormPhone] = useState('');

  // Fetch employees
  const { data, isLoading } = useQuery({
    queryKey: ['owner-employees', tenantId],
    queryFn: () => fetch(`/api/owner/employees?tenantId=${tenantId}`).then((r) => r.json()),
    enabled: !!tenantId,
  });

  const employees: Employee[] = data?.users ?? [];
  const outlets = data?.outlets ?? [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/owner/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: formName,
          email: formEmail,
          role: formRole,
          outletId: formOutlet || null,
          pin: formPin || null,
          phone: formPhone || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menambahkan karyawan');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-employees'] });
      toast.success('Karyawan berhasil ditambahkan');
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('cashier');
    setFormOutlet('');
    setFormPin('');
    setFormPhone('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast.error('Nama dan email wajib diisi');
      return;
    }
    createMutation.mutate();
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title="Karyawan"
        description="Kelola tim bisnis Anda"
        icon={UserCog}
        iconGradient="emerald"
      >
        <Button
          onClick={handleOpenAdd}
          className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm btn-press"
        >
          <Plus className="h-4 w-4" />
          Tambah Karyawan
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          title="Belum ada karyawan"
          message="Tambahkan karyawan pertama untuk bisnis Anda"
          icon="users"
          actionLabel="Tambah Karyawan"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const rc = roleConfig[emp.role] ?? roleConfig.cashier;
            const RoleIcon = rc.icon;
            return (
              <motion.div key={emp.id} variants={item}>
                <Card className="glass-card card-elevated hover-glow-border hover-lift-surface transition-all duration-300 h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3.5">
                      <Avatar className="h-11 w-11 shrink-0 border-2 border-border">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-sm font-semibold">
                          {getInitials(emp.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold truncate">{emp.name}</p>
                          {emp.isActive ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{emp.email}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] gap-1 ${rc.className}`}>
                          <RoleIcon className="h-3 w-3" />
                          {rc.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {emp.assignedOutlet && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Outlet</span>
                          <span className="font-medium">{emp.assignedOutlet.name}</span>
                        </div>
                      )}
                      {emp.phone && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Telepon</span>
                          <span className="font-medium">{emp.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">PIN</span>
                        <span className="font-mono font-medium">{maskPin(emp.pin)}</span>
                      </div>
                      {emp.lastLoginAt && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Login Terakhir</span>
                          <span className="font-medium">
                            {new Date(emp.lastLoginAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs flex-1">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className={`h-8 gap-1.5 text-xs flex-1 ${!emp.isActive ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {emp.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        {emp.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gradient-emerald">Tambah Karyawan Baru</DialogTitle>
            <DialogDescription>Isi data karyawan yang akan ditambahkan</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="e-name">Nama Lengkap *</Label>
              <Input id="e-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nama lengkap karyawan" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="e-email">Email *</Label>
              <Input id="e-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@contoh.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Role *</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">
                      <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-emerald-500" /> Manager</div>
                    </SelectItem>
                    <SelectItem value="cashier">
                      <div className="flex items-center gap-2"><ShoppingBag className="h-3.5 w-3.5 text-blue-500" /> Kasir</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Outlet</Label>
                <Select value={formOutlet} onValueChange={setFormOutlet}>
                  <SelectTrigger><SelectValue placeholder="Pilih outlet" /></SelectTrigger>
                  <SelectContent>
                    {outlets.map((o: { id: string; name: string }) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="e-pin">PIN (4-6 digit)</Label>
                <Input id="e-pin" type="password" maxLength={6} value={formPin} onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="tracking-widest" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="e-phone">Telepon</Label>
                <Input id="e-phone" type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan Karyawan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
