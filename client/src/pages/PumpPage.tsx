import { useState } from 'react';
import RecordPage, { FormData } from '../components/RecordPage';
import { IconPump } from '../components/icons';

export default function PumpPage() {
  const [formData, setFormData] = useState<FormData>({ amount: '' });

  return (
    <RecordPage
      type="pump"
      title="记录吸奶"
      icon={<IconPump size={20} />}
      formData={formData}
      setFormData={setFormData}
      resetFormData={() => setFormData({ amount: '' })}
      buildRecord={(_babyId, time, data) => {
        const amount = Number(data.amount);
        if (!amount || amount <= 0) {
          return { data: {}, valid: false };
        }
        return {
          data: { amount, time },
          valid: true,
        };
      }}
      renderForm={() => (
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">吸奶量 (ml)</label>
          <input
            type="number"
            value={formData.amount as string}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
            className="w-full p-3 bg-warm-50 rounded-xl border border-stone-200 min-h-[44px] text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300 transition-colors"
            placeholder="请输入吸奶量"
            min="1"
            required
          />
        </div>
      )}
    />
  );
}
