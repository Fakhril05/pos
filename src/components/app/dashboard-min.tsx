'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { Skeleton } from '@/components/ui/skeleton';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatRp = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHr < 24) return `${diffHr} jam lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

interface TickerTx {
  id: string;
  invoiceNo: string;
  amount: number;
  paymentChannel: string;
  merchantName?: string;
  createdAt: string;
}

// ── Ticker Component ─────────────────────────────────────────────────────────

function LiveActivityTicker({ transactions }: { transactions: TickerTx[] }) {
  if (transactions.length === 0) return null;

  const items = transactions.map((tx) => ({
    id: tx.id,
    text: `\u{1F3C6} ${tx.merchantName || 'Merchant'} - ${formatRp(tx.amount)} via ${tx.paymentChannel} - ${timeAgo(tx.createdAt)}`,
  }));

  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="mb-4 overflow-hidden rounded-lg bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="animate-pulse-subtle flex h-2 w-2 shrink-0 rounded-full bg-white" />
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-white/90">
          LIVE
        </span>
        <span className="mx-1 h-3 w-px shrink-0 bg-white/30" />
        <div className="relative flex-1 overflow-hidden">
          <div className="animate-marquee flex whitespace-nowrap" style={{ '--marquee-duration': `${Math.max(15, items.length * 6)}s` } as React.CSSProperties}>
            {doubled.map((item, i) => (
              <span
                key={`${item.id}-${i}`}
                className="mr-8 inline-block text-xs font-medium text-white/95"
              >
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Component ──────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: tickerData, isLoading } = useQuery<{ data: TickerTx[] }>({
    queryKey: ['ticker-transactions'],
    queryFn: async () => {
      const res = await fetch('/api/transactions?status=success&limit=10');
      const json = await res.json();
      return { data: json.data ?? [] };
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const tickerTxs = tickerData?.data ?? [];

  return (
    <div className="animate-fade-in-up">
      <AnimatePresence>
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 h-8 overflow-hidden rounded-lg"
          >
            <Skeleton className="h-full w-full" />
          </motion.div>
        ) : tickerTxs.length > 0 ? (
          <motion.div
            key="ticker"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <LiveActivityTicker transactions={tickerTxs} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <PageHeader
        title="Dashboard"
        description="Ringkasan aktivitas pembayaran Anda"
        icon={TrendingUp}
        iconGradient="emerald"
      />

      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Dashboard sedang diperbarui...</p>
      </div>
    </div>
  );
}
