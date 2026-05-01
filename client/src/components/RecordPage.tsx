import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { babyApi, recordsApi, Record as RecordType, RecordType as RType, syncApi } from '../api';
import Layout from './Layout';
import PageHeader from './ui/PageHeader';
import Card from './ui/Card';
import Button from './ui/Button';
import FormInput from './ui/FormInput';
import EmptyState from './ui/EmptyState';
import LoadingSpinner from './ui/LoadingSpinner';
import { formatRecordTime } from '../utils/format';
import { useSync } from '../hooks/useSync';
import { getRecordIcon } from './icons';

const typeColors: Record<string, { bg: string; text: string }> = {
  feed: { bg: 'bg-rose-100', text: 'text-rose-500' },
  pump: { bg: 'bg-violet-100', text: 'text-violet-500' },
  diaper: { bg: 'bg-amber-100', text: 'text-amber-600' },
  weight: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
};

interface RecordPageProps {
  type: RType;
  title: string;
  icon: ReactNode;
  renderForm: (props: {
    selectedBabyId: string;
    time: string;
    setTime: (t: string) => void;
  }) => ReactNode;
  buildRecord: (babyId: string, time: string, formData: FormData) => { data: Record<string, unknown>; valid: boolean };
  formData: FormData;
  setFormData: (data: FormData) => void;
  resetFormData: () => void;
}

export type FormData = Record<string, unknown>;

export default function RecordPage({
  type,
  title,
  renderForm,
  buildRecord,
  formData,
  resetFormData,
}: RecordPageProps) {
  const navigate = useNavigate();
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [babies, setBabies] = useState<any[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState('');
  const [records, setRecords] = useState<RecordType[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const { createSyncRecord, sync } = useSync();

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setTime(type === 'weight' ? `${year}-${month}-${day}` : `${year}-${month}-${day}T${hours}:${minutes}`);

    babyApi.getAll().then(res => {
      const babiesList = res.data.babies || [];
      setBabies(babiesList);
      if (babiesList.length > 0) {
        setSelectedBabyId(babiesList[0].id);
        loadRecords(babiesList[0].id);
      } else {
        setRecordsLoading(false);
      }
    });
  }, []);

  const loadRecords = async (babyId: string) => {
    try {
      setRecordsLoading(true);
      const res = await recordsApi.getAll({ baby_id: babyId, type });
      const sorted = (res.data.records || []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 20);
      setRecords(sorted);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleBabyChange = (babyId: string) => {
    setSelectedBabyId(babyId);
    loadRecords(babyId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBabyId) return;

    const { data, valid } = buildRecord(selectedBabyId, time, formData);
    if (!valid) return;

    setLoading(true);
    try {
      const syncRecord = createSyncRecord(selectedBabyId, type, data as any);
      await syncApi.push([syncRecord]);
      resetFormData();
      setTime(type === 'weight' ? new Date().toISOString().split('T')[0] : new Date().toISOString().slice(0, 16));
      sync().catch(console.error);
      navigate('/');
    } catch (err) {
      console.error('Failed to create record:', err);
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 pt-3 pb-24">
        <PageHeader title={title} />

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {babies.length > 1 && (
            <FormInput
              as="select"
              label="宝宝"
              value={selectedBabyId}
              onChange={e => handleBabyChange(e.target.value)}
            >
              {babies.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </FormInput>
          )}

          <FormInput
            as="input"
            label={type === 'weight' ? '日期' : '时间'}
            type={type === 'weight' ? 'date' : 'datetime-local'}
            value={time}
            onChange={e => setTime(e.target.value)}
            required
          />

          {renderForm({ selectedBabyId, time, setTime })}

          <Button type="submit" loading={loading}>
            保存
          </Button>
        </form>

        {/* History */}
        <div>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-1">历史记录</h2>
          {recordsLoading ? (
            <LoadingSpinner />
          ) : records.length === 0 ? (
            <Card>
              <EmptyState title="暂无记录" description="还没有相关记录" />
            </Card>
          ) : (
            <Card padding="sm">
              {records.map(r => (
                <div key={r.id} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${typeColors[r.type]?.bg || 'bg-stone-100'} ${typeColors[r.type]?.text || 'text-stone-500'} flex items-center justify-center`}>
                      {getRecordIcon(r.type, 16)}
                    </div>
                    <div>
                      <div className="text-stone-700 text-sm font-medium">
                        {getRecordLabel(r.type, r.data)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-stone-400">
                    {formatRecordTime(r.createdAt)}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}

function getRecordLabel(type: string, data: any): string {
  switch (type) {
    case 'feed': {
      const sourceMap: Record<string, string> = { breast: '母乳', formula: '奶粉' };
      const sourceLabel = sourceMap[data.source] || data.source;
      if (data.source === 'breast' || !data.amount) return sourceLabel;
      return `${sourceLabel} ${data.amount}ml`;
    }
    case 'pump': return `${data.amount}ml`;
    case 'diaper': {
      const typeMap: Record<string, string> = { pee: '小便', poop: '大便' };
      return typeMap[data.type] || '换尿布';
    }
    case 'weight': return `${data.weightKg} kg`;
    default: return '';
  }
}
