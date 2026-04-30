interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-warm-50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-warm-50 after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-rose-400" />
      {label && (
        <span className="ml-3 text-sm font-medium text-stone-600">{label}</span>
      )}
    </label>
  );
}
