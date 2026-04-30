import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { babyApi, remindersApi, Reminder } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';
import Toggle from '../components/ui/Toggle';
import { IconBell, IconLogout, IconBaby } from '../components/icons';
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
      await remindersApi.update(pumpReminder.id, { intervalMinutes: pumpInterval, enabled: pumpEnabled });
    } else {
      await remindersApi.create({ babyId, type: 'pump', intervalMinutes: pumpInterval, enabled: pumpEnabled });
    }

    if (diaperReminder) {
      await remindersApi.update(diaperReminder.id, { intervalMinutes: diaperInterval, enabled: diaperEnabled });
    } else {
      await remindersApi.create({ babyId, type: 'diaper', intervalMinutes: diaperInterval, enabled: diaperEnabled });
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
        await saveReminders(firstBaby.id);
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
      <div className="max-w-md mx-auto px-4 pt-3 pb-24 space-y-4">
        <PageHeader title="设置" />

        {/* Notification Permission */}
        {notificationPermission !== 'granted' && (
          <Card className="bg-rose-50 border border-rose-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-400 flex items-center justify-center flex-shrink-0">
                <IconBell size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-stone-700 mb-3">
                  开启通知权限后，才能收到吸奶和换尿布提醒
                </p>
                <Button variant="primary" size="sm" onClick={handleRequestNotification} className="w-auto">
                  开启通知权限
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Baby Info + Reminders */}
        {babies.length > 0 ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <IconBaby size={18} className="text-stone-400" />
                <h2 className="text-base font-semibold text-stone-800">宝宝信息</h2>
              </div>
              <div className="space-y-4">
                <FormInput
                  as="input"
                  label="姓名"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
                <FormInput
                  as="input"
                  label="出生日期"
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1.5">性别</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`flex-1 p-3 rounded-xl min-h-[44px] flex items-center justify-center font-medium border transition-all ${
                        gender === 'male'
                          ? 'bg-sky-100 border-sky-300 text-sky-600'
                          : 'bg-warm-100 border-stone-200 text-stone-500'
                      }`}
                    >
                      男
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`flex-1 p-3 rounded-xl min-h-[44px] flex items-center justify-center font-medium border transition-all ${
                        gender === 'female'
                          ? 'bg-rose-100 border-rose-300 text-rose-600'
                          : 'bg-warm-100 border-stone-200 text-stone-500'
                      }`}
                    >
                      女
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <IconBell size={18} className="text-stone-400" />
                <h2 className="text-base font-semibold text-stone-800">提醒设置</h2>
              </div>
              <div className="space-y-4">
                {/* Pump Reminder */}
                <div className="p-3 bg-warm-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700">吸奶提醒</span>
                    <Toggle checked={pumpEnabled} onChange={setPumpEnabled} />
                  </div>
                  {pumpEnabled && (
                    <div>
                      <FormInput
                        as="input"
                        label="提醒间隔（分钟）"
                        type="number"
                        value={pumpInterval}
                        onChange={(e) => setPumpInterval(Number(e.target.value))}
                        min={30}
                        max={480}
                        hint="建议：3小时（180分钟）"
                      />
                    </div>
                  )}
                </div>

                {/* Diaper Reminder */}
                <div className="p-3 bg-warm-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700">换尿布提醒</span>
                    <Toggle checked={diaperEnabled} onChange={setDiaperEnabled} />
                  </div>
                  {diaperEnabled && (
                    <div>
                      <FormInput
                        as="input"
                        label="提醒间隔（分钟）"
                        type="number"
                        value={diaperInterval}
                        onChange={(e) => setDiaperInterval(Number(e.target.value))}
                        min={30}
                        max={480}
                        hint="建议：2小时（120分钟）"
                      />
                    </div>
                  )}
                </div>

                <p className="text-xs text-stone-400">
                  注意：华为浏览器等设备可能无法准时收到提醒，请将App加入电池白名单
                </p>
              </div>
            </Card>

            <Button type="submit" loading={loading}>
              保存
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCreate}>
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <IconBaby size={18} className="text-stone-400" />
                <h2 className="text-base font-semibold text-stone-800">添加宝宝</h2>
              </div>
              <div className="space-y-4">
                <FormInput
                  as="input"
                  label="姓名"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="宝宝姓名"
                  required
                />
                <FormInput
                  as="input"
                  label="出生日期"
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1.5">性别</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`flex-1 p-3 rounded-xl min-h-[44px] flex items-center justify-center font-medium border transition-all ${
                        gender === 'male'
                          ? 'bg-sky-100 border-sky-300 text-sky-600'
                          : 'bg-warm-100 border-stone-200 text-stone-500'
                      }`}
                    >
                      男
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`flex-1 p-3 rounded-xl min-h-[44px] flex items-center justify-center font-medium border transition-all ${
                        gender === 'female'
                          ? 'bg-rose-100 border-rose-300 text-rose-600'
                          : 'bg-warm-100 border-stone-200 text-stone-500'
                      }`}
                    >
                      女
                    </button>
                  </div>
                </div>
                <Button type="submit" loading={loading}>
                  保存
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-stone-400 hover:text-stone-600 transition-colors min-h-[44px]"
        >
          <IconLogout size={18} />
          <span className="font-medium">退出登录</span>
        </button>
      </div>
    </Layout>
  );
}
