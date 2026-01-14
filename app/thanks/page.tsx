'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ThanksPage() {
  const [review, setReview] = useState('');
  const [copied, setCopied] = useState(false);
  const [shopName, setShopName] = useState('');
  const [googleMapUrl, setGoogleMapUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    const savedReview = localStorage.getItem('generatedReview');
    if (savedReview) {
      setReview(savedReview);
    } else {
      router.push('/');
    }

    // 設定を取得
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const settings = await res.json();
        setShopName(settings.shop_name || '');
        setGoogleMapUrl(settings.google_map_url || '');
      } catch (error) {
        console.error('設定の取得に失敗しました:', error);
      }
    };

    fetchSettings();
  }, [router]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(review);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert('コピーに失敗しました');
    }
  };

  if (!review) {
    return <div className='text-center mt-10'>読み込み中...</div>;
  }

  return (
    <div className='w-full max-w-2xl mx-auto mt-10 mb-20 px-4'>
      <Card className='shadow-lg'>
        <CardHeader className='bg-slate-900 text-white py-6'>
          <CardTitle className='text-center text-2xl'>送信完了！</CardTitle>
          {shopName && (
            <p className='text-center text-sm mt-2 opacity-90'>
              {shopName}へのクチコミをお願いします
            </p>
          )}
        </CardHeader>
        <CardContent className='p-8 space-y-6'>
          <p className='text-center text-gray-700'>
            あなたの回答をもとに、以下のクチコミ文を作成しました。
            <br />
            よろしければ、Googleマップにご投稿ください。
          </p>

          <div className='bg-gray-50 p-6 rounded-lg border'>
            <p className='whitespace-pre-wrap text-gray-800 leading-relaxed'>
              {review}
            </p>
          </div>

          <div className='space-y-3'>
            <Button
              onClick={handleCopy}
              className='w-full bg-slate-900 text-white font-bold py-6 text-lg hover:bg-slate-800'
            >
              {copied ? 'コピーしました！' : 'クチコミをコピーする'}
            </Button>

            {googleMapUrl && (
              <Button
                onClick={() => window.open(googleMapUrl, '_blank')}
                className='w-full bg-blue-600 text-white font-bold py-6 text-lg hover:bg-blue-700'
              >
                Googleマップでクチコミを書く
              </Button>
            )}
          </div>

          <p className='text-sm text-gray-600 text-center mt-6'>
            ※上のボタンでクチコミをコピーし、Googleマップにクチコミ投稿することができます。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
