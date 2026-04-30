import { useState, useEffect, useCallback } from 'react';
import { babyApi, recordsApi, Record as RecordType, RecordType as FilterType } from '../api';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import TabBar from '../components/ui/TabBar';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Button from '../components/ui/Button';
import { IconDelete, IconHistory } from '../components/icons';
import { getRecordIcon } from '../components/icons';
import { formatRecordTime, getRecordLabel } from '../utils/format';

const typeColors: Record<string, { bg: string; text: string }> = {
  feed: { bg: 'bg-rose-100', text: 'text-rose-500' },
  pump: { bg: 'bg-sky-100', text: 'text-sky-500' },
  diaper: { bg: 'bg-amber-100', text: 'text-amber-600' },
  weight: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
};

type TabType = 'all' | FilterType;

const TABS: { key: TabType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'feed', label: '喂奶' },
  { key: 'pump', label: '吸奶' },
  { key: 'diaper', label: '尿布' },
  { key: 'weight', label: '体重' },
];

const PAGE_SIZE = 20;

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const recordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (recordDate.getTime() === today.getTime()) return '今天';
  if (recordDate.getTime() === yesterday.getTime()) return '昨天';
  if (recordDate >= weekAgo) return '本周';
  if (recordDate >= monthAgo) return '本月';
  return '更早';
}

interface GroupedRecords {
  [key: string]: RecordType[];
}

export default function HistoryPage() {
  const [babies, setBabies] = useState<any[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [allRecords, setAllRecords] = useState<RecordType[]>([]);
  const [displayedRecords, setDisplayedRecords] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    babyApi.getAll().then(res => {
      const babiesList = res.data.babies || [];
      setBabies(babiesList);
      if (babiesList.length > 0) {
        setSelectedBabyId(babiesList[0].id);
      }
    });
  }, []);

  const loadRecords = useCallback(async (babyId: string, type?: FilterType) => {
    try {
      setLoading(true);
      const params: { baby_id: string; type?: FilterType } = { baby_id: babyId };
      if (type) params.type = type;
      const res = await recordsApi.getAll(params);
      const records = (res.data.records || []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllRecords(records);
      setDisplayedRecords(records.slice(0, PAGE_SIZE));
      setHasMore(records.length > PAGE_SIZE);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBabyId) {
      loadRecords(selectedBabyId, activeTab === 'all' ? undefined : activeTab);
    }
  }, [selectedBabyId, activeTab, loadRecords]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const currentLength = displayedRecords.length;
    const more = allRecords.slice(currentLength, currentLength + PAGE_SIZE);
    setDisplayedRecords([...displayedRecords, ...more]);
    setHasMore(allRecords.length > currentLength + PAGE_SIZE);
    setLoadingMore(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const recordId = deleteTarget;
    setDeleteTarget(null);
    setDeletingIds(prev => new Set(prev).add(recordId));
    try {
      await recordsApi.delete(recordId);
      setAllRecords(prev => prev.filter(r => r.id !== recordId));
      setDisplayedRecords(prev => prev.filter(r => r.id !== recordId));
    } catch (err) {
      console.error('Failed to delete record:', err);
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    }
  };

  const groupedRecords: GroupedRecords = {};
  displayedRecords.forEach(record => {
    const group = getDateGroup(record.createdAt);
    if (!groupedRecords[group]) groupedRecords[group] = [];
    groupedRecords[group].push(record);
  });

  const groupOrder = ['今天', '昨天', '本周', '本月', '更早'];

  if (loading) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 pt-3">
          <PageHeader title="历史记录" />
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 pt-3 pb-24">
        <PageHeader title="历史记录" />

        {/* Baby selector */}
        {babies.length > 1 && (
          <div className="mb-4">
            <select
              value={selectedBabyId}
              onChange={e => setSelectedBabyId(e.target.value)}
              className="w-full p-3 bg-warm-50 rounded-xl border border-stone-200 min-h-[44px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              {babies.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4">
          <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Records */}
        {displayedRecords.length === 0 ? (
          <Card>
            <EmptyState
              icon={<IconHistory size={40} />}
              title="暂无记录"
              description="还没有相关记录"
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {groupOrder.map(group => {
              const records = groupedRecords[group];
              if (!records || records.length === 0) return null;

              return (
                <div key={group}>
                  <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">
                    {group}
                  </h2>
                  <Card padding="sm">
                    {records.map((record, index) => (
                      <div
                        key={record.id}
                        className={`flex items-center justify-between py-3 ${
                          index < records.length - 1 ? 'border-b border-stone-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${typeColors[record.type]?.bg || 'bg-stone-100'} ${typeColors[record.type]?.text || 'text-stone-500'} flex items-center justify-center`}>
                            {getRecordIcon(record.type, 16)}
                          </div>
                          <div>
                            <div className="text-stone-700 text-sm font-medium">
                              {getRecordLabel(record.type, record.data)}
                            </div>
                            <div className="text-xs text-stone-400">
                              {record.baby?.name || ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-400 whitespace-nowrap">
                            {formatRecordTime(record.createdAt)}
                          </span>
                          <button
                            onClick={() => setDeleteTarget(record.id)}
                            disabled={deletingIds.has(record.id)}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-300 hover:text-red-400 disabled:opacity-40 transition-colors"
                            aria-label="删除记录"
                          >
                            {deletingIds.has(record.id) ? (
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <IconDelete size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </Card>
                </div>
              );
            })}

            {hasMore && (
              <div className="text-center pt-2">
                <Button variant="secondary" size="sm" onClick={loadMore} loading={loadingMore} className="w-auto px-6">
                  加载更多
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除记录"
        message="确定删除这条记录吗？此操作不可恢复。"
        confirmLabel="删除"
        cancelLabel="取消"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
