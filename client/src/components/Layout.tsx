import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-warm-100">
      <div className="pt-[env(safe-area-inset-top)]" />
      {children}
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
