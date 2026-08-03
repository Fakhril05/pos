import { createServer } from 'http';
import { Server } from 'socket.io';

// ── Constants ────────────────────────────────────────────────────────────────

const MERCHANTS = [
  'Toko Makmur Jaya',
  'Warung Digital',
  'Berkat Store',
  'Jaya Elektronik',
  'Maju Bersama',
  'Kedai Kopi Nusantara',
  'Baju Online ID',
  'Pulsa Murah 88',
  'Gadget Zone',
  'Fresh Market',
];

const CUSTOMERS = [
  'Budi Santoso',
  'Siti Rahayu',
  'Ahmad Hidayat',
  'Dewi Lestari',
  'Rudi Hartono',
  'Nurul Aini',
  'Fajar Pratama',
  'Rina Wati',
  'Dedi Kurniawan',
  'Anisa Putri',
  'Bambang Suryo',
  'Maya Sari',
  'Hendra Wijaya',
  'Lisa Permata',
  'Rizky Ramadhan',
];

const PAYMENT_CHANNELS: Record<string, string[]> = {
  QRIS: ['QRIS'],
  'E-Wallet': ['GoPay', 'OVO', 'DANA', 'ShopeePay'],
  'Bank Transfer': ['BCA', 'BNI', 'BRI', 'Mandiri'],
  'Virtual Account': ['BCA VA', 'BNI VA', 'BRI VA'],
  'Credit Card': ['Visa', 'Mastercard'],
};

const PAYMENT_METHODS = Object.keys(PAYMENT_CHANNELS);

// ── Helpers ─────────────────────────────────────────────────────────────────

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateInvoiceNo(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return `INV-${result}`;
}

function generateTxId(): string {
  return `TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

// ── Server Setup ─────────────────────────────────────────────────────────────

const httpServer = createServer();
const io = new Server(httpServer, {
  // DO NOT change the path — Caddy uses it for port forwarding
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ── Broadcast interval state ───────────────────────────────────────────────

let broadcastTimer: ReturnType<typeof setTimeout> | null = null;

function generateTransaction() {
  const method = randomItem(PAYMENT_METHODS);
  const channels = PAYMENT_CHANNELS[method];
  const channel = randomItem(channels);

  return {
    id: generateTxId(),
    invoiceNo: generateInvoiceNo(),
    merchantName: randomItem(MERCHANTS),
    customerName: randomItem(CUSTOMERS),
    amount: randomBetween(15000, 5000000),
    paymentMethod: method,
    paymentChannel: channel,
    status: 'success',
    createdAt: new Date().toISOString(),
  };
}

function scheduleBroadcast() {
  const delay = randomBetween(15000, 30000); // 15–30 seconds
  broadcastTimer = setTimeout(() => {
    const tx = generateTransaction();
    console.log(
      `[TX] ${tx.invoiceNo} | ${tx.merchantName} | Rp ${tx.amount.toLocaleString('id-ID')} | ${tx.customerName} | ${tx.paymentMethod} (${tx.paymentChannel})`
    );
    io.emit('new-transaction', tx);
    scheduleBroadcast(); // schedule the next one
  }, delay);
}

// ── Connection Handling ─────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });

  socket.on('error', (err) => {
    console.error(`[Socket] Error on ${socket.id}:`, err);
  });
});

// ── Heartbeat ─────────────────────────────────────────────────────────────────

setInterval(() => {
  const clients = io.engine?.clientsCount ?? '?';
  console.log(`[Heartbeat] ${new Date().toISOString()} | clients: ${clients}`);
}, 20000);

// ── Unhandled Error Catch ───────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});

// ── Start ────────────────────────────────────────────────────────────────────

const PORT = 3004;
httpServer.listen(PORT, () => {
  console.log(`[Notification Service] Running on port ${PORT}`);
  console.log(`[Notification Service] Broadcasting simulated transactions every 15–30s`);
  scheduleBroadcast();
});

// ── Graceful Shutdown ──────────────────────────────────────────────────────

function shutdown() {
  console.log('[Notification Service] Shutting down...');
  if (broadcastTimer) clearTimeout(broadcastTimer);
  io.close();
  httpServer.close(() => {
    console.log('[Notification Service] Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
