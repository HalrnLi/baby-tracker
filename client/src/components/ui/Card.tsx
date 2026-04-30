import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
}

const paddings = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export default function Card({ children, padding = 'md', hover = false, className = '' }: CardProps) {
  return (
    <div className={`bg-warm-50 rounded-2xl shadow-soft ${paddings[padding]} ${hover ? 'hover:shadow-lifted transition-shadow' : ''} ${className}`}>
      {children}
    </div>
  );
}
