import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

interface BaseInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

interface InputProps extends BaseInputProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  as?: 'input';
}

interface SelectProps extends BaseInputProps, SelectHTMLAttributes<HTMLSelectElement> {
  as: 'select';
  children: ReactNode;
}

interface TextareaProps extends BaseInputProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  as: 'textarea';
}

type FormInputProps = InputProps | SelectProps | TextareaProps;

const inputClasses = 'w-full p-3 bg-warm-50 rounded-xl border border-stone-200 min-h-[44px] text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-colors';

export default function FormInput(props: FormInputProps) {
  const { label, error, hint } = props;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-stone-600 mb-1.5">{label}</label>
      )}
      {'as' in props && props.as === 'select' ? (
        <select {...(props as SelectProps)} className={inputClasses}>
          {(props as SelectProps).children}
        </select>
      ) : 'as' in props && props.as === 'textarea' ? (
        <textarea {...(props as TextareaProps)} className={`${inputClasses} resize-none`} />
      ) : (
        <input {...(props as InputProps)} className={inputClasses} />
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {hint && <p className="text-stone-400 text-xs mt-1">{hint}</p>}
    </div>
  );
}
