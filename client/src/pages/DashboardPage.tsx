import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { babyApi, recordsApi, Record as RecordType } from '../api';
import Layout from '../components/Layout';
import QuickEntrySheet from '../components/QuickEntrySheet';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { IconSettings, IconFeed, IconPump, IconDiaper, IconWeight, IconChevronRight, IconPlus, IconBaby } from '../components/icons';
import { formatTimeAgo, getRecordLabel } from '../utils/format';
import { useSync } from '../hooks/useSync';

const typeColors: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  feed: { bg: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-200', accent: 'bg-rose-400' },
  pump: { bg: 'bg-sky-50', text: 'text-sky-500', border: 'border-sky-200', accent: 'bg-sky-400' },
  diaper: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', accent: 'bg-amber-400' },
  weight: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', accent: 'bg-emerald-400' },
};

export default function DashboardPage() {
  const [babies, setBabies] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [recentRecords, setRecentRecords] = useState<RecordType[]>([]);
  const [latestWeight, setLatestWeight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const { sync } = useSync();

  useEffect(() => {
    loadData();
    sync().catch(console.error);
  }, []);

  const loadData = async () => {
    try {
      const babiesRes = await babyApi.getAll();
      const babiesList = babiesRes.data.babies || [];
      setBabies(babiesList);

      if (babiesList.length > 0) {
        const babyId = babiesList[0].id;
        const recordsRes = await recordsApi.getAll({ baby_id: babyId });
        const allRecords = recordsRes.data.records || [];
        const today = new Date().toDateString();
        const todayRecords = allRecords.filter((r: any) =>
          new Date(r.createdAt).toDateString() === today
        );

        const feedCount = todayRecords.filter((r: any) => r.type === 'feed').length;
        const diaperCount = todayRecords.filter((r: any) => r.type === 'diaper').length;
        const lastFeed = todayRecords
          .filter((r: any) => r.type === 'feed')
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        const weightRecords = allRecords
          .filter((r: any) => r.type === 'weight')
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latest = weightRecords[0] || null;

        const recent = [...allRecords]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 8);

        setStats({ feedCount, diaperCount, lastFeed });
        setLatestWeight(latest);
        setRecentRecords(recent);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSuccess = () => {
    loadData();
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 pt-3 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-serif font-bold text-stone-900">宝宝护理追踪</h1>
          <Link
            to="/settings"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-warm-50 shadow-soft text-stone-400 hover:text-stone-600 transition-colors"
            aria-label="设置"
          >
            <IconSettings size={20} />
          </Link>
        </div>

        {babies.length === 0 ? (
          <Card>
            <EmptyState
              icon={<IconBaby size={48} />}
              title="还没有宝宝档案"
              description="先去设置页面添加宝宝信息"
              action={
                <Link
                  to="/settings"
                  className="inline-block px-5 py-2.5 bg-rose-400 text-white rounded-xl min-h-[44px] font-medium shadow-soft hover:bg-rose-500 transition-colors"
                >
                  去设置宝宝信息
                </Link>
              }
            />
          </Card>
        ) : (
          <>
            {/* 今日摘要 */}
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-1">今日摘要</h2>
              <div className="grid grid-cols-3 gap-2">
                <Card padding="sm" className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-400 flex items-center justify-center mx-auto mb-2">
                    <IconFeed size={20} />
                  </div>
                  <div className="text-2xl font-bold text-rose-500 leading-tight">{stats?.feedCount || 0}</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">喂奶</div>
                </Card>
                <Card padding="sm" className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center mx-auto mb-2">
                    <IconDiaper size={20} />
                  </div>
                  <div className="text-2xl font-bold text-amber-500 leading-tight">{stats?.diaperCount || 0}</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">换尿布</div>
                </Card>
                <Card padding="sm" className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <IconWeight size={20} />
                  </div>
                  <div className="text-2xl font-bold text-warm-500 leading-tight">
                    {latestWeight ? `${latestWeight.data.weightKg}` : '—'}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">体重 kg</div>
                </Card>
              </div>
              {stats?.lastFeed && (
                <p className="text-xs text-stone-400 mt-2 text-center">
                  上次喂奶：{new Date(stats.lastFeed.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            {/* 快捷操作 */}
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-1">快捷操作</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { to: '/feed', icon: IconFeed, label: '记录喂奶', color: typeColors.feed },
                  { to: '/pump', icon: IconPump, label: '记录吸奶', color: typeColors.pump },
                  { to: '/diaper', icon: IconDiaper, label: '换尿布', color: typeColors.diaper },
                  { to: '/weight', icon: IconWeight, label: '记录体重', color: typeColors.weight },
                ].map(({ to, icon: Icon, label, color }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border ${color.border} ${color.bg} hover:shadow-soft transition-all active:scale-[0.98]`}
                  >
                    <div className={`w-9 h-9 rounded-lg ${color.accent} text-white flex items-center justify-center`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-sm font-medium text-stone-700">{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 最近记录 */}
            <Card>
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">最近记录</h2>
              {recentRecords.length === 0 ? (
                <p className="text-stone-400 text-center py-6 text-sm">暂无记录</p>
              ) : (
                <div className="space-y-0">
                  {recentRecords.map((record) => {
                    const colors = typeColors[record.type] || typeColors.weight;
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center`}>
                            {record.type === 'feed' && <IconFeed size={16} />}
                            {record.type === 'pump' && <IconPump size={16} />}
                            {record.type === 'diaper' && <IconDiaper size={16} />}
                            {record.type === 'weight' && <IconWeight size={16} />}
                          </div>
                          <div>
                            <div className="text-stone-700 text-sm font-medium">{getRecordLabel(record.type, record.data)}</div>
                            <div className="text-xs text-stone-400">{record.baby?.name || ''}</div>
                          </div>
                        </div>
                        <div className="text-xs text-stone-400 whitespace-nowrap ml-2">
                          {formatTimeAgo(record.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <Link
                  to="/history"
                  className="flex-1 flex items-center justify-center gap-1 text-sm text-stone-500 hover:text-stone-700 font-medium py-2 rounded-lg hover:bg-warm-100 transition-colors"
                >
                  查看全部 <IconChevronRight size={16} />
                </Link>
                <Link
                  to="/stats"
                  className="flex-1 flex items-center justify-center gap-1 text-sm text-stone-500 hover:text-stone-700 font-medium py-2 rounded-lg hover:bg-warm-100 transition-colors"
                >
                  数据统计 <IconChevronRight size={16} />
                </Link>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* FAB */}
      {babies.length > 0 && (
        <button
          className="fixed right-5 bottom-20 w-14 h-14 rounded-full bg-amber-400 text-white shadow-[0_4px_14px_rgba(251,191,36,0.35)] flex items-center justify-center hover:bg-amber-500 active:scale-95 transition-all z-40"
          onClick={() => setShowQuickEntry(true)}
          aria-label="快速记录"
        >
          <IconPlus size={24} />
        </button>
      )}

      {/* Quick Entry Sheet */}
      {showQuickEntry && babies.length > 0 && (
        <QuickEntrySheet
          babyId={babies[0].id}
          onClose={() => setShowQuickEntry(false)}
          onSuccess={handleQuickSuccess}
        />
      )}
    </Layout>
  );
}
