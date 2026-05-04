import { ReactNode } from 'react';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-warm-100">
      <div className="pt-[env(safe-area-inset-top)]" />
      {children}
      <BottomNav />
    </div>
  );
}
