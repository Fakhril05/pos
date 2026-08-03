import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// In-memory profile store (simple, no user auth)
let profileData: {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  updatedAt: string;
} | null = null;

// GET – retrieve current profile
export async function GET() {
  if (profileData) {
    return NextResponse.json({ success: true, data: profileData });
  }
  // Default values
  return NextResponse.json({
    success: true,
    data: {
      businessName: 'Pos Ril Indonesia',
      email: 'admin@posril.id',
      phone: '+62 812 3456 7890',
      address: 'Jl. Sudirman No. 123, Jakarta Selatan 12190',
      updatedAt: new Date().toISOString(),
    },
  });
}

// POST – save profile data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessName, email, phone, address } = body;

    if (!businessName || !email) {
      return NextResponse.json(
        { success: false, error: 'Nama bisnis dan email wajib diisi' },
        { status: 400 },
      );
    }

    profileData = {
      businessName,
      email,
      phone: phone || '',
      address: address || '',
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: profileData });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan profil' },
      { status: 500 },
    );
  }
}
