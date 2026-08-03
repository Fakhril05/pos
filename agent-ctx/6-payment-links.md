# Task 6: Payment Links Component

## Agent: Main

### What was done
Created `/home/z/my-project/src/components/app/payment-links.tsx` — a comprehensive `'use client'` component for managing payment links in the Pos Ril app.

### Key features implemented
1. **Create Payment Link** — Dialog form with title, description, amount (IDR), merchant select, type (single/multi), max quantity (multi only, animated), expiry date
2. **Card Grid** — Responsive 1/2/3 cols, gradient accent, status/type badges, IDR amount, sold/max progress bar, dates, hover lift effect, staggered motion entrance
3. **Per-card Actions** — Copy Link (clipboard), Edit (pre-filled dialog), Delete (AlertDialog confirmation)
4. **Filters** — Search input + status filter (All/Active/Expired) with client-side status filtering
5. **Pagination** — Full shadcn pagination with ellipsis, boundary disable

### Technical details
- TanStack Query: useQuery (list + merchants), useMutation (create/update/delete), useQueryClient invalidation
- Money: `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })`
- Smart expiry: checks both `status` field and `expiresAt < now`
- All text Bahasa Indonesia
- ESLint: zero errors
