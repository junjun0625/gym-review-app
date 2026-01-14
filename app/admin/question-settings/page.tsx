'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  label: string;
  type: string;
  options: string[];
  category?: string;
  ai_use?: boolean;
  step?: number;
}

export default function QuestionsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [questionPool, setQuestionPool] = useState<Question[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth !== 'true') {
      router.push('/admin');
      return;
    }
    setIsAuthenticated(true);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const poolRes = await fetch('/api/admin/question-pool');
      const poolData = await poolRes.json();
      setQuestionPool(poolData);

      const questionsRes = await fetch('/api/admin/questions');
      const questionsData = await questionsRes.json();
      setCurrentQuestions(questionsData);

      const ids = new Set(questionsData.map((q: Question) => q.id));
      setSelectedIds(ids);
    } catch (error) {
      console.error('データ取得エラー:', error);
      alert('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id: string) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleStepChange = (id: string, step: number) => {
    setCurrentQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, step } : q))
    );
  };

  const handleAiUseChange = (id: string, aiUse: boolean) => {
    setCurrentQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, ai_use: aiUse } : q))
    );
  };

  const handleSave = async () => {
    try {
      const selectedQuestions = questionPool
        .filter(q => selectedIds.has(q.id))
        .map((q) => {
          const existing = currentQuestions.find(cq => cq.id === q.id);
          return {
            id: q.id,
            label: q.label,
            type: q.type,
            options: q.options,
            ai_use: existing?.ai_use ?? true,
            step: existing?.step ?? 1,
          };
        });

      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: selectedQuestions }),
      });

      if (res.ok) {
        alert('質問を保存しました！');
        fetchData();
      } else {
        alert('保存に失敗しました');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    router.push('/admin');
  };

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">データを読み込んでいます...</div>;
  }

  const groupedByCategory = questionPool.reduce((acc, q) => {
    const category = q.category || 'その他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">質問管理</h1>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← 基本設定に戻る
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:text-red-800"
            >
              ログアウト
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">質問項目プール</h2>
            <p className="text-sm text-gray-600 mb-4">
              アンケートに表示したい質問を選択してください
            </p>

            <div className="space-y-6">
              {Object.entries(groupedByCategory).map(([category, questions]) => (
                <div key={category}>
                  <h3 className="font-semibold text-gray-700 mb-2 pb-2 border-b">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {questions.map(q => (
                      <label
                        key={q.id}
                        className="flex items-start p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(q.id)}
                          onChange={() => handleToggle(q.id)}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{q.label}</div>
                          <div className="text-sm text-gray-500">
                            {q.type === 'radio' && '（単一選択）'}
                            {q.type === 'checkbox' && '（複数選択）'}
                            {q.type === 'textarea' && '（自由記述）'}
                            {q.type === 'date' && '（日付）'}
                            {q.type === 'rating' && '（星評価）'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">選択中の質問（{selectedIds.size}件）</h2>
            <p className="text-sm text-gray-600 mb-4">
              ステップとAI利用の設定を行ってください
            </p>

            <div className="space-y-4 mb-6">
              {questionPool
                .filter(q => selectedIds.has(q.id))
                .map(q => {
                  const current = currentQuestions.find(cq => cq.id === q.id);
                  const step = current?.step ?? 1;
                  const aiUse = current?.ai_use ?? true;

                  return (
                    <div key={q.id} className="border rounded p-4">
                      <div className="font-medium mb-2">{q.label}</div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-sm text-gray-600">ステップ</label>
                          <select
                            value={step}
                            onChange={(e) => handleStepChange(q.id, parseInt(e.target.value))}
                            className="w-full mt-1 px-3 py-2 border rounded"
                          >
                            <option value={1}>ステップ1（基本情報）</option>
                            <option value={2}>ステップ2（入会前）</option>
                            <option value={3}>ステップ3（通ってみて）</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-sm text-gray-600">AI生成に利用</label>
                          <select
                            value={aiUse ? 'true' : 'false'}
                            onChange={(e) => handleAiUseChange(q.id, e.target.value === 'true')}
                            className="w-full mt-1 px-3 py-2 border rounded"
                          >
                            <option value="true">利用する</option>
                            <option value="false">利用しない</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              質問を保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}