import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { babyApi, recordsApi, Record as RecordType, DiaperData, syncApi } from '../api';
import Layout from '../components/Layout';
import { formatRecordTime, toLocalDateTimeString, getRecordIcon, getRecordLabel } from '../utils/format';
import { useSync } from '../hooks/useSync';

export default function DiaperPage() {
  const [diaperType, setDiaperType] = useState<'pee' | 'poop' | 'both'>('pee');
  const [time, setTime] = useState(toLocalDateTimeString());
  const [loading, setLoading] = useState(false);
  const [babies, setBabies] = useState<any[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>('');
  const [records, setRecords] = useState<RecordType[]>([]);
  const { createSyncRecord, sync } = useSync();
  const navigate = useNavigate();

  useEffect(() => {
    babyApi.getAll().then(res => {
      const babiesList = res.data.babies || [];
      setBabies(babiesList);
      if (babiesList.length > 0) {
        setSelectedBabyId(babiesList[0].id);
        loadRecords(babiesList[0].id);
      }
    });
  }, []);

  const loadRecords = async (babyId: string) => {
    try {
      const res = await recordsApi.getAll({ baby_id: babyId, type: 'diaper' });
      const diaperRecords = (res.data.records || []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 20);
      setRecords(diaperRecords);
    } catch (err) {
      console.error('Failed to load records:', err);
    }
  };

  const handleBabyChange = (babyId: string) => {
    setSelectedBabyId(babyId);
    loadRecords(babyId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBabyId) return;

    setLoading(true);
    try {
      const recordData = { type: diaperType, time };
      const syncRecord = createSyncRecord(selectedBabyId, 'diaper', recordData);
      await syncApi.push([syncRecord]);
      setTime(toLocalDateTimeString());
      sync().catch(console.error);
      navigate('/');
    } catch (err) {
      console.error('Failed to create record:', err);
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto p-4">
        {/* Back button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-[#7FC4C4] font-medium text-base min-h-[44px] px-2"
          >
            <span className="text-xl">←</span> 返回
          </button>
        </div>

        <h1 className="text-2xl font-bold text-[#3A3A3A] mb-6">记录换尿布</h1>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">宝宝</label>
            <select
              value={selectedBabyId}
              onChange={e => handleBabyChange(e.target.value)}
              className="w-full p-3 bg-white rounded-xl border border-gray-200 min-h-[44px]"
            >
              {babies.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">时间</label>
            <input
              type="datetime-local"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full p-3 bg-white rounded-xl border border-gray-200 min-h-[44px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">类型</label>
            <div className="flex gap-2">
              {(['pee', 'poop', 'both'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDiaperType(t)}
                  className={`flex-1 p-3 rounded-xl min-h-[44px] flex items-center justify-center font-medium ${
                    diaperType === t ? 'bg-[#7FC4C4] text-white' : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                >
                  {t === 'pee' ? '仅小便' : t === 'poop' ? '仅大便' : '两者都有'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-accent"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </form>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[#3A3A3A]">历史记录</h2>
          {records.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无记录</p>
          ) : (
            records.map(r => {
              const data = r.data as DiaperData;
              return (
                <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" role="img" aria-label="换尿布">{getRecordIcon('diaper')}</span>
                      <div className="text-[#3A3A3A] font-medium">
                        {getRecordLabel('diaper', data)}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatRecordTime(r.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
