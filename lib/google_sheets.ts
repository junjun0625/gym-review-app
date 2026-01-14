import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

const SHEET_TITLES = {
  QUESTIONS: '質問管理用',
  ANSWERS: '回答保存用',
  SETTINGS: '設定用',
};

async function loadSpreadsheet() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId: SPREADSHEET_ID! };
}

export async function getQuestions() {
  const { sheets, spreadsheetId } = await loadSpreadsheet();
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_TITLES.QUESTIONS}!A2:F100`,
  });

  const rows = response.data.values || [];
  
  return rows.map((row) => ({
    id: row[0],
    label: row[1],
    type: row[2],
    options: row[3] ? row[3].split(',').map((opt: string) => opt.trim()) : [],
    ai_use: row[4] === 'TRUE',
    step: parseInt(row[5]) || 1,
  }));
}
export async function saveAnswer(data: any) {
  const { sheets, spreadsheetId } = await loadSpreadsheet();
  
  const timestamp = new Date().toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // data.answers から回答データを取得
  const answers = data.answers || {};

  const values = [
    [
      timestamp,
      answers.birth || '',
      answers.gender || '',
      answers.how_found || '',
      answers.other_gyms || '',
      answers.worry || '',
      answers.worry_detail || '',
      answers.why_choose || '',
      answers.anxiety || '',
      answers.first_impression || '',
      answers.frequency || '',
      answers.duration || '',
      answers.result_physical || '',
      answers.result_mental || '',
      answers.satisfaction || '',
      answers.recommend || '',
      data.aiReview || '',
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_TITLES.ANSWERS}!A:Q`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}


export async function getSettings() {
  try {
    const { sheets, spreadsheetId } = await loadSpreadsheet();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_TITLES.SETTINGS}!A2:B100`,
    });

    const rows = response.data.values || [];
    const settings: Record<string, string> = {};

    rows.forEach((row) => {
      if (row[0] && row[1]) {
        settings[row[0]] = row[1];
      }
    });

    console.log('取得した設定:', settings);
    return settings;
  } catch (error) {
    console.error('設定の取得に失敗:', error);
    return {};
  }
}
