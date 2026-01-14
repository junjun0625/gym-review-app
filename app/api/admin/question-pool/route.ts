import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_TITLE = '質問項目プール';

async function loadSpreadsheet() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId: SPREADSHEET_ID! };
}

export async function GET() {
  try {
    const { sheets, spreadsheetId } = await loadSpreadsheet();

    console.log('質問項目プールを取得します');

    // 質問項目プールを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_TITLE}!A2:F100`,
    });

    const rows = response.data.values || [];
    
    const questions = rows
      .filter(row => row[0]) // id が存在する行のみ
      .map(row => ({
        id: row[0] || '',
        label: row[1] || '',
        type: row[2] || 'text',
        options: row[3] ? row[3].split(',').map((opt: string) => opt.trim()) : [],
        category: row[4] || '',
      }));

    console.log(`質問項目プール: ${questions.length}件取得`);

    return NextResponse.json(questions);
  } catch (error) {
    console.error('質問項目プール取得エラー:', error);
    return NextResponse.json(
      { error: '質問項目プールの取得に失敗しました', details: String(error) },
      { status: 500 }
    );
  }
}
