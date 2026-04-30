import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBack } from '../icons';

interface PageHeaderProps {
  title: string;
  backTo?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
}

export default function PageHeader({ title, backTo = '/', onBack, rightAction }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(backTo);
    }
  };

  return (
    <div className="flex items-center justify-between mb-6 pt-1">
      <button
        onClick={handleBack}
        className="flex items-center gap-1 text-stone-400 hover:text-stone-600 transition-colors min-h-[44px] min-w-[44px] -ml-2"
        aria-label="返回"
      >
        <IconBack size={20} />
      </button>
      <h1 className="text-lg font-serif font-semibold text-stone-900 absolute left-1/2 -translate-x-1/2">
        {title}
      </h1>
      <div className="min-w-[44px] flex justify-end">
        {rightAction}
      </div>
    </div>
  );
}
