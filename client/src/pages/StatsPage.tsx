import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { babyApi, statsApi, DayStats, StatsSummary } from '../api';
import Layout from '../components/Layout';

type TabType = 'feed' | 'pump' | 'diaper';

const TABS: { key: TabType; label: string }[] = [
  { key: 'feed', label: '喂奶' },
  { key: 'pump', label: '吸奶' },
  { key: 'diaper', label: '尿布' },
];

const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return DAY_LABELS[date.getDay()];
}

export default function StatsPage() {
  const navigate = useNavigate();
  const [babies, setBabies] = useState<any[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [stats, setStats] = useState<DayStats[]>([]);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    babyApi.getAll().then(res => {
      const babiesList = res.data.babies || [];
      setBabies(babiesList);
      if (babiesList.length > 0) {
        setSelectedBabyId(babiesList[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedBabyId) return;

    const loadStats = async () => {
      try {
        setLoading(true);
        const res = await statsApi.get({ baby_id: selectedBabyId, days: 7 });
        setStats(res.data.stats || []);
        setSummary(res.data.summary || null);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [selectedBabyId]);

  const handleBabyChange = (babyId: string) => {
    setSelectedBabyId(babyId);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Calculate max value for bar heights
  const maxFeedCount = Math.max(...stats.map(s => s.feed.count), 1);
  const maxDiaperCount = Math.max(...stats.map(s => s.diaper.count), 1);
  const maxPumpCount = Math.max(...stats.map(s => s.pump.count), 1);

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
          <h1 className="flex-1 text-xl font-bold text-[#3A3A3A] text-center pr-10">数据统计</h1>
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

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {/* Feed Summary */}
            <div className="bg-white rounded-xl p-3 shadow-sm text-center">
              <div className="text-xl mb-1">🍼</div>
              <div className="text-xl font-bold text-[#D9828E]">{summary.feed.totalCount}</div>
              <div className="text-xs text-gray-500">喂奶次数</div>
              <div className="text-sm font-medium text-[#D9828E]">{summary.feed.totalAmount}ml</div>
            </div>
            {/* Pump Summary */}
            <div className="bg-white rounded-xl p-3 shadow-sm text-center">
              <div className="text-xl mb-1">🧴</div>
              <div className="text-xl font-bold text-[#5EBFBF]">{summary.pump.totalCount}</div>
              <div className="text-xs text-gray-500">吸奶次数</div>
              <div className="text-sm font-medium text-[#5EBFBF]">{summary.pump.totalAmount}ml</div>
            </div>
            {/* Diaper Summary */}
            <div className="bg-white rounded-xl p-3 shadow-sm text-center">
              <div className="text-xl mb-1">🩲</div>
              <div className="text-xl font-bold text-[#5EBFBF]">{summary.diaper.totalCount}</div>
              <div className="text-xs text-gray-500">换尿布次数</div>
              <div className="text-sm font-medium text-gray-400">日均{summary.diaper.avgPerDay}</div>
            </div>
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

        {/* Chart */}
        {stats.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-gray-400">暂无统计数据</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">近7天趋势</h3>

            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-2 h-44 mb-3">
              {stats.map((day) => {
                const feedHeight = (day.feed.count / maxFeedCount) * 100;
                const pumpHeight = (day.pump.count / maxPumpCount) * 100;
                const diaperHeight = (day.diaper.count / maxDiaperCount) * 100;

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full">
                    {activeTab === 'feed' && (
                      <div className="flex flex-col items-center justify-end h-32 w-full">
                        <div className="text-xs font-semibold text-[#D9828E] mb-1">{day.feed.count > 0 ? day.feed.count : ''}</div>
                        <div
                          className="w-10 bg-[#D9828E] rounded-t transition-all"
                          style={{ height: `${feedHeight}%`, minHeight: day.feed.count > 0 ? 4 : 0 }}
                        />
                      </div>
                    )}
                    {activeTab === 'pump' && (
                      <div className="flex flex-col items-center justify-end h-32 w-full">
                        <div className="text-xs font-semibold text-[#7FBFBF] mb-1">{day.pump.count > 0 ? day.pump.count : ''}</div>
                        <div
                          className="w-10 bg-[#7FBFBF] rounded-t transition-all"
                          style={{ height: `${pumpHeight}%`, minHeight: day.pump.count > 0 ? 4 : 0 }}
                        />
                      </div>
                    )}
                    {activeTab === 'diaper' && (
                      <div className="flex flex-col items-center justify-end h-32 w-full">
                        <div className="text-xs font-semibold text-[#5EBFBF] mb-1">{day.diaper.count > 0 ? day.diaper.count : ''}</div>
                        <div
                          className="w-10 bg-[#5EBFBF] rounded-t transition-all"
                          style={{ height: `${diaperHeight}%`, minHeight: day.diaper.count > 0 ? 4 : 0 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between gap-2">
              {stats.map((day) => (
                <div key={day.date} className="flex-1 text-center">
                  <div className="text-xs text-gray-400">{getDayLabel(day.date)}</div>
                  <div className="text-xs text-gray-500">{formatDateShort(day.date)}</div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
              {activeTab === 'feed' && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[#D9828E]"></div>
                  <span className="text-xs text-gray-500">喂奶</span>
                </div>
              )}
              {activeTab === 'pump' && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[#7FBFBF]"></div>
                  <span className="text-xs text-gray-500">吸奶</span>
                </div>
              )}
              {activeTab === 'diaper' && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[#5EBFBF]"></div>
                  <span className="text-xs text-gray-500">换尿布</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detail Stats by Day */}
        {stats.length > 0 && (
          <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">每日详情</h3>
            <div className="space-y-3">
              {stats.slice().reverse().map((day) => (
                <div key={day.date} className="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                  <div className="text-sm font-medium text-[#3A3A3A] mb-1">
                    {formatDateShort(day.date)} {getDayLabel(day.date)}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {day.feed.count > 0 && (
                      <span className="bg-[#D9828E]/10 text-[#D9828E] px-2 py-1 rounded">
                        🍼 喂奶 {day.feed.count}次 {day.feed.totalAmount}ml
                      </span>
                    )}
                    {day.pump.count > 0 && (
                      <span className="bg-[#7FBFBF]/10 text-[#5EBFBF] px-2 py-1 rounded">
                        🧴 吸奶 {day.pump.count}次 {day.pump.totalAmount}ml
                      </span>
                    )}
                    {day.diaper.count > 0 && (
                      <span className="bg-[#5EBFBF]/10 text-[#5EBFBF] px-2 py-1 rounded">
                        🩲 换尿布 {day.diaper.count}次 (小{day.diaper.pee} 大{day.diaper.poop})
                      </span>
                    )}
                    {day.weight.count > 0 && day.weight.latest && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        📊 体重 {day.weight.latest}kg
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
