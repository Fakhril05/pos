'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/stores/app-store'
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, UserCheck, BarChart3, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const demoAccounts = [
  {
    label: 'Super Admin',
    email: 'admin@posril.id',
    password: 'password',
    description: 'Akses platform penuh',
    icon: <Shield className="h-4 w-4" />,
    color: 'from-rose-500/20 to-rose-500/5 border-rose-500/20 hover:border-rose-500/40',
    textColor: 'text-rose-400',
  },
  {
    label: 'Pemilik Bisnis',
    email: 'owner1@makmur.id',
    password: 'password',
    description: 'Toko Makmur Jaya',
    icon: <UserCheck className="h-4 w-4" />,
    color: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
    textColor: 'text-amber-400',
  },
  {
    label: 'Manager',
    email: 'manager1@makmur.id',
    password: 'password',
    description: 'Kelola outlet & stok',
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'from-sky-500/20 to-sky-500/5 border-sky-500/20 hover:border-sky-500/40',
    textColor: 'text-sky-400',
  },
  {
    label: 'Kasir',
    email: 'kasir1@makmur.id',
    password: 'password',
    description: 'Proses transaksi POS',
    icon: <ShoppingCart className="h-4 w-4" />,
    color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40',
    textColor: 'text-emerald-400',
  },
]

export function LoginPage() {
  const { login } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    const finalEmail = loginEmail || email
    if (!finalEmail) {
      setError('Email wajib diisi')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: finalEmail, password: loginPassword || password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login gagal')
        return
      }

      const userData = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        tenantId: data.tenantId,
        outletId: data.outletId,
        tenantName: data.tenantName,
        outletName: data.outletName,
      }

      localStorage.setItem('posril_user', JSON.stringify(userData))
      login(userData)
    } catch {
      setError('Gagal terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-600/20 to-green-500/10 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-gradient-to-br from-teal-400/15 to-emerald-600/10 blur-3xl"
        />
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 mx-4 w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-emerald shadow-lg shadow-emerald-500/25">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Pos <span className="text-gradient-emerald">Ril</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Multi-Tenant SaaS POS System
          </p>
        </motion.div>

        {/* Login Card */}
        <div className="rounded-2xl border border-white/10 bg-white/60 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl dark:border-white/5 dark:bg-white/5 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Masuk ke Akun</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Masukkan kredensial untuk melanjutkan
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={() => handleLogin()}
              disabled={loading}
              className="w-full gradient-emerald text-white hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                />
              ) : (
                <>
                  Masuk
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Quick Login */}
          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white/60 px-2 text-muted-foreground backdrop-blur-xl dark:bg-white/5">
                  Login Cepat (Demo)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account, i) => (
                <motion.button
                  key={account.email}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                  onClick={() => handleLogin(account.email, account.password)}
                  disabled={loading}
                  className={`group flex flex-col items-start gap-1 rounded-xl border bg-gradient-to-br p-3 text-left transition-all duration-200 ${account.color}`}
                >
                  <div className="flex w-full items-center gap-2">
                    <span className={account.textColor}>{account.icon}</span>
                    <span className={`text-xs font-semibold ${account.textColor}`}>
                      {account.label}
                    </span>
                  </div>
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    {account.description}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 text-center text-xs text-muted-foreground"
        >
          © 2026 Pos Ril · <span className="text-gradient-emerald">v2.1.0</span> · Dibuat dengan ❤️ di Indonesia
        </motion.p>
      </motion.div>
    </div>
  )
}
