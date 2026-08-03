'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['⌘K', '/', 'Ctrl+K'], description: 'Command Palette' },
  { keys: ['1'], description: 'Dashboard' },
  { keys: ['2'], description: 'Transaksi' },
  { keys: ['3'], description: 'Payment Links' },
  { keys: ['4'], description: 'Pelanggan' },
  { keys: ['5'], description: 'Merchant' },
  { keys: ['6'], description: 'Payout' },
  { keys: ['7'], description: 'Laporan' },
  { keys: ['8'], description: 'Pengaturan' },
  { keys: ['D'], description: 'Dark/Light Mode Toggle' },
  { keys: ['N'], description: 'Buat Payment Link Baru' },
  { keys: ['T'], description: 'Ke Halaman Transaksi' },
  { keys: ['?'], description: 'Tampilkan Pintasan Keyboard' },
  { keys: ['Esc'], description: 'Tutup Dialog / Overlay' },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-muted px-1.5 font-mono text-xs font-medium text-foreground shadow-sm">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsOverlay({ open, onOpenChange }: KeyboardShortcutsOverlayProps) {
  // Internal listener for '?' to open this dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    if (open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 text-white">
                <Keyboard className="h-4 w-4" />
              </div>
              Pintasan Keyboard
            </DialogTitle>
            <DialogDescription>
              Gunakan pintasan keyboard untuk navigasi cepat
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SHORTCUTS.map((shortcut, i) => (
              <motion.div
                key={shortcut.description}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.03 }}
                className="flex items-center justify-between rounded-lg border border-border p-2.5 transition-colors hover:bg-muted/50"
              >
                <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, ki) => (
                    <span key={ki} className="flex items-center gap-1">
                      {ki > 0 && (
                        <span className="text-xs text-muted-foreground">/</span>
                      )}
                      <Kbd>{key}</Kbd>
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Tekan <Kbd>?</Kbd> kapan saja untuk membuka dialog ini
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
