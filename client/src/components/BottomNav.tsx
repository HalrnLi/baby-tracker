import { NavLink } from 'react-router-dom';
import { IconHome, IconFeed, IconPump, IconDiaper, IconWeight } from './icons';

const tabs = [
  { path: '/', label: '首页', icon: IconHome, color: 'rose' },
  { path: '/feed', label: '喂奶', icon: IconFeed, color: 'rose' },
  { path: '/pump', label: '吸奶', icon: IconPump, color: 'sky' },
  { path: '/diaper', label: '尿布', icon: IconDiaper, color: 'amber' },
  { path: '/weight', label: '体重', icon: IconWeight, color: 'warm' },
];

const activeBg: Record<string, string> = {
  rose: 'bg-rose-100',
  sky: 'bg-sky-100',
  amber: 'bg-amber-100',
  warm: 'bg-emerald-100',
};

const activeText: Record<string, string> = {
  rose: 'text-rose-500',
  sky: 'text-sky-500',
  amber: 'text-amber-500',
  warm: 'text-emerald-600',
};

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-warm-50/90 backdrop-blur-lg shadow-[0_-1px_12px_rgba(0,0,0,0.04)] flex justify-around items-center h-16 z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-all ${
                isActive ? activeText[tab.color] : 'text-stone-300 hover:text-stone-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? activeBg[tab.color] : ''
                }`}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
