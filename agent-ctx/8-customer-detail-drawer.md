Task ID: 8
Agent: Main
Task: Add customer detail drawer/sheet to the customers page

Work Log:
- Read existing codebase: worklog, globals.css, schema.prisma, customers.tsx, merchants.tsx, API routes
- Updated /src/app/api/customers/[id]/route.ts with enhanced GET handler:
  - Limited transactions to last 10 (take: 10) with merchant relation
  - Computed stats from ALL transactions (not just the 10 returned): totalSpent (success only), totalTx, successRate, lastTransactionDate
  - Added monthlyActivity data: last 6 months of successful transaction counts/amounts
- Modified /src/components/app/customers.tsx:
  - Added imports: Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, AnimatedCounter, ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, Bell, ShoppingCart, recharts (Bar, BarChart, XAxis, YAxis)
  - Removed unused imports: Store, Receipt, UserIcon, ScrollArea
  - Added MonthlyActivity interface and updated CustomerDetail interface with successRate, lastTransactionDate, monthlyActivity
  - Added PaymentMethodBadge component with color-coded badges for qris/emerald, ewallet/blue, bank_transfer/violet, credit_card/amber
  - Added activityChartConfig for the ChartContainer
  - Replaced Dialog-based detail view with Sheet (side="right", sm:max-w-xl)
  - Changed state from dialogOpen to sheetOpen
  - Made customer name clickable with emerald color and hover:underline
  - Built drawer content with:
    - Header: gradient avatar with initials + name + email + "Aktif" badge
    - 3-column stats row with AnimatedCounter: Total Belanja (emerald gradient), Total Transaksi (teal gradient), Rata-rata (amber gradient), all using card-elevated class
    - Contact info section: Email, Phone, Address (conditional), Bergabung Sejak - each with icon + label + value
    - Activity chart: recharts BarChart with emerald bars showing last 6 months transaction counts, using ChartContainer
    - Transaction history: compact table with Invoice, Merchant, Jumlah, Metode (PaymentMethodBadge), Status (StatusBadge), Tanggal
    - Action buttons: "Kirim Notifikasi" (emerald) and "Buat Transaksi" (outline), both with btn-press
  - Loading skeleton matches the drawer layout
  - Framer-motion stagger animations on all sections
  - scrollbar-thin on scrollable content

Stage Summary:
- **Enhanced API route** with computed stats and monthly activity data
- **Sheet-based drawer** replaced the Dialog for customer details
- **Rich detail view** with stats, contact info, activity chart, and transaction history
- **Zero lint errors** verified

Files Modified:
1. /src/app/api/customers/[id]/route.ts - Enhanced with computed stats
2. /src/components/app/customers.tsx - Sheet drawer with full detail view
