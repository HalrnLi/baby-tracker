import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { babyApi, recordsApi, Record as RecordType, FeedData, DiaperData } from '../api';
import Layout from '../components/Layout';
import QuickEntrySheet from '../components/QuickEntrySheet';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { IconSettings, IconFeed, IconPump, IconDiaper, IconWeight, IconChevronRight, IconPlus, IconBaby, IconBreast, IconFormula, IconPee, IconPoop, IconBack } from '../components/icons';
import { formatTimeAgo, getRecordLabel } from '../utils/format';
import { useSync } from '../hooks/useSync';

export default function DashboardPage() {
  const [babies, setBabies] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [recentRecords, setRecentRecords] = useState<RecordType[]>([]);
  const [latestWeight, setLatestWeight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [todayFeedRecords, setTodayFeedRecords] = useState<RecordType[]>([]);
  const [todayDiaperRecords, setTodayDiaperRecords] = useState<RecordType[]>([]);
  const [detailSheetType, setDetailSheetType] = useState<'feed' | 'diaper' | null>(null);
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

        const feedRecs = todayRecords.filter((r: any) => r.type === 'feed');
        const diaperRecs = todayRecords.filter((r: any) => r.type === 'diaper');
        const feedCount = feedRecs.length;
        const diaperCount = diaperRecs.length;
        const lastFeed = [...feedRecs]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const lastDiaper = [...diaperRecs]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        const weightRecords = allRecords
          .filter((r: any) => r.type === 'weight')
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latest = weightRecords[0] || null;

        const sortedRecords = [...allRecords]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const recent = [
          sortedRecords.find((r: any) => r.type === 'feed' && r.data.source === 'breast'),
          sortedRecords.find((r: any) => r.type === 'feed' && r.data.source === 'formula'),
          sortedRecords.find((r: any) => r.type === 'pump'),
          sortedRecords.find((r: any) => r.type === 'diaper' && r.data.type === 'pee'),
          sortedRecords.find((r: any) => r.type === 'diaper' && r.data.type === 'poop'),
        ].filter(Boolean) as RecordType[];

        setStats({ feedCount, diaperCount, lastFeed, lastDiaper });
        setTodayFeedRecords(feedRecs);
        setTodayDiaperRecords(diaperRecs);
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

  const formatTimeOnly = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 pt-3 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
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
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">今日摘要</h2>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className="p-3 bg-warm-50 rounded-2xl shadow-soft text-center hover:shadow-lifted active:scale-[0.97] transition-all cursor-pointer"
                  onClick={() => setDetailSheetType('feed')}
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-400 flex items-center justify-center mx-auto mb-2">
                    <IconFeed size={20} />
                  </div>
                  <div className="text-2xl font-bold text-rose-500 leading-tight">{stats?.feedCount || 0}</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">喂奶</div>
                </button>
                <button
                  className="p-3 bg-warm-50 rounded-2xl shadow-soft text-center hover:shadow-lifted active:scale-[0.97] transition-all cursor-pointer"
                  onClick={() => setDetailSheetType('diaper')}
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-500 flex items-center justify-center mx-auto mb-2">
                    <IconDiaper size={20} />
                  </div>
                  <div className="text-2xl font-bold text-sky-500 leading-tight">{stats?.diaperCount || 0}</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">换尿布</div>
                </button>
                <Link
                  to="/weight"
                  className="p-3 bg-warm-50 rounded-2xl shadow-soft text-center hover:shadow-lifted active:scale-[0.97] transition-all block"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <IconWeight size={20} />
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 leading-tight">
                    {latestWeight ? `${latestWeight.data.weightKg}` : '—'}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">体重 kg</div>
                </Link>
              </div>
              {(stats?.lastFeed || stats?.lastDiaper) && (
                <p className="text-xs text-stone-400 mt-2 text-center">
                  {stats?.lastFeed && <>上次喂奶：{formatTimeAgo(stats.lastFeed.createdAt)}</>}
                  {stats?.lastFeed && stats?.lastDiaper && <> | </>}
                  {stats?.lastDiaper && <>上次换尿布：{formatTimeAgo(stats.lastDiaper.createdAt)}</>}
                </p>
              )}
            </div>

            {/* 最近记录 */}
            <Card padding="sm">
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">最近记录</h2>
              {recentRecords.length === 0 ? (
                <p className="text-stone-400 text-center py-6 text-sm">暂无记录</p>
              ) : (
                <div className="space-y-0">
                  {recentRecords.map((record) => {
                    const data = record.data as any;
                    const iconInfo = record.type === 'feed' && data.source === 'breast' ? { icon: IconBreast, bg: 'bg-rose-100', text: 'text-rose-400' }
                      : record.type === 'feed' && data.source === 'formula' ? { icon: IconFormula, bg: 'bg-amber-100', text: 'text-amber-500' }
                      : record.type === 'pump' ? { icon: IconPump, bg: 'bg-violet-100', text: 'text-violet-400' }
                      : record.type === 'diaper' && data.type === 'pee' ? { icon: IconPee, bg: 'bg-sky-100', text: 'text-sky-400' }
                      : record.type === 'diaper' && data.type === 'poop' ? { icon: IconPoop, bg: 'bg-rose-100', text: 'text-rose-400' }
                      : record.type === 'diaper' ? { icon: IconDiaper, bg: 'bg-amber-100', text: 'text-amber-500' }
                      : { icon: IconWeight, bg: 'bg-emerald-100', text: 'text-emerald-600' };
                    const Icon = iconInfo.icon;
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${iconInfo.bg} ${iconInfo.text} flex items-center justify-center`}>
                            <Icon size={16} />
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
              <div className="flex gap-2 mt-2">
                <Link
                  to="/history"
                  className="flex-1 flex items-center justify-center gap-1 text-sm text-stone-500 hover:text-stone-700 font-medium py-1.5 rounded-lg hover:bg-warm-100 transition-colors"
                >
                  查看全部 <IconChevronRight size={16} />
                </Link>
                <Link
                  to="/stats"
                  className="flex-1 flex items-center justify-center gap-1 text-sm text-stone-500 hover:text-stone-700 font-medium py-1.5 rounded-lg hover:bg-warm-100 transition-colors"
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

      {/* Feed Detail Sheet */}
      {detailSheetType === 'feed' && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setDetailSheetType(null); }}
        >
          <div className="bg-warm-100 rounded-t-[20px] px-6 pt-3 pb-10 w-full max-w-[480px] animate-slide-up max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-9 h-1 bg-stone-300 rounded-full mx-auto mb-4" />
            <h2 className="text-center text-base font-semibold text-stone-800 mb-5">喂奶记录</h2>

            <div className="text-center text-sm text-stone-500 mb-4">
              母乳 {todayFeedRecords.filter(r => (r.data as FeedData).source === 'breast').length}次
              {' | '}
              奶粉 {todayFeedRecords.filter(r => (r.data as FeedData).source === 'formula').length}次
            </div>

            <div className="space-y-2">
              {todayFeedRecords.length === 0 ? (
                <p className="text-center text-stone-400 py-6 text-sm">今日暂无喂奶记录</p>
              ) : (
                [...todayFeedRecords]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(record => {
                    const data = record.data as FeedData;
                    return (
                      <div key={record.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-warm-50 shadow-soft">
                        <div className="flex items-center gap-2.5">
                          {data.source === 'breast' ? (
                            <IconBreast size={18} className="text-rose-400" />
                          ) : (
                            <IconFormula size={18} className="text-amber-500" />
                          )}
                          <span className="text-sm text-stone-700">
                            {data.source === 'breast' ? (data.amount ? `母乳 ${data.amount}ml` : '亲喂') : `奶粉 ${data.amount}ml`}
                          </span>
                        </div>
                        <span className="text-xs text-stone-400">
                          {formatTimeOnly(record.createdAt)}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>

            <button
              className="w-full flex items-center justify-center gap-1 py-3 mt-4 text-stone-400 hover:text-stone-600 text-sm transition-colors"
              onClick={() => setDetailSheetType(null)}
            >
              <IconBack size={16} /> 返回
            </button>
          </div>
        </div>
      )}

      {/* Diaper Detail Sheet */}
      {detailSheetType === 'diaper' && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setDetailSheetType(null); }}
        >
          <div className="bg-warm-100 rounded-t-[20px] px-6 pt-3 pb-10 w-full max-w-[480px] animate-slide-up max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-9 h-1 bg-stone-300 rounded-full mx-auto mb-4" />
            <h2 className="text-center text-base font-semibold text-stone-800 mb-5">尿布记录</h2>

            <div className="text-center text-sm text-stone-500 mb-4">
              小便 {todayDiaperRecords.filter(r => (r.data as DiaperData).type === 'pee').length}次
              {' | '}
              大便 {todayDiaperRecords.filter(r => (r.data as DiaperData).type === 'poop').length}次
            </div>

            <div className="space-y-2">
              {todayDiaperRecords.length === 0 ? (
                <p className="text-center text-stone-400 py-6 text-sm">今日暂无尿布记录</p>
              ) : (
                [...todayDiaperRecords]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(record => {
                    const data = record.data as DiaperData;
                    const typeInfo: Record<string, { icon: typeof IconPee; color: string; label: string }> = {
                      pee: { icon: IconPee, color: 'text-sky-400', label: '小便' },
                      poop: { icon: IconPoop, color: 'text-rose-400', label: '大便' },
                    };
                    const info = typeInfo[data.type];
                    const Icon = info.icon;
                    return (
                      <div key={record.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-warm-50 shadow-soft">
                        <div className="flex items-center gap-2.5">
                          <Icon size={18} className={info.color} />
                          <span className="text-sm text-stone-700">{info.label}</span>
                        </div>
                        <span className="text-xs text-stone-400">
                          {formatTimeOnly(record.createdAt)}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>

            <button
              className="w-full flex items-center justify-center gap-1 py-3 mt-4 text-stone-400 hover:text-stone-600 text-sm transition-colors"
              onClick={() => setDetailSheetType(null)}
            >
              <IconBack size={16} /> 返回
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
