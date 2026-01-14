import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_TITLE = '設定用';

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

export async function POST(request: Request) {
  try {
    const settings = await request.json();
    const { sheets, spreadsheetId } = await loadSpreadsheet();

    console.log('設定を保存します:', settings);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_TITLE}!A2:B100`,
    });

    const rows = response.data.values || [];
    const updates: any[] = [];

    rows.forEach((row, index) => {
      const key = row[0];
      if (key === 'shop_name' && settings.shop_name !== undefined) {
        updates.push({
          range: `${SHEET_TITLE}!B${index + 2}`,
          values: [[settings.shop_name]],
        });
      }
      if (key === 'google_map_url' && settings.google_map_url !== undefined) {
        updates.push({
          range: `${SHEET_TITLE}!B${index + 2}`,
          values: [[settings.google_map_url]],
        });
      }
      if (key === 'keywords' && settings.keywords !== undefined) {
        updates.push({
          range: `${SHEET_TITLE}!B${index + 2}`,
          values: [[settings.keywords]],
        });
      }
    });

    console.log('更新する範囲:', updates);

    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updates,
        },
      });
    }

    console.log('保存完了');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('設定保存エラー:', error);
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 });
  }
}
