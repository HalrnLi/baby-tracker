import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { babyApi, recordsApi, Record as RecordType } from '../api';
import Layout from '../components/Layout';
import { formatTimeAgo, getRecordIcon, getRecordLabel } from '../utils/format';
import { useSync } from '../hooks/useSync';

export default function DashboardPage() {
  const [babies, setBabies] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [recentRecords, setRecentRecords] = useState<RecordType[]>([]);
  const [latestWeight, setLatestWeight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[#3A3A3A]">宝宝护理追踪</h1>
          <Link
            to="/settings"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm text-lg"
            aria-label="设置"
          >
            ⚙️
          </Link>
        </div>

        {babies.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-gray-500 mb-3">还没有宝宝档案</p>
            <Link
              to="/settings"
              className="inline-block px-5 py-2.5 bg-[#5EBFBF] text-white rounded-xl min-h-[44px] font-medium shadow-md"
            >
              去设置宝宝信息
            </Link>
          </div>
        ) : (
          <>
            {/* 今日摘要 — 紧凑横向三栏 */}
            <div className="bg-[#FBF3EE] rounded-2xl p-4 shadow-sm mb-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">今日摘要</h2>
              <div className="grid grid-cols-3 gap-2">
                {/* 喂奶 */}
                <div className="bg-[#D9828E]/10 rounded-xl py-3 px-2 text-center border border-[#D9828E]/20">
                  <div className="text-2xl mb-0.5">🍼</div>
                  <div className="text-2xl font-bold text-[#D9828E] leading-tight">{stats?.feedCount || 0}</div>
                  <div className="text-xs text-gray-500 mt-0.5">喂奶</div>
                </div>
                {/* 换尿布 */}
                <div className="bg-[#5EBFBF]/10 rounded-xl py-3 px-2 text-center border border-[#5EBFBF]/20">
                  <div className="text-2xl mb-0.5">🩲</div>
                  <div className="text-2xl font-bold text-[#5EBFBF] leading-tight">{stats?.diaperCount || 0}</div>
                  <div className="text-xs text-gray-500 mt-0.5">换尿布</div>
                </div>
                {/* 最新体重 */}
                <div className="bg-gray-50 rounded-xl py-3 px-2 text-center border border-gray-200">
                  <div className="text-2xl mb-0.5">📊</div>
                  <div className="text-lg font-bold text-[#3A3A3A] leading-tight">
                    {latestWeight ? `${latestWeight.data.weightKg}` : '—'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">体重 kg</div>
                </div>
              </div>
              {stats?.lastFeed && (
                <p className="text-xs text-gray-400 mt-2.5 text-center">
                  上次喂奶：{new Date(stats.lastFeed.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            {/* 快捷操作区 — 浅色背景突出层次 */}
            <div className="bg-[#FBF3EE] rounded-2xl p-3.5 mb-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">快捷操作</h2>
              <div className="grid grid-cols-4 gap-2">
                <Link
                  to="/feed"
                  className="btn-card bg-[#D9828E] border-[#BE6B7A] rounded-xl py-2.5"
                >
                  <div className="text-2xl mb-0.5">🍼</div>
                  <div className="text-xs font-medium text-[#3A3A3A] leading-tight">喂奶</div>
                </Link>
                <Link
                  to="/pump"
                  className="btn-card bg-[#5EBFBF] border-[#4A9E9E] rounded-xl py-2.5"
                >
                  <div className="text-2xl mb-0.5">🧴</div>
                  <div className="text-xs font-medium text-[#3A3A3A] leading-tight">吸奶</div>
                </Link>
                <Link
                  to="/diaper"
                  className="btn-card bg-[#5EBFBF] border-[#4A9E9E] rounded-xl py-2.5"
                >
                  <div className="text-2xl mb-0.5">🩲</div>
                  <div className="text-xs font-medium text-[#3A3A3A] leading-tight">换尿布</div>
                </Link>
                <Link
                  to="/weight"
                  className="btn-card bg-[#D9828E] border-[#BE6B7A] rounded-xl py-2.5"
                >
                  <div className="text-2xl mb-0.5">📊</div>
                  <div className="text-xs font-medium text-[#3A3A3A] leading-tight">体重</div>
                </Link>
              </div>
            </div>

            {/* 最近记录 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">最近记录</h2>
              {recentRecords.length === 0 ? (
                <p className="text-gray-400 text-center py-3 text-sm">暂无记录</p>
              ) : (
                <div className="space-y-0">
                  {recentRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl" role="img" aria-label={record.type}>{getRecordIcon(record.type)}</span>
                        <div>
                          <div className="text-[#3A3A3A] text-sm font-medium">{getRecordLabel(record.type, record.data)}</div>
                          <div className="text-xs text-gray-400">{record.baby?.name || ''}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {formatTimeAgo(record.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link
                to="/history"
                className="block text-center text-sm text-[#D9828E] font-medium mt-3 py-1 min-h-[36px]"
              >
                查看全部历史 →
              </Link>
              <Link
                to="/stats"
                className="block text-center text-sm text-[#5EBFBF] font-medium mt-1 py-1 min-h-[36px]"
              >
                数据统计 →
              </Link>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
