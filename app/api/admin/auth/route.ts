import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/google_sheets';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const settings = await getSettings();

    if (password === settings.admin_password) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false }, { status: 401 });
    }
  } catch (error) {
    console.error('認証エラー:', error);
    return NextResponse.json({ error: '認証に失敗しました' }, { status: 500 });
  }
}