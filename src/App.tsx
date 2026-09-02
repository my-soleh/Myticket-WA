import React, { useState } from "react";
import { StoreProvider, useStore } from "./lib/store";
import { Sidebar, Topbar } from "./components/layout";
import { ToastHost, cn } from "./components/ui";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import Categories from "./pages/Categories";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ActivityLog from "./pages/ActivityLog";
import type { Page } from "./lib/types";

const Shell: React.FC = () => {
  const { currentUser, page, collapsed } = useStore();
  const [mobileNav, setMobileNav] = useState(false);

  if (!currentUser) return <Login />;

  const pages: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard />,
    tickets: <Tickets />,
    categories: <Categories />,
    users: <Users />,
    reports: <Reports />,
    settings: <Settings />,
    logs: <ActivityLog />,
  };

  return (
    <div className="min-h-screen bg-app">
      <Sidebar mobileOpen={mobileNav} onCloseMobile={() => setMobileNav(false)} />
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          collapsed ? "md:pl-[68px]" : "md:pl-[248px]"
        )}
      >
        <Topbar onOpenMobile={() => setMobileNav(true)} />
        <main className="flex-1" key={page}>
          {pages[page]}
        </main>
        <footer className="px-6 py-4 text-[11px] text-faint flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line2">
          <span className="font-mono font-semibold text-mute">{`{WA}`}</span>
          <span>Auto-Response & Forwarder · Node.js + MySQL + Nginx (Debian 13)</span>
          <span className="ml-auto font-mono">v1.4.2 · health check OK</span>
        </footer>
      </div>
    </div>
  );
};

const AppInner: React.FC = () => (
  <>
    <Shell />
    <ToastHost />
  </>
);

const App: React.FC = () => (
  <StoreProvider>
    <AppInner />
  </StoreProvider>
);

export default App;
