interface Tab {
  key: string;
  label: string;
}

interface TabBarProps<T extends string> {
  tabs: Tab[];
  activeTab: T;
  onChange: (tab: T) => void;
}

export default function TabBar<T extends string>({ tabs, activeTab, onChange }: TabBarProps<T>) {
  return (
    <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key as T)}
          className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all min-h-[36px] ${
            activeTab === tab.key
              ? 'bg-warm-50 text-stone-900 shadow-soft'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
