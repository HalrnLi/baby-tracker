import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const variants = {
  primary: 'bg-rose-400 text-white border-rose-500 hover:bg-rose-500 active:bg-rose-600 shadow-soft hover:shadow-lifted',
  secondary: 'bg-sky-400 text-white border-sky-500 hover:bg-sky-500 active:bg-sky-600 shadow-soft hover:shadow-lifted',
  ghost: 'bg-transparent text-stone-600 border-transparent hover:bg-stone-100 active:bg-stone-200',
  danger: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 active:bg-red-200',
};

const sizes = {
  sm: 'py-2 px-3 text-sm min-h-[36px]',
  md: 'py-3 px-4 text-base min-h-[44px]',
  lg: 'py-3.5 px-6 text-base min-h-[48px]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`w-full font-medium rounded-xl border transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {typeof children === 'string' ? children.replace(/保存|提交|确定|登录|注册/, (m) => m + '中...') : children}
        </span>
      ) : children}
    </button>
  );
}
