"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Search, Bell, Sun, Moon, ChevronDown, AlertTriangle, CheckCircle, Info } from "lucide-react";

const notifications = [
  { id: 1, type: "warning", msg: "3 agents below KPI threshold on Project Alpha", time: "5m ago" },
  { id: 2, type: "success", msg: "Payroll approved for March — 142 employees", time: "1h ago" },
  { id: 3, type: "info",    msg: "Excel import completed: 280 KPI records processed", time: "2h ago" },
  { id: 4, type: "warning", msg: "Attendance alert: 8 late arrivals on Telecom B", time: "3h ago" },
];

interface HeaderProps {
  darkMode: boolean;
  toggleDark: () => void;
  title?: string;
}

export default function Header({ darkMode, toggleDark, title }: HeaderProps) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header
      style={{ borderBottom: "1px solid var(--border)", background: "var(--card-bg)" }}
      className="h-16 flex items-center px-6 gap-4 sticky top-0 z-30"
    >
      {/* Page title */}
      {title && (
        <h1 className="font-bold text-lg text-[var(--text-primary)] mr-4 hidden md:block">{title}</h1>
      )}

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          className="wn-input pl-9 py-2 text-sm"
          placeholder="Search employees, projects, KPIs..."
          style={{ height: "38px" }}
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Workflow status */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Workflows Active
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Toggle dark/light mode"
        >
          {darkMode ? (
            <Sun size={17} className="text-yellow-400" />
          ) : (
            <Moon size={17} className="text-slate-500" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 relative"
          >
            <Bell size={17} className="text-[var(--text-secondary)]" />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: "#DC2626" }}
            />
          </button>

          {showNotif && (
            <div
              className="absolute right-0 top-12 w-80 rounded-card shadow-xl border z-50"
              style={{ background: "var(--card-bg)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <span className="font-semibold text-sm">Notifications</span>
                <span className="badge badge-red">4 new</span>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    {n.type === "warning" && <AlertTriangle size={15} className="text-orange-500 mt-0.5 flex-shrink-0" />}
                    {n.type === "success" && <CheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" />}
                    {n.type === "info"    && <Info size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed">{n.msg}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 text-center">
                <button className="text-xs font-semibold" style={{ color: "#2563EB" }}>View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: "#2563EB" }}
            >
              AD
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">Admin User</p>
              <p className="text-xs text-[var(--text-secondary)] leading-tight">Administrator</p>
            </div>
            <ChevronDown size={13} className="text-[var(--text-secondary)]" />
          </button>

          {showProfile && (
            <div
              className="absolute right-0 top-12 w-48 rounded-card shadow-xl border z-50 py-1"
              style={{ background: "var(--card-bg)", borderColor: "var(--border)" }}
            >
              {["Profile", "Account Settings", "Sign Out"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    if (item === "Sign Out") {
                      signOut({ callbackUrl: "/login" });
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-[var(--text-primary)]"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
