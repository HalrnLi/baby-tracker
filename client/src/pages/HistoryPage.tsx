import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { babyApi, recordsApi, Record as RecordType, RecordType as FilterType } from '../api';
import Layout from '../components/Layout';
import { formatRecordTime, getRecordIcon, getRecordLabel } from '../utils/format';

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
  const navigate = useNavigate();
  const [babies, setBabies] = useState<any[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [allRecords, setAllRecords] = useState<RecordType[]>([]);
  const [displayedRecords, setDisplayedRecords] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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
      if (type) {
        params.type = type;
      }
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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleBabyChange = (babyId: string) => {
    setSelectedBabyId(babyId);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const currentLength = displayedRecords.length;
    const more = allRecords.slice(currentLength, currentLength + PAGE_SIZE);
    setDisplayedRecords([...displayedRecords, ...more]);
    setHasMore(allRecords.length > currentLength + PAGE_SIZE);
    setLoadingMore(false);
  };

  // Group records by date
  const groupedRecords: GroupedRecords = {};
  displayedRecords.forEach(record => {
    const group = getDateGroup(record.createdAt);
    if (!groupedRecords[group]) {
      groupedRecords[group] = [];
    }
    groupedRecords[group].push(record);
  });

  const groupOrder = ['今天', '昨天', '本周', '本月', '更早'];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 pt-3 pb-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-[#7FC4C4] font-medium text-base min-h-[44px] px-2"
          >
            <span className="text-xl">←</span> 返回
          </button>
          <h1 className="flex-1 text-xl font-bold text-[#3A3A3A] text-center pr-10">历史记录</h1>
        </div>

        {/* Baby selector */}
        {babies.length > 1 && (
          <div className="mb-4">
            <select
              value={selectedBabyId}
              onChange={e => handleBabyChange(e.target.value)}
              className="w-full p-3 bg-white rounded-xl border border-gray-200 min-h-[44px] shadow-sm"
            >
              {babies.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                activeTab === tab.key
                  ? 'bg-[#D9828E] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Records list */}
        {displayedRecords.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400">暂无记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupOrder.map(group => {
              const records = groupedRecords[group];
              if (!records || records.length === 0) return null;

              return (
                <div key={group}>
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                    {group}
                  </h2>
                  <div className="bg-white rounded-2xl p-4 shadow-sm space-y-0">
                    {records.map((record, index) => (
                      <div
                        key={record.id}
                        className={`flex items-start justify-between py-3 ${
                          index < records.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl" role="img" aria-label={record.type}>
                            {getRecordIcon(record.type)}
                          </span>
                          <div>
                            <div className="text-[#3A3A3A] font-medium">
                              {getRecordLabel(record.type, record.data)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {record.baby?.name || ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 whitespace-nowrap ml-2">
                          {formatRecordTime(record.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Load more */}
            {hasMore && (
              <div className="text-center pt-2">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 bg-[#5EBFBF] text-white rounded-xl min-h-[44px] font-medium shadow-md disabled:opacity-50"
                >
                  {loadingMore ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}