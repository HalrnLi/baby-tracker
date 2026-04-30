import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      {icon && (
        <div className="text-stone-300 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-stone-600 font-medium mb-1">{title}</h3>
      {description && (
        <p className="text-stone-400 text-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
