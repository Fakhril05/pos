# Task 5: Payment Link Detail Drawer

## Summary
Added a Payment Link detail drawer to the payment-links.tsx page.

## Files Modified

### 1. `/src/app/api/payment-links/[id]/route.ts`
- Enhanced the GET handler to return enriched data:
  - **totalRevenue**: Sum of `netAmount` from all successful (status='success') transactions linked to this payment link
  - **conversionRate**: `soldQty / maxQty * 100` (rounded to 1 decimal), 0 if maxQty is 0
  - **successRate**: `successfulTxCount / totalTxCount * 100` (rounded to 1 decimal), 0 if no transactions
  - Transactions now include merchant relation (`merchant: { select: { id, name, logo } }`)
- PUT and DELETE handlers remain completely intact

### 2. `/src/components/app/payment-links.tsx`
- **Imports added**:
  - `useMemo` (replaced `useEffect`), `CreditCard`, `Receipt` from lucide-react
  - `AnimatedCounter` from `@/components/app/animated-counter`
  - `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription` from `@/components/ui/sheet`
  - `Separator` from `@/components/ui/separator`
  - `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` from `@/components/ui/table`

- **New types added**:
  - `TransactionDetailItem` - for transaction data in the drawer
  - `PaymentLinkDetail` - extended payment link type with transactions array

- **New helper constants**:
  - `formatDateTime` - format date+time for transaction rows
  - `statusBadgeClass` / `statusLabel` - color classes & labels for transaction status (success=green, pending=yellow, failed=red, expired=gray)
  - `methodBadgeClass` / `methodLabel` - color classes & labels for payment methods (qris=emerald, ewallet=blue, bank_transfer=violet, credit_card=amber)
  - `drawerStatusBadgeClass` / `drawerStatusLabel` - for the drawer header status badge (active=green, inactive=red, expired=amber)

- **New state**:
  - `selectedPaymentLinkId: string | null`
  - `detailSheetOpen: boolean`

- **New query**: `useQuery` with key `['payment-link-detail', id]`, fetching from `/api/payment-links/${id}`, enabled only when ID is set and sheet is open

- **New handlers**:
  - `openDetailSheet(linkId)` - sets selectedPaymentLinkId and opens sheet
  - `handleCopyDetailLink()` - copies pay.posril.id URL for the selected link

- **Title made clickable**: The `h3` heading in each payment link card now has:
  - `cursor-pointer text-emerald-600 hover:underline dark:text-emerald-400`
  - `onClick={() => openDetailSheet(link.id)}`

- **Sheet Drawer** (side='right', `sm:max-w-lg`):
  - **Loading state**: Skeleton placeholders matching the layout
  - **Header**: Title + description, status badge (active/inactive/expired colors), link URL with copy button, created date
  - **Stats Section**: 3 `card-elevated` cards with gradient icon containers:
    - Total Pendapatan (emerald gradient, DollarSign icon, AnimatedCounter with formatRp)
    - Total Terjual (teal gradient, Layers icon, AnimatedCounter)
    - Tingkat Konversi (amber gradient, TrendingUp icon, AnimatedCounter with % suffix)
  - **Progress Bar**: Shows soldQty/maxQty with emerald fill, labeled 'X / Y terjual'
  - **Transaction History**: Mini table with `table-header-enhanced` and `table-row-hover`, columns: Invoice, Pelanggan, Jumlah, Metode (colored badge), Status (colored badge), Tanggal
  - **Empty state**: Friendly message 'Belum ada transaksi untuk link ini' with `empty-state` class
  - **Action Buttons**: 'Salin Link' (emerald, btn-press) and 'Buat Transaksi' (outline, btn-press)
  - **Animations**: framer-motion stagger entrance for each section
  - **Scrolling**: `scrollbar-thin` on scrollable content area

- **No existing functionality broken**: Create/Edit/Delete dialogs and card functionality remain intact

## Verification
- `bun run lint` passes with zero errors
