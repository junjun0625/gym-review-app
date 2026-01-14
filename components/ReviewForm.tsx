'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

type Question = {
  id: string;
  label: string;
  type: string;
  options: string[];
  ai_use: boolean;
  step: number;
};

export default function ReviewForm() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [shopName, setShopName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkboxValues, setCheckboxValues] = useState<Record<string, string[]>>({});

  const totalSteps = 3;
  const router = useRouter();
  const { register, handleSubmit, setValue, getValues, watch, formState: { errors } } = useForm({
    mode: 'onChange',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // 質問を取得
        const questionsRes = await fetch('/api/questions');
        const questionsData = await questionsRes.json();
        setQuestions(questionsData);

        // 設定を取得
        const settingsRes = await fetch('/api/settings');
        const settingsData = await settingsRes.json();
        console.log('設定を取得しました:', settingsData);
        
        if (settingsData.shop_name) {
          setShopName(settingsData.shop_name);
          console.log('店舗名:', settingsData.shop_name);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleNext = () => {
    console.log('=== 次へボタンがクリックされました ===');
    
    // 現在のステップの質問を取得
    const currentQuestions = questions.filter((q) => q.step === currentStep);
    const formData = getValues();
    
    // 必須チェック
    let isValid = true;
    const missingFields: string[] = [];
    
    currentQuestions.forEach((question) => {
      if (question.type === 'checkbox') {
        // チェックボックスの場合
        if (!checkboxValues[question.id] || checkboxValues[question.id].length === 0) {
          isValid = false;
          missingFields.push(question.label);
        }
      } else {
        // その他の入力の場合
        if (!formData[question.id]) {
          isValid = false;
          missingFields.push(question.label);
        }
      }
    });
    
    if (!isValid) {
      alert(`以下の項目を入力してください：\n\n${missingFields.join('\n')}`);
      return;
    }
    
    console.log('バリデーションOK、次のステップへ進みます');
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    setCheckboxValues((prev) => {
      const current = prev[questionId] || [];
      const updated = checked
        ? [...current, option]
        : current.filter((item) => item !== option);
      return { ...prev, [questionId]: updated };
    });
  };

  const handleFinalSubmit = async () => {
    console.log('=== 送信ボタンがクリックされました ===');
    
    // 最終ステップの質問を取得
    const currentQuestions = questions.filter((q) => q.step === currentStep);
    const formData = getValues();
    
    // 必須チェック
    let isValid = true;
    const missingFields: string[] = [];
    
    currentQuestions.forEach((question) => {
      if (question.type === 'checkbox') {
        if (!checkboxValues[question.id] || checkboxValues[question.id].length === 0) {
          isValid = false;
          missingFields.push(question.label);
        }
      } else {
        if (!formData[question.id]) {
          isValid = false;
          missingFields.push(question.label);
        }
      }
    });
    
    if (!isValid) {
      alert(`以下の項目を入力してください：\n\n${missingFields.join('\n')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const data: any = { ...formData };

      Object.keys(checkboxValues).forEach((key) => {
        if (checkboxValues[key].length > 0) {
          data[key] = checkboxValues[key].join(', ');
        }
      });

      console.log('✅ 送信データ:', data);

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('送信に失敗しました');

      const result = await response.json();
      console.log('送信成功:', result);

      if (result.review) {
        localStorage.setItem('generatedReview', result.review);
      }

      router.push('/thanks');
    } catch (error) {
      console.error('送信エラー:', error);
      alert('送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <p className='text-gray-500'>読み込み中...</p>
      </div>
    );
  }

  const currentQuestions = questions.filter((q) => q.step === currentStep);

  const stepLabels = ['基本情報', '入会前', '通ってみて'];

  return (
    <div className='max-w-2xl mx-auto'>
      {/* 上部の説明文 */}
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold text-slate-800 mb-3'>
          {shopName || 'パーソナルジム'} アンケート
        </h1>
        <p className='text-gray-600'>
          サービス向上のため、アンケートにご協力をお願いいたします。
        </p>
      </div>

      {/* 進捗バー */}
      <div className='flex justify-center items-center mb-8'>
        {[1, 2, 3].map((step, index) => (
          <React.Fragment key={step}>
            <div className='flex flex-col items-center'>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                  currentStep >= step
                    ? 'bg-slate-900 text-white'
                    : 'bg-gray-300 text-gray-500'
                }`}
              >
                {step}
              </div>
              <p className='text-sm mt-2 text-gray-600'>{stepLabels[index]}</p>
            </div>
            {index < 2 && (
              <div
                className={`w-24 h-1 mx-2 ${
                  currentStep > step ? 'bg-slate-900' : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* フォームカード */}
      <Card className='shadow-lg'>
        <CardHeader className='bg-slate-900 text-white py-6'>
          <CardTitle className='text-center text-xl font-bold'>
            ステップ {currentStep} / {totalSteps}
          </CardTitle>
        </CardHeader>
        <CardContent className='p-8 space-y-6'>
          {currentQuestions.map((question) => (
            <div key={question.id} className='space-y-3'>
              <Label className='text-base font-semibold text-slate-700'>
                {question.label} <span className='text-red-500'>*</span>
              </Label>

              {question.type === 'date' && (
                <Input
                  type='date'
                  {...register(question.id, { required: true })}
                  className='w-full'
                />
              )}

              {question.type === 'text' && (
                <Input
                  type='text'
                  {...register(question.id, { required: true })}
                  className='w-full'
                  placeholder='入力してください'
                />
              )}

              {question.type === 'textarea' && (
                <Textarea
                  {...register(question.id, { required: true })}
                  rows={4}
                  className='w-full resize-none'
                  placeholder='詳しく教えてください'
                />
              )}

              {question.type === 'radio' && (
                <RadioGroup
                  value={watch(question.id)}
                  onValueChange={(value) => {
                    setValue(question.id, value);
                    console.log(`ラジオボタン選択: ${question.id} = ${value}`);
                  }}
                  className='space-y-3'
                >
                  {question.options.map((option) => (
                    <div key={option} className='flex items-center space-x-3'>
                      <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                      <Label
                        htmlFor={`${question.id}-${option}`}
                        className='cursor-pointer'
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === 'checkbox' && (
                <div className='space-y-3'>
                  {question.options.map((option) => (
                    <div key={option} className='flex items-center space-x-3'>
                      <Checkbox
                        id={`${question.id}-${option}`}
                        checked={(checkboxValues[question.id] || []).includes(option)}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(question.id, option, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`${question.id}-${option}`}
                        className='cursor-pointer'
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'rating' && (
                <RadioGroup
                  value={watch(question.id)}
                  onValueChange={(value) => setValue(question.id, value)}
                  className='flex space-x-4'
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div key={rating} className='flex flex-col items-center'>
                      <RadioGroupItem
                        value={String(rating)}
                        id={`${question.id}-${rating}`}
                      />
                      <Label
                        htmlFor={`${question.id}-${rating}`}
                        className='text-sm mt-1 cursor-pointer'
                      >
                        {rating}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          ))}

          <div className='flex justify-between pt-6'>
            {currentStep > 1 && (
              <Button
                type='button'
                onClick={handleBack}
                variant='outline'
                className='px-8'
              >
                戻る
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button
                type='button'
                onClick={handleNext}
                className='ml-auto px-8 bg-slate-900 hover:bg-slate-800'
              >
                次へ
              </Button>
            ) : (
              <Button
                type='button'
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className='ml-auto px-8 bg-slate-900 hover:bg-slate-800'
              >
                {isSubmitting ? '送信中...' : '送信する'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
