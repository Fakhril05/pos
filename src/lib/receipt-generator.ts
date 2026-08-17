// POS Receipt HTML generator — 38mm thermal printer style

export function generateReceiptHtml(data: {
  invoiceNo: string
  tenantName: string
  outletName: string
  outletAddress?: string | null
  outletCity?: string | null
  tenantPhone?: string | null
  cashierName: string
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
  }>
  subtotalAmount: number
  discountAmount: number
  taxAmount: number
  serviceCharge: number
  totalAmount: number
  paymentMethod: string
  paymentChannel: string | null
  tendered?: number
  change?: number
  createdAt: string
}): string {
  const d = data

  const css = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; padding: 8px; max-width: 320px; margin: 0 auto; color: #111; font-size: 12px; line-height: 1.5; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .lg { font-size: 16px; }
    .xl { font-size: 20px; }
    .muted { color: #666; font-size: 11px; }
    .divider { border: none; border-top: 1px dashed #333; margin: 8px 0; }
    .divider-double { border: none; border-top: 3px double #333; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
    .item-header { display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding: 4px 0; font-weight: 700; font-size: 11px; }
    .item { padding: 4px 0; border-bottom: 1px dotted #ccc; }
    .item-name { font-weight: 600; }
    .item-detail { display: flex; justify-content: space-between; font-size: 11px; color: #444; }
    .total-section { margin-top: 8px; }
    .total-row { display: flex; justify-content: space-between; padding: 2px 0; }
    .grand-total { font-size: 16px; font-weight: 800; }
    .footer { text-align: center; margin-top: 12px; padding-top: 8px; }
    .footer p { font-size: 10px; color: #888; margin: 2px 0; }
    @media print { body { padding: 0; } }
  `

  const itemRows = d.items
    .map(
      (item) => `
    <div class="item">
      <div class="item-name">${item.name}</div>
      <div class="item-detail">
        <span>${item.quantity} x ${formatRp(item.price)}</span>
        <span>${formatRp(item.subtotal)}</span>
      </div>
    </div>`,
    )
    .join('')

  const discountRow =
    d.discountAmount > 0
      ? `<div class="total-row"><span>Diskon</span><span>-${formatRp(d.discountAmount)}</span></div>`
      : ''

  const serviceRow =
    d.serviceCharge > 0
      ? `<div class="total-row"><span>Service Charge</span><span>${formatRp(d.serviceCharge)}</span></div>`
      : ''

  const tenderedRow =
    d.tendered !== undefined && d.tendered > 0
      ? `<div class="total-row"><span>Dibayar</span><span>${formatRp(d.tendered)}</span></div>`
      : ''

  const changeRow =
    d.change !== undefined && d.change > 0
      ? `<div class="total-row"><span>Kembalian</span><span>${formatRp(d.change)}</span></div>`
      : ''

  const paymentLabel = d.paymentChannel
    ? `${d.paymentMethod} - ${d.paymentChannel}`
    : d.paymentMethod

  const formattedDate = new Date(d.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    '<title>Struk ' + d.invoiceNo + '</title>',
    '<style>' + css + '</style>',
    '</head>',
    '<body>',
    '<div class="center bold lg">' + d.tenantName + '</div>',
    '<div class="center">' + d.outletName + '</div>',
    d.outletAddress ? '<div class="center muted">' + d.outletAddress + (d.outletCity ? ', ' + d.outletCity : '') + '</div>' : '',
    d.tenantPhone ? '<div class="center muted">' + d.tenantPhone + '</div>' : '',
    '<hr class="divider-double">',
    '<div class="row"><span>No. Invoice</span><span class="bold">' + d.invoiceNo + '</span></div>',
    '<div class="row"><span>Kasir</span><span>' + d.cashierName + '</span></div>',
    '<div class="row"><span>Tanggal</span><span>' + formattedDate + '</span></div>',
    '<hr class="divider">',
    '<div class="item-header"><span>Item</span><span>Total</span></div>',
    itemRows,
    '<hr class="divider">',
    '<div class="total-section">',
    '<div class="total-row"><span>Subtotal</span><span>' + formatRp(d.subtotalAmount) + '</span></div>',
    discountRow,
    '<div class="total-row"><span>PPN (11%)</span><span>' + formatRp(d.taxAmount) + '</span></div>',
    serviceRow,
    '<hr class="divider">',
    '<div class="total-row grand-total"><span>TOTAL</span><span>' + formatRp(d.totalAmount) + '</span></div>',
    '<hr class="divider">',
    '<div class="total-row"><span>Metode Bayar</span><span>' + paymentLabel + '</span></div>',
    tenderedRow,
    changeRow,
    '</div>',
    '<div class="footer">',
    '<hr class="divider">',
    '<p>Terima kasih atas kunjungan Anda!</p>',
    '<p>Struk ini bukan bukti pembayaran yang sah</p>',
    '<p>tanpa tanda tangan atau cap toko.</p>',
    '<p style="margin-top: 8px; color: #aaa;">Powered by Pos Ril</p>',
    '</div>',
    '</body>',
    '</html>',
  ].join('\n')
}

function formatRp(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}
