Task ID: 9
Agent: Main
Task: Add merchant detail drawer/sheet to the merchants page

Work Log:
- Read existing codebase: globals.css, schema.prisma, merchants.tsx, API routes, customers.tsx (for Sheet pattern reference)
- Updated /src/app/api/merchants/[id]/route.ts GET handler:
  - Last 10 transactions with customer relation (select: id, name, email)
  - Payment links with soldQty, maxQty, status, title, amount
  - Success rate computed from ALL transactions (count of success / total)
  - Average transaction amount via aggregate _avg
  - Monthly revenue: last 6 months aggregated from successful transactions using groupBy + manual month aggregation
  - Kept PUT handler intact
- Modified /src/components/app/merchants.tsx:
  - Added imports: Sheet/SheetContent/SheetHeader/SheetTitle/SheetDescription, AnimatedCounter, recharts (Area, AreaChart, XAxis, YAxis), ChartContainer/ChartTooltip/ChartTooltipContent/ChartConfig, Table components, new icons (DollarSign, ArrowLeftRight, TrendingUp, Eye, EyeOff, Link2, Receipt)
  - Removed unused imports: ScrollArea, CardHeader, CardTitle
  - Added state: selectedMerchantId (replaces selectedMerchant), sheetOpen, showApiKey
  - Replaced Dialog-based detail with Sheet (side="right", sm:max-w-xl, p-0, overflow-hidden)
  - Made merchant name clickable (text-emerald-600 dark:text-emerald-400, hover:underline, cursor-pointer) with stopPropagation
  - Built drawer content:
    - Header: gradient avatar with first letter + name + email + status badge (active=green, inactive=red) + API Key with mask/show-hide toggle + copy button
    - Stats 2x2 grid with AnimatedCounter: Total Penjualan (emerald gradient, DollarSign), Total Transaksi (teal gradient, ArrowLeftRight), Tingkat Keberhasilan (amber gradient, TrendingUp), Rata-rata Transaksi (rose gradient, CreditCard) — all using card-elevated
    - Contact info section: Email, Phone (conditional), Address (conditional), Bergabung Sejak — each with icon in muted bg + label + value
    - Revenue chart: recharts AreaChart with emerald gradient fill, 120px height, last 6 months from API, using ChartContainer
    - Payment links list: each shows title, amount, status badge, sold/max qty, card-hover on each item, empty state if none
    - Recent transactions mini table (last 5): Invoice, Pelanggan, Jumlah, Metode, Status badge, Tanggal — using table-header-enhanced and table-row-hover
    - Action buttons: 'Lihat Semua Transaksi' (outline, btn-press) and 'Buat Payout' (emerald, btn-press)
  - Loading skeleton matches the drawer layout
  - Framer-motion stagger entrance for all sections (delay 0.05, 0.1, 0.15, 0.2, 0.25)
  - scrollbar-thin on scrollable content
  - Zero lint errors verified

Stage Summary:
- **Enhanced API route** with transactions (with customer), payment links, computed stats (success rate, avg amount), and monthly revenue data
- **Sheet-based drawer** replaced the Dialog for merchant details
- **Rich detail view** with stats cards, contact info, revenue area chart, payment links list, and compact transaction table
- **Zero lint errors** verified

Files Modified:
1. /src/app/api/merchants/[id]/route.ts - Enhanced GET handler with computed stats and monthly revenue
2. /src/components/app/merchants.tsx - Replaced Dialog with Sheet drawer, added all required sections