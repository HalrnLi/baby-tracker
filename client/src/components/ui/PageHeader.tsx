import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  rightAction?: ReactNode;
}

export default function PageHeader({ title, rightAction }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-center mb-6 pt-1">
      <h1 className="text-xl font-serif font-semibold text-stone-900">
        {title}
      </h1>
      {rightAction && (
        <div className="absolute right-4 flex justify-end">
          {rightAction}
        </div>
      )}
    </div>
  );
}
