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
                    ? 'bg-amber-100 border-amber-300 text-amber-600'
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
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 90, 120, 150, 180].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    className={`py-3 rounded-xl border-2 font-semibold text-base transition-all min-h-[44px] ${
                      Number(formData.amount) === amount
                        ? 'bg-amber-100 border-amber-300 text-amber-600'
                        : 'bg-warm-100 border-stone-200 text-stone-500 hover:bg-amber-50 hover:border-amber-200'
                    }`}
                    onClick={() => setFormData({ ...formData, amount: String(amount) })}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    />
  );
}
