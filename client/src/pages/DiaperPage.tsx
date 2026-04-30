import { useState } from 'react';
import RecordPage, { FormData } from '../components/RecordPage';
import { IconDiaper, IconPee, IconPoop } from '../components/icons';

export default function DiaperPage() {
  const [formData, setFormData] = useState<FormData>({ diaperType: 'pee' });

  return (
    <RecordPage
      type="diaper"
      title="换尿布"
      icon={<IconDiaper size={20} />}
      formData={formData}
      setFormData={setFormData}
      resetFormData={() => setFormData({ diaperType: 'pee' })}
      buildRecord={(_babyId, _time, data) => {
        return {
          data: { type: data.diaperType },
          valid: true,
        };
      }}
      renderForm={() => (
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">尿布类型</label>
          <div className="flex gap-2">
            {[
              { key: 'pee', label: '小便', icon: IconPee, color: 'sky' },
              { key: 'poop', label: '大便', icon: IconPoop, color: 'rose' },
              { key: 'both', label: '两者', icon: IconDiaper, color: 'amber' },
            ].map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFormData({ ...formData, diaperType: key })}
                className={`flex-1 p-3 rounded-xl min-h-[44px] flex flex-col items-center justify-center gap-1 font-medium border transition-all ${
                  formData.diaperType === key
                    ? color === 'sky'
                      ? 'bg-sky-100 border-sky-300 text-sky-600'
                      : color === 'rose'
                      ? 'bg-rose-100 border-rose-300 text-rose-600'
                      : 'bg-amber-100 border-amber-300 text-amber-600'
                    : 'bg-warm-100 border-stone-200 text-stone-500'
                }`}
              >
                <Icon size={18} />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    />
  );
}
