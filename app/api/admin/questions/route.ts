import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_TITLE = '質問管理用';

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

    console.log('質問管理用シートを取得します');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_TITLE}!A2:F100`,
    });

    const rows = response.data.values || [];
    
    const questions = rows
      .filter(row => row[0])
      .map(row => ({
        id: row[0] || '',
        label: row[1] || '',
        type: row[2] || 'text',
        options: row[3] ? row[3].split(',').map((opt: string) => opt.trim()) : [],
        ai_use: row[4] === 'TRUE',
        step: parseInt(row[5]) || 1,
      }));

    console.log(`質問管理用シート: ${questions.length}件取得`);

    return NextResponse.json(questions);
  } catch (error) {
    console.error('質問管理用シート取得エラー:', error);
    return NextResponse.json(
      { error: '質問の取得に失敗しました', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { questions } = await request.json();
    const { sheets, spreadsheetId } = await loadSpreadsheet();

    console.log('質問管理用シートを更新します:', questions);

    // 既存のデータをクリア（ヘッダー以外）
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${SHEET_TITLE}!A2:F100`,
    });

    // 新しいデータを作成
    const values = questions.map((q: any) => [
      q.id,
      q.label,
      q.type,
      Array.isArray(q.options) ? q.options.join(',') : q.options,
      q.ai_use ? 'TRUE' : 'FALSE',
      q.step,
    ]);

    // データを書き込み
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_TITLE}!A2:F${values.length + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });

    console.log('質問管理用シート更新完了');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('質問管理用シート更新エラー:', error);
    return NextResponse.json(
      { error: '質問の保存に失敗しました', details: String(error) },
      { status: 500 }
    );
  }
}
