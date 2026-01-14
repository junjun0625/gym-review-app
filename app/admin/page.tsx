'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // セッションストレージから認証状態を確認
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('設定の取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        sessionStorage.setItem('admin_authenticated', 'true');
        setIsAuthenticated(true);
        fetchSettings();
      } else {
        alert('パスワードが間違っています');
      }
    } catch (error) {
      console.error('認証エラー:', error);
      alert('認証に失敗しました');
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('設定を保存しました');
      } else {
        alert('保存に失敗しました');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    setPassword('');
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <p className='text-gray-500'>読み込み中...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-center'>管理画面ログイン</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label>パスワード</Label>
              <Input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder='パスワードを入力'
              />
            </div>
            <Button onClick={handleLogin} className='w-full'>
              ログイン
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-3xl font-bold text-slate-800'>管理画面</h1>
          <Button onClick={handleLogout} variant='outline'>
            ログアウト
          </Button>
        </div>

        {/* 設定編集 */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>基本設定</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label>店舗名</Label>
              <Input
                value={settings.shop_name || ''}
                onChange={(e) =>
                  setSettings({ ...settings, shop_name: e.target.value })
                }
                placeholder='パーソナルジム Poco 森下店'
              />
            </div>

            <div>
              <Label>GoogleマップURL</Label>
              <Input
                value={settings.google_map_url || ''}
                onChange={(e) =>
                  setSettings({ ...settings, google_map_url: e.target.value })
                }
                placeholder='https://www.google.com/...'
              />
            </div>

            <div>
              <Label>キーワード（カンマ区切り）</Label>
              <Textarea
                value={settings.keywords || ''}
                onChange={(e) =>
                  setSettings({ ...settings, keywords: e.target.value })
                }
                placeholder='マンツーマン指導, アットホームな雰囲気, 駅近'
                rows={3}
              />
              <p className='text-sm text-gray-500 mt-1'>
                AIクチコミ生成時に、これらのキーワードから1つ以上を自然に挿入します
              </p>
            </div>

            <Button onClick={handleSaveSettings} disabled={saving} className='w-full'>
              {saving ? '保存中...' : '設定を保存'}
            </Button>
          </CardContent>
        </Card>

        {/* ナビゲーション */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Card className='cursor-pointer hover:shadow-lg transition-shadow'
                onClick={() => router.push('/admin/questions')}>
            <CardHeader>
              <CardTitle>質問管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600'>アンケートの質問項目を管理します</p>
            </CardContent>
          </Card>

          <Card className='cursor-pointer hover:shadow-lg transition-shadow'
                onClick={() => router.push('/admin/responses')}>
            <CardHeader>
              <CardTitle>回答履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600'>過去の回答を閲覧・ダウンロードします</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
