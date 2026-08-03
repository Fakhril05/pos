# Task 6: Dashboard Enhancements

## Agent: Main

## Summary

Enhanced the Dashboard component (`src/components/app/dashboard.tsx`) with 4 specific improvements. All changes pass `bun run lint` with zero errors.

## Changes Made

### 1. Real-Time Clock Widget
- Added `useEffect` to React imports
- Created `LiveClock` component with local `useState` + `setInterval(1000)` — does NOT re-render the entire dashboard
- Displays current time in HH:MM:SS format (24-hour) with `tabular-nums`
- Displays date in full Indonesian format: e.g. "Senin, 3 Agustus 2026"
- Shows a subtle emerald ping dot with "Live" label
- Styled with `glass-card` class, `text-sm`, positioned in top-right of the welcome banner
- Indonesian day names (HARI) and month names (BULAN) arrays defined as constants

### 2. KPI Cards Clickable Navigation
- Imported `Tooltip`, `TooltipContent`, `TooltipTrigger` from `@/components/ui/tooltip`
- Each of the 4 KPI cards is now wrapped in a `Tooltip` with `TooltipTrigger asChild`
- Cards have `cursor-pointer` and `hover-scale` classes
- Navigation mapping:
  - Total Pendapatan → `setActivePage('reports')` with tooltip "Lihat Laporan"
  - Total Transaksi → `setActivePage('transactions')` with tooltip "Lihat Transaksi"
  - Tingkat Keberhasilan → `setActivePage('transactions')` with tooltip "Lihat Transaksi"
  - Rata-rata Transaksi → `setActivePage('reports')` with tooltip "Lihat Laporan"
- Added a subtle `ArrowUpRight` icon in the top-right corner of each card (muted, becomes emerald on hover)

### 3. Merchant Ranking Enhancement
- Each merchant item is now clickable → navigates to 'merchants' page via `setActivePage('merchants')`
- Added `role="button"`, `tabIndex={0}`, and `onKeyDown` for accessibility
- Added `cursor-pointer` and `hover-scale` classes
- Added a `ChevronRight` icon that appears only on hover (`text-muted-foreground/0` → `text-emerald-500`)
- Added a thin progress bar (`h-1`) under each merchant's sales info, relative to #1 merchant's sales
- Progress bar uses `bg-emerald-500/60` with rounded ends and transition animation

### 4. Empty State for Recent Transactions
- Imported `Wallet` icon from lucide-react
- Added conditional rendering: when `data.recentTransactions.length === 0`
- Shows centered flex layout with:
  - Large translucent `Wallet` icon (`h-16`, `text-muted-foreground/20`)
  - Text: "Belum ada transaksi"
  - Subtext: "Transaksi akan muncul di sini saat pelanggan melakukan pembayaran"
- Table renders normally when transactions exist (no structural changes)

## Verification
- `bun run lint` → 0 errors
- No existing functionality broken (charts, activity feed, pie chart, etc. all preserved)
- All text in Bahasa Indonesia
- Emerald/green theme maintained throughout