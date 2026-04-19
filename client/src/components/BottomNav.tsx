import { NavLink } from 'react-router-dom';

const tabs = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/feed', label: '喂奶', icon: '🍼' },
  { path: '/pump', label: '吸奶', icon: '🧴' },
  { path: '/diaper', label: '尿布', icon: '🩲' },
  { path: '/weight', label: '体重', icon: '📊' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 safe-area-pb">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors ${
              isActive ? 'text-[#A8D8D8]' : 'text-gray-400'
            }`
          }
        >
          <span className="text-2xl" role="img" aria-label={tab.label}>{tab.icon}</span>
          <span className="text-xs mt-0.5 font-medium">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
