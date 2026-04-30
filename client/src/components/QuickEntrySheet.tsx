import { useState, useEffect, useRef } from 'react';
import { syncApi, SyncRecord } from '../api';
import { IconFeed, IconPump, IconDiaper, IconBreast, IconFormula, IconPee, IconPoop, IconBack } from './icons';
import Toast from './ui/Toast';

interface QuickEntrySheetProps {
  babyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type EntryStep = 'type' | 'feed-source' | 'pump-amount' | 'diaper-type';

export default function QuickEntrySheet({ babyId, onClose, onSuccess }: QuickEntrySheetProps) {
  const [step, setStep] = useState<EntryStep>('type');
  const [feedSource, setFeedSource] = useState<'breast' | 'formula' | null>(null);
  const [pumpAmount, setPumpAmount] = useState('');
  const [formulaAmount, setFormulaAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'pump-amount' || step === 'feed-source') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [step]);

  const showToast = (message: string, autoClose = true) => {
    setToastMsg(message);
    setToastVisible(true);
    if (autoClose) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }
  };

  const handleSubmit = async (record: SyncRecord) => {
    setSubmitting(true);
    try {
      await syncApi.push([record]);
      showToast('记录成功');
    } catch (err) {
      console.error('Failed to submit:', err);
      showToast('提交失败，请重试', false);
      setTimeout(() => setToastVisible(false), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  const submitDiaper = (type: 'pee' | 'poop' | 'both') => {
    handleSubmit({
      babyId,
      type: 'diaper',
      data: { type },
      clientCreatedAt: new Date().toISOString(),
    });
  };

  const submitFeed = (source: 'breast' | 'formula', amount?: number) => {
    if (source === 'breast') {
      handleSubmit({
        babyId,
        type: 'feed',
        data: { source: 'breast', amount: 0 },
        clientCreatedAt: new Date().toISOString(),
      });
    } else {
      if (!amount || amount <= 0) {
        showToast('请输入有效的奶量', false);
        setTimeout(() => setToastVisible(false), 2000);
        return;
      }
      handleSubmit({
        babyId,
        type: 'feed',
        data: { source: 'formula', amount },
        clientCreatedAt: new Date().toISOString(),
      });
    }
  };

  const submitPump = () => {
    const amount = parseInt(pumpAmount, 10);
    if (!amount || amount <= 0) {
      showToast('请输入有效的奶量', false);
      setTimeout(() => setToastVisible(false), 2000);
      return;
    }
    handleSubmit({
      type: 'pump',
      data: { amount },
      clientCreatedAt: new Date().toISOString(),
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 animate-fade-in" onClick={handleBackdropClick}>
      <div className="bg-warm-100 rounded-t-[20px] px-6 pt-3 pb-10 w-full max-w-[480px] animate-slide-up">
        {/* Handle */}
        <div className="w-9 h-1 bg-stone-300 rounded-full mx-auto mb-4" />

        <h2 className="text-center text-base font-semibold text-stone-800 mb-5">快速记录</h2>

        {/* Step: Select type */}
        {step === 'type' && (
          <div className="grid grid-cols-3 gap-3">
            <button
              className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-rose-200 bg-rose-50 hover:shadow-soft active:scale-[0.96] transition-all min-h-[88px]"
              onClick={() => setStep('feed-source')}
            >
              <div className="w-10 h-10 rounded-xl bg-rose-400 text-white flex items-center justify-center mb-2">
                <IconFeed size={20} />
              </div>
              <span className="text-xs font-semibold text-stone-700">喂奶</span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-sky-200 bg-sky-50 hover:shadow-soft active:scale-[0.96] transition-all min-h-[88px]"
              onClick={() => setStep('pump-amount')}
            >
              <div className="w-10 h-10 rounded-xl bg-sky-400 text-white flex items-center justify-center mb-2">
                <IconPump size={20} />
              </div>
              <span className="text-xs font-semibold text-stone-700">吸奶</span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-amber-200 bg-amber-50 hover:shadow-soft active:scale-[0.96] transition-all min-h-[88px]"
              onClick={() => setStep('diaper-type')}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-white flex items-center justify-center mb-2">
                <IconDiaper size={20} />
              </div>
              <span className="text-xs font-semibold text-stone-700">尿布</span>
            </button>
          </div>
        )}

        {/* Step: Feed source */}
        {step === 'feed-source' && (
          <div className="animate-fade-in">
            <p className="text-center text-sm text-stone-500 mb-4">选择喂奶方式</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-rose-200 bg-rose-50 hover:shadow-soft active:scale-[0.96] transition-all"
                onClick={() => submitFeed('breast')}
                disabled={submitting}
              >
                <IconBreast size={28} className="text-rose-400 mb-1" />
                <span className="text-sm font-medium text-stone-700">母乳</span>
              </button>
              <button
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-sky-200 bg-sky-50 hover:shadow-soft active:scale-[0.96] transition-all"
                onClick={() => setFeedSource('formula')}
                disabled={submitting}
              >
                <IconFormula size={28} className="text-sky-400 mb-1" />
                <span className="text-sm font-medium text-stone-700">奶粉</span>
              </button>
            </div>
            {feedSource === 'formula' && (
              <div className="flex gap-2 mb-4 animate-fade-in">
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="decimal"
                  className="flex-1 p-3 border-2 border-stone-200 rounded-xl text-base bg-warm-50 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-400 transition-colors"
                  placeholder="输入奶量 (ml)"
                  value={formulaAmount}
                  onChange={(e) => setFormulaAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitFeed('formula', parseInt(formulaAmount, 10))}
                />
                <button
                  className="px-5 py-3 bg-rose-400 text-white rounded-xl text-sm font-semibold hover:bg-rose-500 active:scale-[0.97] transition-all disabled:opacity-50"
                  onClick={() => submitFeed('formula', parseInt(formulaAmount, 10))}
                  disabled={submitting || !formulaAmount}
                >
                  {submitting ? '...' : '确定'}
                </button>
              </div>
            )}
            <button
              className="w-full flex items-center justify-center gap-1 py-2 text-stone-400 hover:text-stone-600 text-sm transition-colors"
              onClick={() => { setStep('type'); setFeedSource(null); }}
            >
              <IconBack size={16} /> 返回
            </button>
          </div>
        )}

        {/* Step: Pump amount */}
        {step === 'pump-amount' && (
          <div className="animate-fade-in">
            <p className="text-center text-sm text-stone-500 mb-4">输入吸奶量</p>
            <div className="flex gap-2 mb-4">
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                className="flex-1 p-3 border-2 border-stone-200 rounded-xl text-base bg-warm-50 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-400 transition-colors"
                placeholder="输入奶量 (ml)"
                value={pumpAmount}
                onChange={(e) => setPumpAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitPump()}
              />
              <button
                className="px-5 py-3 bg-rose-400 text-white rounded-xl text-sm font-semibold hover:bg-rose-500 active:scale-[0.97] transition-all disabled:opacity-50"
                onClick={submitPump}
                disabled={submitting || !pumpAmount}
              >
                {submitting ? '...' : '确定'}
              </button>
            </div>
            <button
              className="w-full flex items-center justify-center gap-1 py-2 text-stone-400 hover:text-stone-600 text-sm transition-colors"
              onClick={() => setStep('type')}
            >
              <IconBack size={16} /> 返回
            </button>
          </div>
        )}

        {/* Step: Diaper type */}
        {step === 'diaper-type' && (
          <div className="animate-fade-in">
            <p className="text-center text-sm text-stone-500 mb-4">选择尿布类型</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-sky-200 bg-sky-50 hover:shadow-soft active:scale-[0.96] transition-all"
                onClick={() => submitDiaper('pee')}
                disabled={submitting}
              >
                <IconPee size={24} className="text-sky-400 mb-1" />
                <span className="text-xs font-medium text-stone-700">小便</span>
              </button>
              <button
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-rose-200 bg-rose-50 hover:shadow-soft active:scale-[0.96] transition-all"
                onClick={() => submitDiaper('poop')}
                disabled={submitting}
              >
                <IconPoop size={24} className="text-rose-400 mb-1" />
                <span className="text-xs font-medium text-stone-700">大便</span>
              </button>
              <button
                className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-stone-200 bg-stone-100 hover:shadow-soft active:scale-[0.96] transition-all"
                onClick={() => submitDiaper('both')}
                disabled={submitting}
              >
                <IconDiaper size={24} className="text-stone-500 mb-1" />
                <span className="text-xs font-medium text-stone-700">两者</span>
              </button>
            </div>
            <button
              className="w-full flex items-center justify-center gap-1 py-2 text-stone-400 hover:text-stone-600 text-sm transition-colors"
              onClick={() => setStep('type')}
            >
              <IconBack size={16} /> 返回
            </button>
          </div>
        )}
      </div>

      <Toast
        message={toastMsg}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </div>
  );
}
