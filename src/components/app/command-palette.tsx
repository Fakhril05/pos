'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { useAppStore, type Page } from '@/stores/app-store'
import {
  Search,
  LayoutDashboard,
  ArrowLeftRight,
  Link2,
  Users,
  Store,
  Banknote,
  BarChart3,
  Settings,
  Plus,
  Download,
  FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavCommand {
  label: string
  page: Page
  icon: LucideIcon
  shortcut?: string
}

interface ActionCommand {
  label: string
  icon: LucideIcon
  page: Page
  shortcut?: string
}

const navCommands: NavCommand[] = [
  { label: 'Go to Dashboard', page: 'dashboard', icon: LayoutDashboard },
  { label: 'Go to Transaksi', page: 'transactions', icon: ArrowLeftRight, shortcut: 'T' },
  { label: 'Go to Payment Link', page: 'payment-links', icon: Link2, shortcut: 'P' },
  { label: 'Go to Pelanggan', page: 'customers', icon: Users, shortcut: 'C' },
  { label: 'Go to Merchant', page: 'merchants', icon: Store, shortcut: 'M' },
  { label: 'Go to Payout', page: 'payouts', icon: Banknote },
  { label: 'Go to Laporan', page: 'reports', icon: BarChart3, shortcut: 'R' },
  { label: 'Go to Pengaturan', page: 'settings', icon: Settings, shortcut: ',' },
]

const actionCommands: ActionCommand[] = [
  { label: 'Buat Payment Link Baru', icon: Plus, page: 'payment-links' },
  { label: 'Buat Pencairan Baru', icon: Plus, page: 'payouts' },
  { label: 'Export Transaksi (CSV)', icon: Download, page: 'transactions' },
  { label: 'Lihat Laporan', icon: FileText, page: 'reports' },
]

interface CommandPaletteProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CommandPalette({ open: controlledOpen, onOpenChange: controlledOnOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const { setActivePage } = useAppStore()

  const handleSelect = useCallback(
    (page: Page) => {
      setActivePage(page)
      setOpen(false)
    },
    [setActivePage, setOpen]
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [setOpen])

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="max-w-lg">
      <CommandInput placeholder="Cari halaman, perintah... ⌘K" />
      <CommandList>
        <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>
        <CommandGroup heading="Navigasi">
          {navCommands.map((cmd) => (
            <CommandItem
              key={cmd.page}
              onSelect={() => handleSelect(cmd.page)}
              className="cursor-pointer focus-ring"
            >
              <cmd.icon className="mr-2 h-4 w-4 text-emerald-500" />
              <span>{cmd.label}</span>
              {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Aksi">
          {actionCommands.map((cmd, i) => (
            <CommandItem
              key={`${cmd.label}-${i}`}
              onSelect={() => handleSelect(cmd.page)}
              className="cursor-pointer focus-ring"
            >
              <cmd.icon className="mr-2 h-4 w-4 text-emerald-500" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
