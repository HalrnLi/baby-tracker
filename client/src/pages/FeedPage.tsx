import { useState } from 'react';
import RecordPage, { FormData } from '../components/RecordPage';
import { IconFeed, IconBreast, IconFormula } from '../components/icons';

export default function FeedPage() {
  const [formData, setFormData] = useState<FormData>({ source: 'breast', amount: '' });

  return (
    <RecordPage
      type="feed"
      title="记录喂奶"
      icon={<IconFeed size={20} />}
      formData={formData}
      setFormData={setFormData}
      resetFormData={() => setFormData({ source: 'breast', amount: '' })}
      buildRecord={(_babyId, time, data) => {
        const source = data.source as 'breast' | 'formula';
        const amount = source === 'breast' ? 0 : Number(data.amount);
        if (source === 'formula' && (!amount || amount <= 0)) {
          return { data: {}, valid: false };
        }
        return {
          data: { amount, source, time },
          valid: true,
        };
      }}
      renderForm={() => (
        <>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">奶源</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, source: 'breast' })}
                className={`flex-1 p-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2 font-medium border transition-all ${
                  formData.source === 'breast'
                    ? 'bg-rose-100 border-rose-300 text-rose-600'
                    : 'bg-warm-100 border-stone-200 text-stone-500'
                }`}
              >
                <IconBreast size={18} />
                母乳
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, source: 'formula' })}
                className={`flex-1 p-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2 font-medium border transition-all ${
                  formData.source === 'formula'
                    ? 'bg-sky-100 border-sky-300 text-sky-600'
                    : 'bg-warm-100 border-stone-200 text-stone-500'
                }`}
              >
                <IconFormula size={18} />
                奶粉
              </button>
            </div>
          </div>

          {formData.source === 'formula' && (
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">奶量 (ml)</label>
              <input
                type="number"
                value={formData.amount as string}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="w-full p-3 bg-warm-50 rounded-xl border border-stone-200 min-h-[44px] text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-colors"
                placeholder="请输入奶量"
                min="1"
                required
              />
            </div>
          )}
        </>
      )}
    />
  );
}
