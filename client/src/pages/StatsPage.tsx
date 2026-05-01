import { useState, useEffect } from 'react';
import { babyApi, statsApi, DayStats, StatsSummary } from '../api';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import TabBar from '../components/ui/TabBar';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { IconStats } from '../components/icons';

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
  return DAY_LABELS[new Date(dateStr).getDay()];
}

const tabColors = {
  feed: { bar: 'bg-rose-400', text: 'text-rose-500', bg: 'bg-rose-100' },
  pump: { bar: 'bg-violet-400', text: 'text-violet-500', bg: 'bg-violet-100' },
  diaper: { bar: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' },
};

export default function StatsPage() {
  const [babies, setBabies] = useState<any[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState('');
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

  const maxFeedCount = Math.max(...stats.map(s => s.feed.count), 1);
  const maxDiaperCount = Math.max(...stats.map(s => s.diaper.count), 1);
  const maxPumpCount = Math.max(...stats.map(s => s.pump.count), 1);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 pt-3">
          <PageHeader title="数据统计" />
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  const colors = tabColors[activeTab];

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 pt-3 pb-24">
        <PageHeader title="数据统计" />

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

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Card padding="sm" className="text-center">
              <div className="text-xl font-bold text-rose-500">{summary.feed.totalCount}</div>
              <div className="text-[11px] text-stone-400">喂奶次数</div>
              <div className="text-xs font-medium text-rose-400 mt-0.5">{summary.feed.totalAmount}ml</div>
            </Card>
            <Card padding="sm" className="text-center">
              <div className="text-xl font-bold text-violet-500">{summary.pump.totalCount}</div>
              <div className="text-[11px] text-stone-400">吸奶次数</div>
              <div className="text-xs font-medium text-violet-400 mt-0.5">{summary.pump.totalAmount}ml</div>
            </Card>
            <Card padding="sm" className="text-center">
              <div className="text-xl font-bold text-stone-600">{summary.diaper.totalCount}</div>
              <div className="text-[11px] text-stone-400">换尿布次数</div>
              <div className="text-xs font-medium text-stone-400 mt-0.5">日均{summary.diaper.avgPerDay}</div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4">
          <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Chart */}
        {stats.length === 0 ? (
          <Card>
            <EmptyState
              icon={<IconStats size={40} />}
              title="暂无统计数据"
              description="记录一些数据后即可查看统计"
            />
          </Card>
        ) : (
          <Card>
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">近7天趋势</h3>

            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-2 h-44 mb-3">
              {stats.map((day) => {
                let count = 0;
                let max = 1;
                if (activeTab === 'feed') { count = day.feed.count; max = maxFeedCount; }
                else if (activeTab === 'pump') { count = day.pump.count; max = maxPumpCount; }
                else { count = day.diaper.count; max = maxDiaperCount; }
                const height = (count / max) * 100;

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="flex flex-col items-center justify-end h-32 w-full">
                      <div className={`text-xs font-semibold ${colors.text} mb-1`}>
                        {count > 0 ? count : ''}
                      </div>
                      <div
                        className={`w-8 ${colors.bar} rounded-t-lg transition-all duration-500`}
                        style={{ height: `${height}%`, minHeight: count > 0 ? 6 : 0 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis */}
            <div className="flex justify-between gap-2">
              {stats.map((day) => (
                <div key={day.date} className="flex-1 text-center">
                  <div className="text-[11px] text-stone-400">{getDayLabel(day.date)}</div>
                  <div className="text-[11px] text-stone-500">{formatDateShort(day.date)}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Daily Detail */}
        {stats.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-1">每日详情</h3>
            <Card padding="sm">
              {stats.slice().reverse().map((day, idx) => (
                <div key={day.date} className={`py-3 ${idx < stats.length - 1 ? 'border-b border-stone-100' : ''}`}>
                  <div className="text-sm font-medium text-stone-700 mb-1.5">
                    {formatDateShort(day.date)} {getDayLabel(day.date)}
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {day.feed.count > 0 && (
                      <span className="bg-rose-50 text-rose-500 px-2 py-1 rounded-lg">
                        喂奶 {day.feed.count}次 {day.feed.totalAmount}ml
                      </span>
                    )}
                    {day.pump.count > 0 && (
                      <span className="bg-violet-50 text-violet-500 px-2 py-1 rounded-lg">
                        吸奶 {day.pump.count}次 {day.pump.totalAmount}ml
                      </span>
                    )}
                    {day.diaper.count > 0 && (
                      <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">
                        尿布 {day.diaper.count}次
                      </span>
                    )}
                    {day.weight.count > 0 && day.weight.latest && (
                      <span className="bg-stone-100 text-stone-500 px-2 py-1 rounded-lg">
                        体重 {day.weight.latest}kg
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
