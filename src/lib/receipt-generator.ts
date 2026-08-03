// Receipt HTML generator — isolated to avoid TSX parser issues with HTML tags in template literals

export function generateReceiptHtml(data: {
  invoiceNo: string;
  amount: number;
  fee: number;
  netAmount: number;
  merchantName: string;
  customerName: string;
  paymentMethod: string;
  paymentChannel: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  description: string | null;
  formattedAmount: string;
  formattedFee: string;
  formattedNetAmount: string;
  formattedCreatedAt: string;
  formattedPaidAt: string | null;
  statusLabel: string;
}): string {
  const d = data;

  const css = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; max-width: 480px; margin: 0 auto; color: #1a1a1a; }
    .header { text-align: center; margin-bottom: 32px; }
    .header h1 { font-size: 24px; font-weight: 700; color: #059669; }
    .header p { font-size: 12px; color: #666; margin-top: 4px; }
    .divider { border: none; border-top: 2px dashed #e5e5e5; margin: 20px 0; }
    .amount-section { text-align: center; margin: 24px 0; }
    .amount { font-size: 32px; font-weight: 800; color: #059669; }
    .status { display: inline-block; margin-top: 8px; padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .status.success { background: #d1fae5; color: #065f46; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
    .row .label { color: #888; }
    .row .value { font-weight: 600; text-align: right; }
    .footer { text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
    .footer p { font-size: 11px; color: #aaa; }
  `;

  const paidRow = d.paidAt && d.formattedPaidAt
    ? `<div class="row"><span class="label">Dibayar</span><span class="value">${d.formattedPaidAt}</span></div>`
    : '';

  const descRow = d.description
    ? `<div class="row"><span class="label">Deskripsi</span><span class="value">${d.description}</span></div>`
    : '';

  const timestamp = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    '<title>Struk ' + d.invoiceNo + '</title>',
    '<style>' + css + '</style>',
    '</head>',
    '<body>',
    '<div class="header">',
    '<h1>Pos Ril</h1>',
    '<p>Payment Gateway Indonesia</p>',
    '</div>',
    '<hr class="divider">',
    '<div class="amount-section">',
    '<div class="amount">' + d.formattedAmount + '</div>',
    '<span class="status success">' + d.statusLabel + '</span>',
    '</div>',
    '<hr class="divider">',
    '<div class="row"><span class="label">Invoice</span><span class="value">' + d.invoiceNo + '</span></div>',
    '<div class="row"><span class="label">Merchant</span><span class="value">' + d.merchantName + '</span></div>',
    '<div class="row"><span class="label">Pelanggan</span><span class="value">' + d.customerName + '</span></div>',
    '<div class="row"><span class="label">Metode</span><span class="value">' + d.paymentMethod + ' - ' + d.paymentChannel + '</span></div>',
    '<div class="row"><span class="label">Biaya Admin</span><span class="value">' + d.formattedFee + '</span></div>',
    '<div class="row"><span class="label">Jumlah Bersih</span><span class="value">' + d.formattedNetAmount + '</span></div>',
    '<div class="row"><span class="label">Tanggal</span><span class="value">' + d.formattedCreatedAt + '</span></div>',
    paidRow,
    descRow,
    '<hr class="divider">',
    '<div class="footer">',
    '<p>Struk ini dibuat secara otomatis oleh Pos Ril</p>',
    '<p>' + timestamp + '</p>',
    '</div>',
    '</body>',
    '</html>',
  ].join('\n');
}
