# Task 3-4: Dashboard Enhancement

## Agent: Main

### Changes Made

**File: `/src/components/app/dashboard.tsx`**

1. **New imports added:**
   - `Link2`, `Activity` from lucide-react
   - `Button` from shadcn/ui
   - `useAppStore` from Zustand store
   - `cn` from `@/lib/utils`

2. **New helper function — `formatTimeAgo`:**
   - Converts ISO date strings to relative Indonesian time strings ("Baru saja", "X menit lalu", "X jam lalu", "X hari lalu")

3. **New type — `ActivityTransaction`:**
   - Matches the `/api/transactions` response shape including `customer` relation

4. **Welcome Banner (before KPI cards):**
   - Gradient card: `from-emerald-600 via-emerald-500 to-teal-400`
   - 4 decorative semi-transparent circles in background
   - Heading: "Selamat Datang, Admin Ril 👋"
   - Subtext describing the dashboard purpose
   - Two action buttons: "Buat Payment Link" (outline, white) and "Lihat Transaksi" (solid white)
   - Both navigate via `useAppStore().setActivePage()`
   - Responsive: stacks vertically on mobile, horizontal on sm+
   - framer-motion entrance animation

5. **Live Activity Feed (`ActivityFeed` component, after pie chart):**
   - Fetches from `/api/transactions?limit=8&status=success`
   - Shows max 6 items as vertical timeline
   - Timeline has colored dots (emerald/amber/red/gray/blue by status) with connecting vertical line
   - Each item: merchant name (bold), customer name (first 2 words), formatted IDR amount, relative time
   - Live pulse indicator (animated ping dot) in header
   - Loading skeleton, empty state
   - Staggered framer-motion entrance (0.07s delay per item)
   - "Lihat Semua →" link navigates to transactions page
   - 15s stale time, 30s auto-refresh interval

### All existing code preserved intact — only additions made.