import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#FFF9F5]">
      {/* iOS status bar safe area */}
      <div className="pt-[env(safe-area-inset-top)]" />
      {children}
      {/* iOS home indicator safe area */}
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
