import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSettings } from './google_sheets';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateReview = async (answers: any, questions: any[]) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // 設定を取得
  const settings = await getSettings();
  const keywords = settings.keywords || '';
  const shopName = settings.shop_name || 'このジム';

  const birthAnswer = answers['birth'];
  const gender = answers['gender'] || '不明';
  
  let age = '30代';
  let ageTone = '丁寧な大人の文章。基本は「。」で終わる。「！」は控えめに。';

  if (birthAnswer) {
    const birthDate = new Date(birthAnswer);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    age = `${calculatedAge}歳`;

    if (calculatedAge <= 24) {
      ageTone = '少しラフで熱量が高い感じ。文末に「！」を使っても良い。';
    } else if (calculatedAge >= 45) {
      ageTone = '非常に丁寧で落ち着いた、品のある書き方。「！」は使わない。';
    } else {
      ageTone = '常識ある大人の書き方。基本は「。」で終わる。「！」は控えめに。';
    }
  }

  const qaList = questions
    .filter((q) => q.ai_use && answers[q.id])
    .map((q) => `・質問「${q.label}」\n  回答：「${answers[q.id]}」`)
    .join('\n');

  const prompt = `あなたは${shopName}に通う会員（${age}・${gender}）です。以下のアンケート回答を元に、Googleマップに投稿するクチコミ文章を作成してください。

【入力データ】
${qaList}

【書き方のルール】
・性格・トーン：${ageTone}
・文字数：150文字〜200文字程度。
・『です・ます』調で。
・絵文字は原則禁止（年齢が若い場合のみ1つまで許可）。
・嘘は書かず、回答にある内容だけを自然に膨らませてください。
${keywords ? `・以下のキーワードから1つ以上を選び、文脈に合わせて自然な形で文章に含めてください：${keywords}` : ''}

【文章の構成】
1. 入会前の悩みや不安
2. カウンセリングや体験での安心感
3. 具体的な成果や今の気持ち

出力はクチコミの本文のみにしてください。`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};
