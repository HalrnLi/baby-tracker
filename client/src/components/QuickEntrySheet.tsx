import { useState, useEffect, useRef } from 'react';
import { syncApi, SyncRecord } from '../api';

interface QuickEntrySheetProps {
  babyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type EntryStep = 'type' | 'feed-source' | 'pump-amount' | 'diaper-type';

interface ToastState {
  visible: boolean;
  message: string;
}

export default function QuickEntrySheet({ babyId, onClose, onSuccess }: QuickEntrySheetProps) {
  const [step, setStep] = useState<EntryStep>('type');
  const [feedSource, setFeedSource] = useState<'breast' | 'formula' | null>(null);
  const [pumpAmount, setPumpAmount] = useState('');
  const [formulaAmount, setFormulaAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'pump-amount' || step === 'feed-source') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [step]);

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast({ visible: false, message: '' });
      onSuccess();
      onClose();
    }, 1500);
  };

  const handleSubmit = async (record: SyncRecord) => {
    setSubmitting(true);
    try {
      await syncApi.push([record]);
      showToast('记录成功');
    } catch (err) {
      console.error('Failed to submit:', err);
      setToast({ visible: true, message: '提交失败，请重试' });
      setTimeout(() => setToast({ visible: false, message: '' }), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  const submitDiaper = (type: 'pee' | 'poop' | 'both') => {
    const record: SyncRecord = {
      babyId,
      type: 'diaper',
      data: { type },
      clientCreatedAt: new Date().toISOString(),
    };
    handleSubmit(record);
  };

  const submitFeed = (source: 'breast' | 'formula', amount?: number) => {
    if (source === 'breast') {
      const record: SyncRecord = {
        babyId,
        type: 'feed',
        data: { source: 'breast', amount: 0 },
        clientCreatedAt: new Date().toISOString(),
      };
      handleSubmit(record);
    } else {
      if (!amount || amount <= 0) {
        setToast({ visible: true, message: '请输入有效的奶量' });
        setTimeout(() => setToast({ visible: false, message: '' }), 2000);
        return;
      }
      const record: SyncRecord = {
        babyId,
        type: 'feed',
        data: { source: 'formula', amount },
        clientCreatedAt: new Date().toISOString(),
      };
      handleSubmit(record);
    }
  };

  const submitPump = () => {
    const amount = parseInt(pumpAmount, 10);
    if (!amount || amount <= 0) {
      setToast({ visible: true, message: '请输入有效的奶量' });
      setTimeout(() => setToast({ visible: false, message: '' }), 2000);
      return;
    }
    const record: SyncRecord = {
      type: 'pump',
      data: { amount },
      clientCreatedAt: new Date().toISOString(),
    };
    handleSubmit(record);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="quick-entry-backdrop" onClick={handleBackdropClick}>
      <div className="quick-entry-sheet">
        <div className="sheet-handle" />

        <h2 className="sheet-title">快速记录</h2>

        {/* Step: Select type */}
        {step === 'type' && (
          <div className="type-grid">
            <button
              className="type-btn type-feed"
              onClick={() => setStep('feed-source')}
            >
              <span className="type-icon">🍼</span>
              <span className="type-label">喂奶</span>
            </button>
            <button
              className="type-btn type-pump"
              onClick={() => setStep('pump-amount')}
            >
              <span className="type-icon">🧴</span>
              <span className="type-label">吸奶</span>
            </button>
            <button
              className="type-btn type-diaper"
              onClick={() => setStep('diaper-type')}
            >
              <span className="type-icon">🩲</span>
              <span className="type-label">尿布</span>
            </button>
          </div>
        )}

        {/* Step: Feed source */}
        {step === 'feed-source' && (
          <div className="sub-step">
            <p className="sub-title">选择喂奶方式</p>
            <div className="sub-grid">
              <button
                className="sub-btn sub-breast"
                onClick={() => submitFeed('breast')}
                disabled={submitting}
              >
                <span className="sub-icon">🤱</span>
                <span>母乳</span>
              </button>
              <button
                className="sub-btn sub-formula"
                onClick={() => setFeedSource('formula')}
                disabled={submitting}
              >
                <span className="sub-icon">🍼</span>
                <span>奶粉</span>
              </button>
            </div>
            {feedSource === 'formula' && (
              <div className="amount-input-wrap">
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="decimal"
                  className="amount-input"
                  placeholder="输入奶量 (ml)"
                  value={formulaAmount}
                  onChange={(e) => setFormulaAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitFeed('formula', parseInt(formulaAmount, 10))}
                />
                <button
                  className="submit-btn"
                  onClick={() => submitFeed('formula', parseInt(formulaAmount, 10))}
                  disabled={submitting || !formulaAmount}
                >
                  {submitting ? '提交中...' : '确定'}
                </button>
              </div>
            )}
            <button className="back-btn" onClick={() => setStep('type')}>← 返回</button>
          </div>
        )}

        {/* Step: Pump amount */}
        {step === 'pump-amount' && (
          <div className="sub-step">
            <p className="sub-title">输入吸奶量</p>
            <div className="amount-input-wrap">
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                className="amount-input"
                placeholder="输入奶量 (ml)"
                value={pumpAmount}
                onChange={(e) => setPumpAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitPump()}
              />
              <button
                className="submit-btn"
                onClick={submitPump}
                disabled={submitting || !pumpAmount}
              >
                {submitting ? '提交中...' : '确定'}
              </button>
            </div>
            <button className="back-btn" onClick={() => setStep('type')}>← 返回</button>
          </div>
        )}

        {/* Step: Diaper type */}
        {step === 'diaper-type' && (
          <div className="sub-step">
            <p className="sub-title">选择尿布类型</p>
            <div className="sub-grid sub-grid-3">
              <button
                className="sub-btn"
                onClick={() => submitDiaper('pee')}
                disabled={submitting}
              >
                <span className="sub-icon">💧</span>
                <span>小便</span>
              </button>
              <button
                className="sub-btn"
                onClick={() => submitDiaper('poop')}
                disabled={submitting}
              >
                <span className="sub-icon">💩</span>
                <span>大便</span>
              </button>
              <button
                className="sub-btn"
                onClick={() => submitDiaper('both')}
                disabled={submitting}
              >
                <span className="sub-icon">💥</span>
                <span>两者</span>
              </button>
            </div>
            <button className="back-btn" onClick={() => setStep('type')}>← 返回</button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast.visible && (
        <div className="quick-toast">
          {toast.message}
        </div>
      )}
    </div>
  );
}