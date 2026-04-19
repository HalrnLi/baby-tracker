import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { babyApi, remindersApi, Reminder } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { requestNotificationPermission } from '../hooks/useReminders';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [babies, setBabies] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);
  const [editingBabyId, setEditingBabyId] = useState<string | null>(null);

  // Reminder state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [pumpInterval, setPumpInterval] = useState(180);
  const [diaperInterval, setDiaperInterval] = useState(120);
  const [pumpEnabled, setPumpEnabled] = useState(false);
  const [diaperEnabled, setDiaperEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    babyApi.getAll().then(res => {
      const babiesList = res.data.babies || [];
      setBabies(babiesList);
      if (babiesList.length > 0) {
        const firstBaby = babiesList[0];
        setEditingBabyId(firstBaby.id);
        setName(firstBaby.name);
        setBirthDate(firstBaby.birthDate);
        setGender(firstBaby.gender);
        loadReminders(firstBaby.id, babiesList);
      }
    });

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const loadReminders = async (targetBabyId?: string, babiesList?: any[]) => {
    try {
      const res = await remindersApi.getAll();
      const reminderList = res.data.reminders || [];
      setReminders(reminderList);

      const babyId = targetBabyId || (babiesList && babiesList.length > 0 ? babiesList[0].id : (babies.length > 0 ? babies[0].id : undefined));
      if (!babyId || reminderList.length === 0) return;

      const pumpReminder = reminderList.find((r: Reminder) => r.type === 'pump' && r.babyId === babyId);
      const diaperReminder = reminderList.find((r: Reminder) => r.type === 'diaper' && r.babyId === babyId);

      if (pumpReminder) {
        setPumpInterval(pumpReminder.intervalMinutes);
        setPumpEnabled(pumpReminder.enabled);
      }
      if (diaperReminder) {
        setDiaperInterval(diaperReminder.intervalMinutes);
        setDiaperEnabled(diaperReminder.enabled);
      }
    } catch (err) {
      console.error('Failed to load reminders:', err);
    }
  };

  const handleRequestNotification = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
  };

  const saveReminders = async (babyId: string) => {
    const pumpReminder = reminders.find((r) => r.type === 'pump' && r.babyId === babyId);
    const diaperReminder = reminders.find((r) => r.type === 'diaper' && r.babyId === babyId);

    if (pumpReminder) {
      await remindersApi.update(pumpReminder.id, {
        intervalMinutes: pumpInterval,
        enabled: pumpEnabled,
      });
    } else {
      await remindersApi.create({
        babyId,
        type: 'pump',
        intervalMinutes: pumpInterval,
        enabled: pumpEnabled,
      });
    }

    if (diaperReminder) {
      await remindersApi.update(diaperReminder.id, {
        intervalMinutes: diaperInterval,
        enabled: diaperEnabled,
      });
    } else {
      await remindersApi.create({
        babyId,
        type: 'diaper',
        intervalMinutes: diaperInterval,
        enabled: diaperEnabled,
      });
    }

    await loadReminders();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !birthDate) return;
    setLoading(true);
    try {
      await babyApi.create({ name: name.trim(), birthDate, gender });
      const res = await babyApi.getAll();
      const babiesList = res.data.babies || [];
      setBabies(babiesList);
      if (babiesList.length > 0) {
        const firstBaby = babiesList[0];
        setEditingBabyId(firstBaby.id);
        setName(firstBaby.name);
        setBirthDate(firstBaby.birthDate);
        setGender(firstBaby.gender);
        if (babiesList.length > 0) {
          await saveReminders(firstBaby.id);
        }
      }
    } catch (err) {
      console.error('Failed to create baby:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBabyId || !name.trim() || !birthDate) return;
    setLoading(true);
    try {
      await babyApi.update(editingBabyId, { name: name.trim(), birthDate, gender });
      const res = await babyApi.getAll();
      const babiesList = res.data.babies || [];
      setBabies(babiesList);
      if (babiesList.length > 0) {
        const updated = babiesList.find((b: any) => b.id === editingBabyId);
        if (updated) {
          setName(updated.name);
          setBirthDate(updated.birthDate);
          setGender(updated.gender);
        }
      }
      await saveReminders(editingBabyId);
    } catch (err) {
      console.error('Failed to update baby:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Back button */}
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-[#7FC4C4] font-medium text-base min-h-[44px] px-2"
          >
            <span className="text-xl">←</span> 返回
          </button>
        </div>

        <h1 className="text-2xl font-bold text-[#3A3A3A] mb-6">设置</h1>

        {/* Notification Permission */}
        {notificationPermission !== 'granted' && (
          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
            <p className="text-sm text-yellow-800 mb-3">
              开启通知权限后，才能收到吸奶和换尿布提醒
            </p>
            <button
              onClick={handleRequestNotification}
              className="w-full py-2 bg-yellow-400 text-yellow-900 rounded-xl font-medium min-h-[44px]"
            >
              开启通知权限
            </button>
          </div>
        )}

        {/* Baby Info + Reminder Settings unified form */}
        {babies.length > 0 ? (
          <form onSubmit={handleUpdate} className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            {/* Baby Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#3A3A3A]">宝宝信息</h2>
              <div>
                <label className="block text-sm text-gray-600 mb-1">姓名</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 min-h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">出生日期</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 min-h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">性别</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex-1 p-3 rounded-xl min-h-[44px] flex items-center justify-center font-medium ${
                      gender === 'male' ? 'bg-[#A8D8D8] text-white' : 'bg-gray-50 border border-gray-200 text-gray-600'
                    }`}
                  >
                    男
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex-1 p-3 rounded-xl min-h-[44px] flex items-center justify-center font-medium ${
                      gender === 'female' ? 'bg-[#F9D5D5] text-[#3A3A3A]' : 'bg-gray-50 border border-gray-200 text-gray-600'
                    }`}
                  >
                    女
                  </button>
                </div>
              </div>
            </div>

            {/* Reminder Settings */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h2 className="text-lg font-semibold text-[#3A3A3A]">提醒设置</h2>

              {/* Pump Reminder */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#3A3A3A]">🧴 吸奶提醒</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pumpEnabled}
                      onChange={(e) => setPumpEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A8D8D8]"></div>
                  </label>
                </div>
                {pumpEnabled && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      提醒间隔（分钟）
                    </label>
                    <input
                      type="number"
                      value={pumpInterval}
                      onChange={(e) => setPumpInterval(Number(e.target.value))}
                      min={30}
                      max={480}
                      className="w-full p-2 bg-white rounded-xl border border-gray-200 min-h-[44px]"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      建议：3小时（180分钟）
                    </p>
                  </div>
                )}
              </div>

              {/* Diaper Reminder */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#3A3A3A]">🩲 换尿布提醒</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={diaperEnabled}
                      onChange={(e) => setDiaperEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A8D8D8]"></div>
                  </label>
                </div>
                {diaperEnabled && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      提醒间隔（分钟）
                    </label>
                    <input
                      type="number"
                      value={diaperInterval}
                      onChange={(e) => setDiaperInterval(Number(e.target.value))}
                      min={30}
                      max={480}
                      className="w-full p-2 bg-white rounded-xl border border-gray-200 min-h-[44px]"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      建议：2小时（120分钟）
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400">
                注意：华为浏览器等设备可能无法准时收到提醒，请将App加入电池白名单
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-[#3A3A3A]">添加宝宝</h2>
            <div>
              <label className="block text-sm text-gray-600 mb-1">姓名</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 min-h-[44px]"
                placeholder="宝宝姓名"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">出生日期</label>
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 min-h-[44px]"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">性别</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex-1 p-3 rounded-xl min-h-[44px] flex items-center justify-center font-medium ${
                    gender === 'male' ? 'bg-[#A8D8D8] text-white' : 'bg-gray-50 border border-gray-200 text-gray-600'
                  }`}
                >
                  男
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`flex-1 p-3 rounded-xl min-h-[44px] flex items-center justify-center font-medium ${
                    gender === 'female' ? 'bg-[#F9D5D5] text-[#3A3A3A]' : 'bg-gray-50 border border-gray-200 text-gray-600'
                  }`}
                >
                  女
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </form>
        )}

        <button
          onClick={handleLogout}
          className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-medium min-h-[44px]"
        >
          退出登录
        </button>
      </div>
    </Layout>
  );
}
