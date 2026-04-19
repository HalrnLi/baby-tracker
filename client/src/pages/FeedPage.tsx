import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { babyApi, recordsApi, Record as RecordType, FeedData, syncApi } from '../api';
import Layout from '../components/Layout';
import { formatRecordTime, toLocalDateTimeString, getRecordIcon, getRecordLabel } from '../utils/format';
import { useSync } from '../hooks/useSync';

export default function FeedPage() {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<'breast' | 'formula'>('breast');
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
      const res = await recordsApi.getAll({ baby_id: babyId, type: 'feed' });
      const feedRecords = (res.data.records || []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 20);
      setRecords(feedRecords);
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
    if (source === 'formula' && (!amount || Number(amount) <= 0)) return;

    setLoading(true);
    try {
      const recordData = { amount: source === 'breast' ? 0 : Number(amount), source, time };
      const syncRecord = createSyncRecord(selectedBabyId, 'feed', recordData);
      await syncApi.push([syncRecord]);
      setAmount('');
      setTime(toLocalDateTimeString());
      sync().catch(console.error);
      // Auto return to home after successful save
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

        <h1 className="text-2xl font-bold text-[#3A3A3A] mb-6">记录喂奶</h1>

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

          {source === 'formula' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">奶量 (ml)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full p-3 bg-white rounded-xl border border-gray-200 min-h-[44px]"
                placeholder="请输入奶量"
                min="1"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1">奶源</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSource('breast')}
                className={`flex-1 p-3 rounded-xl min-h-[44px] flex items-center justify-center font-medium ${
                  source === 'breast' ? 'bg-[#E89898] text-[#3A3A3A]' : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                母乳
              </button>
              <button
                type="button"
                onClick={() => setSource('formula')}
                className={`flex-1 p-3 rounded-xl min-h-[44px] flex items-center justify-center font-medium ${
                  source === 'formula' ? 'bg-[#E89898] text-[#3A3A3A]' : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                奶粉
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (source === 'formula' && (!amount || Number(amount) <= 0))}
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
              const data = r.data as FeedData;
              return (
                <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" role="img" aria-label="喂奶">{getRecordIcon('feed')}</span>
                      <div>
                        <div className="text-[#3A3A3A] font-medium">
                          {getRecordLabel('feed', data)}
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
