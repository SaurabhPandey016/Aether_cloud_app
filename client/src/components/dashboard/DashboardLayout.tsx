'use client';

import { ReactNode, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

type DashboardLayoutProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export default function DashboardLayout({ title, description, action, children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#020817] text-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((prev) => !prev)} />
      <div className="dashboard-main flex flex-1 flex-col overflow-hidden transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? 80 : 288 }}>
        <Header />
        <main className="flex-1 overflow-auto pt-20">
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between border-b border-cyan-500/15 pb-5">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-white">{title}</h2>
                {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
              </div>
              {action}
            </div>
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
