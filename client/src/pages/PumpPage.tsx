import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { babyApi, recordsApi, Record as RecordType, PumpData, syncApi } from '../api';
import Layout from '../components/Layout';
import { formatRecordTime, toLocalDateTimeString, getRecordIcon, getRecordLabel } from '../utils/format';
import { useSync } from '../hooks/useSync';

export default function PumpPage() {
  const [amount, setAmount] = useState('');
  const [time, setTime] = useState(toLocalDateTimeString());
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [babies, setBabies] = useState<any[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>('');
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
      const res = await recordsApi.getAll({ baby_id: babyId, type: 'pump' });
      const pumpRecords = (res.data.records || []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 20);
      setRecords(pumpRecords);
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
    if (!selectedBabyId || !amount || Number(amount) <= 0) return;

    setLoading(true);
    try {
      const recordData = { amount: Number(amount), time };
      const syncRecord = createSyncRecord(selectedBabyId, 'pump', recordData);
      await syncApi.push([syncRecord]);
      setAmount('');
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

        <h1 className="text-2xl font-bold text-[#3A3A3A] mb-6">记录吸奶</h1>

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
            <label className="block text-sm text-gray-600 mb-1">吸奶量 (ml)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full p-3 bg-white rounded-xl border border-gray-200 min-h-[44px]"
              placeholder="请输入吸奶量"
              min="1"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !amount || Number(amount) <= 0}
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
              const data = r.data as PumpData;
              return (
                <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" role="img" aria-label="吸奶">{getRecordIcon('pump')}</span>
                      <div>
                        <div className="text-[#3A3A3A] font-medium">
                          {getRecordLabel('pump', data)}
                        </div>
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
