# Task 7: Create Customers Component

**Status:** Completed

## What was done

Created `/home/z/my-project/src/components/app/customers.tsx` — a full-featured `'use client'` customers page component for the Pos Ril payment gateway app.

### Key features:
1. **Stats Row** — 3 emerald-themed cards (Total Pelanggan, Total Belanja, Rata-rata Belanja) with gradient icons, staggered motion animations, hover shadow effects. Stats computed from a separate unpaginated query for accuracy.

2. **Search + Table** — Server-side search by name/email/phone. Table columns: Avatar+Name (color-coded initials), Email, Phone, Total Transaksi, Total Belanja (IDR), Terdaftar. Row hover effects, AnimatePresence row animations. Responsive column hiding (sm/md/lg).

3. **Customer Detail Dialog** — Opens on row click. Shows customer avatar, info, 4 quick stats cards, and scrollable transaction history (max-h-72) with per-transaction cards showing merchant, status badge, payment details, amount.

4. **Pagination** — Smart page range with ellipsis, shadcn Pagination components, responsive footer.

### Technical details:
- TanStack Query with 15s/30s stale times
- Two queries: paginated list + unpaginated stats aggregate
- All text in Bahasa Indonesia
- Emerald theme consistent with rest of app
- All shadcn components: Table, Card, Button, Input, Badge, Dialog, Pagination, Skeleton, Separator, Avatar, ScrollArea
- Framer Motion animations throughout
- ESLint: zero errors

### API endpoints used:
- `GET /api/customers?page=&limit=&search=` — paginated list with `_count.transactions`
- `GET /api/customers/[id]` — customer detail with full transaction history (includes merchant)
