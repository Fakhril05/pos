'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User,
  CreditCard,
  Bell,
  Shield,
  Save,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  QrCode,
  Building,
  Wallet,
  Landmark,
  Smartphone,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Zap,
  Clock,
  Send,
  XCircle,
  Download,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings as SettingsIcon } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ── Payment method types ─────────────────────────────────────────────────────

interface PaymentMethodConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  feeRate: number;
  minAmount: number;
  maxAmount: number;
}

interface NotificationConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  description: string;
}

// ── Profil Tab ────────────────────────────────────────────────────────────────

function ProfilTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    businessName: 'Pos Ril Indonesia',
    email: 'admin@posril.id',
    phone: '+62 812 3456 7890',
    address: 'Jl. Sudirman No. 123, Jakarta Selatan 12190',
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/settings/profil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan profil');
      }
      return res.json();
    },
    onMutate: async (data) => {
      // Optimistic update: UI already reflects the new values via form state
      return { previousData: form };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-profil'] });
      toast.success('Profil berhasil disimpan');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menyimpan profil');
    },
  });

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  const saving = saveMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Logo Upload */}
      <Card className="card-hover hover-glow-border">
        <CardHeader>
          <CardTitle className="text-base">Logo Bisnis</CardTitle>
          <CardDescription>
            Upload logo yang akan ditampilkan di halaman pembayaran
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 shadow-lg">
                <span className="text-2xl font-bold text-white">PR</span>
              </div>
              <div className="absolute -bottom-2 -right-2">
                <button className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-emerald-500 text-white shadow-md transition-colors hover:bg-emerald-600">
                  <Upload className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground">
                Format yang didukung: PNG, JPG, SVG. Ukuran maksimal 2MB.
              </p>
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="h-3.5 w-3.5" />
                Ganti Logo
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive">
                Hapus
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Info */}
      <Card className="card-hover hover-glow-border">
        <CardHeader>
          <CardTitle className="text-base">Informasi Bisnis</CardTitle>
          <CardDescription>
            Data bisnis yang akan ditampilkan ke pelanggan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nama Bisnis</Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, businessName: e.target.value }))
                }
                className="border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800"
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                className="border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800"
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm btn-press"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Pembayaran Tab ───────────────────────────────────────────────────────────

