import { NextResponse } from 'next/server';
import { getQuestions } from '@/lib/google_sheets';

export async function GET() {
  try {
    const questions = await getQuestions();
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Spreadsheet Error:', error);
    return NextResponse.json({ error: '取得失敗' }, { status: 500 });
  }
}