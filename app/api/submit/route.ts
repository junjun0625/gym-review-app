import { NextResponse } from 'next/server';
import { saveResponse, getQuestions } from '@/lib/google_sheets';
import { generateReview } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const body = await req.json(); // フォームから送られてきた回答データ
    
    console.log('=== 受信した回答データ ===');
    console.log(JSON.stringify(body, null, 2));
    
    const questions = await getQuestions(); // 質問リストを取得

    // 1. AIで文章を生成する
    const reviewText = await generateReview(body, questions);

    console.log('=== スプレッドシートに保存するデータ ===');
    console.log('answers:', JSON.stringify(body, null, 2));
    console.log('aiReview:', reviewText);

    // 2. スプレッドシートに保存する
    await saveResponse({
      answers: body,
      aiReview: reviewText,
    });

    // 3. 成功したら、生成された文章を画面に返す
    return NextResponse.json({ success: true, review: reviewText });

  } catch (error) {
    console.error('Submit Error:', error);
    return NextResponse.json({ error: '送信に失敗しました' }, { status: 500 });
  }
}