function PembayaranTab() {
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([
    {
      id: 'qris',
      label: 'QRIS',
      icon: <QrCode className="h-4 w-4" />,
      enabled: true,
      feeRate: 0.7,
      minAmount: 1000,
      maxAmount: 10000000,
    },
    {
      id: 'bank_transfer',
      label: 'Bank Transfer',
      icon: <Landmark className="h-4 w-4" />,
      enabled: true,
      feeRate: 4000,
      minAmount: 10000,
      maxAmount: 50000000,
    },
    {
      id: 'ewallet',
      label: 'E-Wallet',
      icon: <Smartphone className="h-4 w-4" />,
      enabled: true,
      feeRate: 2.0,
      minAmount: 1000,
      maxAmount: 20000000,
    },
    {
      id: 'va',
      label: 'Virtual Account',
      icon: <Building className="h-4 w-4" />,
      enabled: true,
      feeRate: 5000,
      minAmount: 10000,
      maxAmount: 100000000,
    },
    {
      id: 'cc',
      label: 'Kartu Kredit',
      icon: <CreditCard className="h-4 w-4" />,
      enabled: false,
      feeRate: 3.5,
      minAmount: 10000,
      maxAmount: 50000000,
    },
  ]);

  const [saving, setSaving] = useState(false);

  const toggleMethod = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
    );
  };

  const updateMethod = (id: string, field: keyof PaymentMethodConfig, value: number) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast.success('Pengaturan pembayaran berhasil disimpan');
  };

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Global limits */}
      <Card className="card-hover hover-glow-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-base">Batas Transaksi Global</CardTitle>
          </div>
          <CardDescription>
            Batas minimum dan maksimum untuk semua transaksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Minimum Transaksi</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  Rp
                </span>
                <Input
                  type="number"
                  defaultValue={1000}
                  className="pl-10 border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Maksimum Transaksi</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  Rp
                </span>
                <Input
                  type="number"
                  defaultValue={100000000}
                  className="pl-10 border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-method config */}
      {methods.map((method, i) => (
        <motion.div
          key={method.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <Card className={method.enabled ? '' : 'opacity-60 card-hover'}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                {/* Left: Toggle + Info */}
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      method.enabled
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-sm'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {method.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{method.label}</p>
                      <Badge
                        variant={method.enabled ? 'default' : 'secondary'}
                        className={
                          method.enabled
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : ''
                        }
                      >
                        {method.enabled ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Biaya {method.feeRate <= 1 ? `${method.feeRate}%` : formatRp(method.feeRate)} per transaksi
                    </p>
                  </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Biaya</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={method.feeRate}
                        onChange={(e) =>
                          updateMethod(method.id, 'feeRate', parseFloat(e.target.value) || 0)
                        }
                        className="h-9 text-xs border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800"
                        disabled={!method.enabled}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Min (Rp)</Label>
                      <Input
                        type="number"
                        value={method.minAmount}
                        onChange={(e) =>
                          updateMethod(method.id, 'minAmount', parseInt(e.target.value) || 0)
                        }
                        className="h-9 text-xs border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800"
                        disabled={!method.enabled}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Maks (Rp)</Label>
                      <Input
                        type="number"
                        value={method.maxAmount}
                        onChange={(e) =>
                          updateMethod(method.id, 'maxAmount', parseInt(e.target.value) || 0)
                        }
                        className="h-9 text-xs border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800"
                        disabled={!method.enabled}
                      />
                    </div>
                  </div>
                  <Separator orientation="vertical" className="hidden h-10 lg:block" />
                  <Switch
                    checked={method.enabled}
                    onCheckedChange={() => toggleMethod(method.id)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm btn-press"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Notifikasi Tab ───────────────────────────────────────────────────────────

function NotifikasiTab() {
  const [notifications, setNotifications] = useState<NotificationConfig[]>([
    {
      id: 'email',
      label: 'Email',
      icon: <Mail className="h-4 w-4" />,
      enabled: true,
      description: 'Kirim notifikasi transaksi via email',
    },
    {
      id: 'webhook',
      label: 'Webhook',
      icon: <Key className="h-4 w-4" />,
      enabled: true,
      description: 'Kirim event ke endpoint webhook Anda',
    },
    {
      id: 'sms',
      label: 'SMS',
      icon: <MessageSquare className="h-4 w-4" />,
      enabled: false,
      description: 'Kirim notifikasi penting via SMS',
    },
  ]);

  const [webhookUrl, setWebhookUrl] = useState('https://api.example.com/webhook/payment');
  const [saving, setSaving] = useState(false);

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast.success('Pengaturan notifikasi berhasil disimpan');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Notification Toggles */}
      <Card className="card-hover hover-glow-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-base">Jenis Notifikasi</CardTitle>
          </div>
          <CardDescription>
            Pilih kanal notifikasi yang ingin diaktifkan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between rounded-xl border border-border/50 p-4 transition-colors hover:bg-muted/30">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      notif.enabled
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {notif.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{notif.label}</p>
                    <p className="text-muted-foreground text-xs">{notif.description}</p>
                  </div>
                </div>
                <Switch
                  checked={notif.enabled}
                  onCheckedChange={() => toggleNotification(notif.id)}
                />
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Webhook URL */}
      {notifications.find((n) => n.id === 'webhook')?.enabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="card-hover hover-glow-border">
            <CardHeader>
              <CardTitle className="text-base">Konfigurasi Webhook</CardTitle>
              <CardDescription>
                Endpoint yang akan menerima event notifikasi pembayaran
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.example.com/webhook/payment"
                  className="border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800 font-mono text-sm"
                />
              </div>

              <Separator />

              {/* Event types */}
              <div>
                <Label className="text-sm mb-3 block">Event yang Dikirim</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'payment.success',
                    'payment.failed',
                    'payment.expired',
                    'refund.created',
                    'refund.processed',
                    'payout.processed',
                  ].map((event) => (
                    <Badge
                      key={event}
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50 cursor-default"
                    >
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Test webhook */}
              <Button variant="outline" className="gap-2" onClick={() => toast.info('Test webhook dikirim')}>
                <Bell className="h-3.5 w-3.5" />
                Kirim Test Webhook
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm btn-press"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Keamanan Tab ──────────────────────────────────────────────────────────────

function KeamananTab() {
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPassword: '',
    confirm: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  const apiKey = 'prl_sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

  const maskedApiKey = `${apiKey.slice(0, 8)}${'•'.repeat(24)}${apiKey.slice(-4)}`;

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.newPassword || !passwordForm.confirm) {
      toast.error('Semua field password harus diisi');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      toast.error('Password baru dan konfirmasi tidak cocok');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter');
      return;
    }

    setChangingPassword(true);
    await new Promise((r) => setTimeout(r, 1500));
    setChangingPassword(false);
    setPasswordForm({ current: '', newPassword: '', confirm: '' });
    toast.success('Password berhasil diubah');
  };

  const handleRegenerate = async () => {
    setShowRegenerateDialog(false);
    toast.success('API Key baru telah digenerate');
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API Key disalin ke clipboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Change Password */}
      <Card className="card-hover hover-glow-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-base">Ubah Password</CardTitle>
          </div>
          <CardDescription>
            Perbarui password akun Anda secara berkala untuk keamanan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password Saat Ini</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                value={passwordForm.current}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, current: e.target.value }))
                }
                placeholder="Masukkan password saat ini"
                className="pr-10 border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))
                  }
                  placeholder="Minimal 8 karakter"
                  className="pr-10 border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={passwordForm.confirm}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, confirm: e.target.value }))
                  }
                  placeholder="Ulangi password baru"
                  className="pr-10 border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm btn-press"
            >
              {changingPassword ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {changingPassword ? 'Mengubah...' : 'Ubah Password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Toggle */}
      <Card className="card-hover hover-glow-border">
        <CardHeader>
          <CardTitle className="text-base">Autentikasi Dua Faktor (2FA)</CardTitle>
          <CardDescription>
            Tambahkan lapisan keamanan ekstra untuk akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-xl border border-border/50 p-4 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  twoFA
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {twoFA ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {twoFA ? '2FA Diaktifkan' : '2FA Nonaktif'}
                </p>
                <p className="text-muted-foreground text-xs">
                  {twoFA
                    ? 'Akun Anda terlindungi dengan autentikasi dua faktor'
                    : 'Aktifkan untuk meningkatkan keamanan akun'}
                </p>
              </div>
            </div>
            <Switch checked={twoFA} onCheckedChange={(checked) => {
              setTwoFA(checked);
              toast.success(checked ? '2FA diaktifkan' : '2FA dinonaktifkan');
            }} />
          </div>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card className="card-hover hover-glow-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-base">API Key</CardTitle>
          </div>
          <CardDescription>
            Gunakan API key untuk mengakses API Pos Ril dari aplikasi Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Live API Key</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  readOnly
                  type={apiKeyVisible ? 'text' : 'password'}
                  value={apiKeyVisible ? apiKey : maskedApiKey}
                  className="font-mono text-sm border-emerald-200 dark:border-emerald-800 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setApiKeyVisible(!apiKeyVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {apiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyApiKey}
                className="shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-600 dark:text-emerald-400"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Jangan bagikan API key Anda kepada siapa pun. Regenerate akan membatalkan key sebelumnya secara permanen.
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => setShowRegenerateDialog(true)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate API Key
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyApiKey} className="gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              Salin Key
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Regenerate Confirm Dialog */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan membuat API key baru dan membatalkan key saat ini secara permanen.
              Semua integrasi yang menggunakan key lama akan berhenti berfungsi. Tindakan ini
              tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerate}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Ya, Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

// ── Main Settings Component ───────────────────────────────────────────────────

// ── Webhook Tab ─────────────────────────────────────────────────────────────

interface WebhookLog {
  id: string;
  eventType: string;
  url: string;
  statusCode: string;
  responseTime: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  retryCount: number;
}

const MOCK_WEBHOOK_LOGS: WebhookLog[] = [
  { id: 'wh_001', eventType: 'payment.success', url: 'https://tokowarung.com/api/webhook/payment', statusCode: '200', responseTime: '234ms', timestamp: '2 menit yang lalu', status: 'success', retryCount: 0 },
  { id: 'wh_002', eventType: 'payment.success', url: 'https://bukakios.id/webhooks/posril', statusCode: '200', responseTime: '189ms', timestamp: '5 menit yang lalu', status: 'success', retryCount: 0 },
  { id: 'wh_003', eventType: 'payment.failed', url: 'https://tokowarung.com/api/webhook/payment', statusCode: '500', responseTime: '1203ms', timestamp: '12 menit yang lalu', status: 'failed', retryCount: 2 },
  { id: 'wh_004', eventType: 'refund.created', url: 'https://bukakios.id/webhooks/posril', statusCode: '200', responseTime: '312ms', timestamp: '18 menit yang lalu', status: 'success', retryCount: 0 },
  { id: 'wh_005', eventType: 'payment.expired', url: 'https://warungdigital.my.id/hook', statusCode: 'timeout', responseTime: '30000ms', timestamp: '25 menit yang lalu', status: 'pending', retryCount: 3 },
  { id: 'wh_006', eventType: 'payment.success', url: 'https://tokoemak.com/payments/callback', statusCode: '200', responseTime: '156ms', timestamp: '32 menit yang lalu', status: 'success', retryCount: 0 },
  { id: 'wh_007', eventType: 'payout.processed', url: 'https://tokowarung.com/api/webhook/payment', statusCode: '200', responseTime: '267ms', timestamp: '45 menit yang lalu', status: 'success', retryCount: 0 },
  { id: 'wh_008', eventType: 'payment.failed', url: 'https://warungdigital.my.id/hook', statusCode: '502', responseTime: '890ms', timestamp: '1 jam yang lalu', status: 'failed', retryCount: 1 },
  { id: 'wh_009', eventType: 'payment.success', url: 'https://bukakios.id/webhooks/posril', statusCode: '200', responseTime: '201ms', timestamp: '1 jam yang lalu', status: 'success', retryCount: 0 },
  { id: 'wh_010', eventType: 'refund.created', url: 'https://tokoemak.com/payments/callback', statusCode: '200', responseTime: '445ms', timestamp: '2 jam yang lalu', status: 'success', retryCount: 0 },
];

const EVENT_SUBSCRIPTIONS = [
  { id: 'payment.success', label: 'Pembayaran Berhasil', description: 'Dikirim saat pembayaran berhasil' },
  { id: 'payment.failed', label: 'Pembayaran Gagal', description: 'Dikirim saat pembayaran gagal' },
  { id: 'payment.expired', label: 'Pembayaran Kedaluwarsa', description: 'Dikirim saat pembayaran expired' },
  { id: 'refund.created', label: 'Refund Dibuat', description: 'Dikirim saat refund baru dibuat' },
  { id: 'payout.processed', label: 'Payout Diproses', description: 'Dikirim saat payout berhasil diproses' },
];

function WebhookTab() {
  const [webhookUrl, setWebhookUrl] = useState('https://tokowarung.com/api/webhook/payment');
  const [secretKey, setSecretKey] = useState('whsec_ril_a1b2c3d4e5f6g7h8i9j0');
  const [showSecret, setShowSecret] = useState(false);
  const [webhookActive, setWebhookActive] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>({
    'payment.success': true,
    'payment.failed': true,
    'payment.expired': false,
    'refund.created': true,
    'payout.processed': true,
  });
  const [testLoading, setTestLoading] = useState(false);

  const handleTestWebhook = async () => {
    setTestLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setTestLoading(false);
    toast.success('Test webhook berhasil dikirim!', {
      description: 'Payload percobaan telah dikirim ke endpoint Anda.',
    });
  };

  const handleResend = (id: string) => {
    toast.success(`Mengirim ulang webhook ${id}...`, {
      description: 'Webhook akan dikirim ulang ke endpoint.',
    });
  };

  const getEventBadge = (status: WebhookLog['status']) => {
    const map = {
      success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return map[status];
  };

  const getEventLabel = (status: WebhookLog['status']) => {
    const map = {
      success: 'Berhasil',
      failed: 'Gagal',
      pending: 'Pending',
    };
    return map[status];
  };

  const getStatusCodeColor = (code: string) => {
    if (code === '200') return 'text-emerald-600 dark:text-emerald-400';
    if (code === 'timeout') return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const truncateUrl = (url: string, maxLen = 40) => {
    return url.length > maxLen ? url.substring(0, maxLen) + '...' : url;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Webhook Configuration */}
      <Card className="card-hover hover-glow-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-emerald-500" />
            Konfigurasi Webhook
          </CardTitle>
          <CardDescription>
            Atur endpoint webhook untuk menerima notifikasi event secara real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">URL Endpoint</Label>
              <Input
                id="webhookUrl"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://contoh.com/api/webhook"
                className="border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <div className="relative">
                <Input
                  id="secretKey"
                  type={showSecret ? 'text' : 'password'}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="border-emerald-200 pr-10 focus-visible:ring-emerald-500 dark:border-emerald-800"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Status Webhook</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {webhookActive ? 'Webhook aktif dan siap menerima event' : 'Webhook dinonaktifkan'}
              </p>
            </div>
            <Switch checked={webhookActive} onCheckedChange={setWebhookActive} />
          </div>
          <Button
            onClick={handleTestWebhook}
            disabled={testLoading || !webhookUrl}
            className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm btn-press"
          >
            {testLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {testLoading ? 'Mengirim...' : 'Kirim Test Webhook'}
          </Button>
        </CardContent>
      </Card>

      {/* Event Subscriptions */}
      <Card className="card-hover hover-glow-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-emerald-500" />
            Langganan Event
          </CardTitle>
          <CardDescription>
            Pilih event yang ingin diterima melalui webhook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {EVENT_SUBSCRIPTIONS.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={subscriptions[event.id]}
                  onCheckedChange={(checked) =>
                    setSubscriptions((s) => ({ ...s, [event.id]: !!checked }))
                  }
                  className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <div>
                  <p className="text-sm font-medium">{event.label}</p>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {event.id}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Delivery Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="card-hover hover-glow-border">
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Terkirim</p>
                <p className="text-lg font-bold">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover hover-glow-border">
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gagal</p>
                <p className="text-lg font-bold">23</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover hover-glow-border">
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rata-rata Response</p>
                <p className="text-lg font-bold">189ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover hover-glow-border">
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Success Rate</p>
                <p className="text-lg font-bold">98.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Delivery Logs */}
      <Card className="card-hover hover-glow-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-emerald-500" />
          Log Pengiriman Terbaru
          </CardTitle>
          <CardDescription>
            Riwayat pengiriman webhook 10 terakhir
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto -mx-6 px-6">
            <Table className="table-stripe">
              <TableHeader className="table-header-enhanced">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs">Event Type</TableHead>
                  <TableHead className="text-xs">URL</TableHead>
                  <TableHead className="text-xs">Status Code</TableHead>
                  <TableHead className="text-xs">Response Time</TableHead>
                  <TableHead className="text-xs">Waktu</TableHead>
                  <TableHead className="text-xs text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_WEBHOOK_LOGS.map((log) => (
                  <TableRow key={log.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getEventBadge(log.status)}>
                          {log.eventType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{getEventLabel(log.status)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs" title={log.url}>
                      {truncateUrl(log.url)}
                    </TableCell>
                    <TableCell>
                      <span className={`font-mono text-xs font-semibold ${getStatusCodeColor(log.statusCode)}`}>
                        {log.statusCode}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.responseTime}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{log.timestamp}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {log.retryCount > 0 && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <RefreshCw className="h-3 w-3" />
                            {log.retryCount}x
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                          onClick={() => handleResend(log.id)}
                        >
                          <Send className="h-3 w-3" />
                          Kirim Ulang
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile Card List */}
          <div className="md:hidden divide-y">
            {MOCK_WEBHOOK_LOGS.map((log) => (
              <div key={log.id} className="p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getEventBadge(log.status)}>{log.eventType}</Badge>
                    <span className={`font-mono text-xs font-semibold ${getStatusCodeColor(log.statusCode)}`}>{log.statusCode}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 shrink-0"
                    onClick={() => handleResend(log.id)}
                  >
                    <Send className="h-3 w-3" />
                    Ulang
                  </Button>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground truncate" title={log.url}>{log.url}</p>
                <p className="text-[10px] text-muted-foreground">{log.responseTime} · {log.timestamp}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main Settings Component ─────────────────────────────────────────────────

// ── Export helpers ─────────────────────────────────────────────────────────

const escCsv = (v: string | null | undefined) => {
  if (!v) return '';
  return `"${v.replace(/"/g, '""')}"`;
};

const downloadBlob = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

// ── Main Settings Component ─────────────────────────────────────────────────

export default function Settings() {
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = useCallback(() => {
    setExporting(true);
    const loadingToast = toast.loading('Menyiapkan cetak PDF...');
    try {
      window.print();
      toast.success('Dialog cetak PDF dibuka', { id: loadingToast });
    } catch {
      toast.error('Gagal membuka dialog cetak', { id: loadingToast });
    } finally {
      setExporting(false);
    }
  }, []);

  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    const loadingToast = toast.loading('Mengunduh data transaksi...');
    try {
      const res = await fetch('/api/transactions?limit=1000');
      if (!res.ok) throw new Error('Gagal mengambil data');
      const json = await res.json();
      const transactions = json.data || json;

      const header = 'Invoice No,Merchant,Pelanggan,Jumlah,Fee,Net Amount,Metode,Channel,Status,Tanggal Bayar,Tanggal Buat';
      const rows = transactions.map((tx: Record<string, unknown>) => {
        const merchant = tx.merchant as Record<string, string> | null;
        return [
          escCsv(tx.invoiceNo as string),
          escCsv(merchant?.name ?? (tx.merchantName as string)),
          escCsv(tx.customerName as string),
          tx.amount ?? 0,
          tx.fee ?? 0,
          tx.netAmount ?? 0,
          escCsv(tx.paymentMethod as string),
          escCsv(tx.paymentChannel as string),
          escCsv(tx.status as string),
          tx.paidAt ? new Date(tx.paidAt as string).toLocaleString('id-ID') : '',
          tx.createdAt ? new Date(tx.createdAt as string).toLocaleString('id-ID') : '',
        ].join(',');
      });

      const csv = [header, ...rows].join('\n');
      downloadBlob(csv, `pengaturan-transaksi-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Ekspor CSV berhasil!', { id: loadingToast });
    } catch {
      toast.error('Gagal mengekspor. Silakan coba lagi.', { id: loadingToast });
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <div className="space-y-6 bg-mesh animate-fade-in-up">
      <PageHeader
        title="Pengaturan"
        description="Konfigurasi akun, webhook, dan metode pembayaran"
        icon={SettingsIcon}
        iconGradient="emerald"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="btn-press gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              disabled={exporting}
            >
              <Download className="h-4 w-4" />
              Ekspor Data
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={handleExportPDF}
              className="cursor-pointer gap-2"
            >
              <FileText className="h-4 w-4 text-emerald-500" />
              <div className="flex flex-col">
                <span className="font-medium">Ekspor PDF</span>
                <span className="text-xs text-muted-foreground">Cetak halaman sebagai PDF</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleExportCSV}
              className="cursor-pointer gap-2"
            >
              <Download className="h-4 w-4 text-teal-500" />
              <div className="flex flex-col">
                <span className="font-medium">Ekspor CSV</span>
                <span className="text-xs text-muted-foreground">Unduh data transaksi</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="gradient-border">
          <CardContent className="p-1">
            <Tabs defaultValue="profil" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto overflow-x-auto scrollbar-none">
                <TabsTrigger
                  value="profil"
                  className="relative gap-1.5 rounded-none border-b-2 border-transparent px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none dark:data-[state=active]:text-emerald-400"
                >
                  <User className="h-4 w-4" />
                  Profil
                </TabsTrigger>
                <TabsTrigger
                  value="pembayaran"
                  className="relative gap-1.5 rounded-none border-b-2 border-transparent px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none dark:data-[state=active]:text-emerald-400"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Pembayaran</span>
                  <span className="sm:hidden">Bayar</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notifikasi"
                  className="relative gap-1.5 rounded-none border-b-2 border-transparent px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none dark:data-[state=active]:text-emerald-400"
                >
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notifikasi</span>
                  <span className="sm:hidden">Notif</span>
                </TabsTrigger>
                <TabsTrigger
                  value="keamanan"
                  className="relative gap-1.5 rounded-none border-b-2 border-transparent px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none dark:data-[state=active]:text-emerald-400"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Keamanan</span>
                  <span className="sm:hidden">Aman</span>
                </TabsTrigger>
                <TabsTrigger
                  value="webhook"
                  className="relative gap-1.5 rounded-none border-b-2 border-transparent px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none dark:data-[state=active]:text-emerald-400"
                >
                  <Globe className="h-4 w-4" />
                  Webhook
                </TabsTrigger>
              </TabsList>

              <div className="pt-6">
                <TabsContent value="profil">
                  <ProfilTab />
                </TabsContent>
                <TabsContent value="pembayaran">
                  <PembayaranTab />
                </TabsContent>
                <TabsContent value="notifikasi">
                  <NotifikasiTab />
                </TabsContent>
                <TabsContent value="keamanan">
                  <KeamananTab />
                </TabsContent>
                <TabsContent value="webhook">
                  <WebhookTab />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
