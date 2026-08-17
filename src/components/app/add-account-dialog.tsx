'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Eye, EyeOff, UserPlus, Building2, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

// Zod schema
const createUserSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['business_owner', 'manager', 'cashier'], {
    message: 'Pilih role',
  }),
  isActive: z.boolean(),
  tenantId: z.string().optional(),
})

type CreateUserForm = z.infer<typeof createUserSchema>

interface AddAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddAccountDialog({ open, onOpenChange }: AddAccountDialogProps) {
  const [showPassword, setShowPassword] = useState(false)
  const queryClient = useQueryClient()

  // Fetch daftar tenant untuk dropdown
  const { data: tenants } = useQuery({
    queryKey: ['tenants-select'],
    queryFn: () => fetch('/api/super-admin/tenants').then((r) => r.json()),
    enabled: open,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isValid },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'business_owner',
      isActive: true,
      tenantId: undefined,
    },
  })

  const selectedRole = watch('role')
  const isActive = watch('isActive', true)

  // Mutation: buat user baru
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        // Set field errors dari server response
        if (json.details) {
          Object.entries(json.details).forEach(([field, msg]) => {
            setError(field as keyof CreateUserForm, { message: msg as string })
          })
        }
        throw new Error(json.error || 'Gagal membuat akun')
      }
      return json
    },
    onSuccess: (data: any) => {
      toast.success(data.message || 'Akun berhasil dibuat!')
      reset()
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ['super-admin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenants'] })
    },
    onError: (error: Error) => {
      if (!error.message.includes('validasi') && !error.message.includes('Email')) {
        toast.error(error.message)
      }
    },
  })

  const onSubmit = (data: CreateUserForm) => {
    // Jika role business_owner, tenantId tidak perlu dikirim
    if (data.role === 'business_owner') {
      delete data.tenantId
    }
    createUserMutation.mutate(data)
  }

  const roleOptions = [
    { value: 'business_owner', label: 'Merchant', icon: <Building2 className="h-4 w-4" />, desc: 'Pemilik bisnis / tenant baru' },
    { value: 'manager', label: 'Manager', icon: <User className="h-4 w-4" />, desc: 'Manager outlet' },
    { value: 'cashier', label: 'Kasir', icon: <UserPlus className="h-4 w-4" />, desc: 'Kasir POS' },
  ]

  const isSubmitting = createUserMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isSubmitting) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-emerald">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            Tambah Akun Baru
          </DialogTitle>
          <DialogDescription>
            Buat akun baru untuk Merchant atau Pengguna. Merchant otomatis mendapat tenant & paket free.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nama */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" placeholder="contoh: Budi Santoso" {...register('name')} disabled={isSubmitting} className={errors.name ? 'border-destructive' : ''} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="contoh: budi@email.com" {...register('email')} disabled={isSubmitting} className={errors.email ? 'border-destructive' : ''} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Minimal 6 karakter" {...register('password')} disabled={isSubmitting} className={errors.password ? 'border-destructive pr-10' : 'pr-10'} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select defaultValue="business_owner" onValueChange={(v) => setValue('role', v as CreateUserForm['role'], { shouldValidate: true })} disabled={isSubmitting}>
              <SelectTrigger className={errors.role ? 'border-destructive' : ''}><SelectValue placeholder="Pilih role" /></SelectTrigger>
              <SelectContent>
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">{opt.icon}<div><span className="font-medium">{opt.label}</span><span className="ml-2 text-xs text-muted-foreground">{opt.desc}</span></div></div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          {/* Tenant dropdown — hanya untuk manager/cashier */}
          {selectedRole !== 'business_owner' && (
            <div className="space-y-2">
              <Label>Tenant</Label>
              <Select onValueChange={(v) => setValue('tenantId', v)} disabled={isSubmitting}>
                <SelectTrigger><SelectValue placeholder="Pilih tenant" /></SelectTrigger>
                <SelectContent>
                  {tenants && tenants.length > 0
                    ? tenants.map((t: { id: string; name: string }) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))
                    : <SelectItem value="_none" disabled>Belum ada tenant</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div><p className="text-sm font-medium">Status Aktif</p><p className="text-xs text-muted-foreground">Akun bisa langsung digunakan</p></div>
            <Switch checked={isActive} onCheckedChange={(v) => setValue('isActive', v)} disabled={isSubmitting} />
          </div>

          {/* Info card */}
          {selectedRole === 'business_owner' && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✨ Otomatis dibuat:</p>
              <p className="text-xs text-muted-foreground mt-1">Tenant baru + Paket Free (1 outlet, 5 pengguna, 100 produk)</p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" disabled={isSubmitting || !isValid} className="bg-emerald-600 hover:bg-emerald-700">
              {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>) : (<><UserPlus className="mr-2 h-4 w-4" />Buat Akun</>)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
