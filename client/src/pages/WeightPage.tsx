import { useState } from 'react';
import RecordPage, { FormData } from '../components/RecordPage';
import { IconWeight } from '../components/icons';

export default function WeightPage() {
  const [formData, setFormData] = useState<FormData>({ weight: '' });

  return (
    <RecordPage
      type="weight"
      title="记录体重"
      icon={<IconWeight size={20} />}
      formData={formData}
      setFormData={setFormData}
      resetFormData={() => setFormData({ weight: '' })}
      buildRecord={(_babyId, time, data) => {
        const weightKg = Number(data.weight);
        if (!weightKg || weightKg <= 0) {
          return { data: {}, valid: false };
        }
        return {
          data: { weightKg, date: time },
          valid: true,
        };
      }}
      renderForm={() => (
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">体重 (kg)</label>
          <input
            type="number"
            step="0.01"
            value={formData.weight as string}
            onChange={e => setFormData({ ...formData, weight: e.target.value })}
            className="w-full p-3 bg-warm-50 rounded-xl border border-stone-200 min-h-[44px] text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-warm-300 focus:border-warm-300 transition-colors"
            placeholder="请输入体重"
            min="0.1"
            required
          />
        </div>
      )}
    />
  );
}
