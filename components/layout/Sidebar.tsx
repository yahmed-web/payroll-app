"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  DollarSign,
  Award,
  Users,
  Clock,
  FileSpreadsheet,
  FileText,
  LineChart,
  Workflow,
  Bell,
  ScrollText,
  Settings,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",     href: "/dashboard",    icon: LayoutDashboard },
  { label: "Projects",      href: "/projects",     icon: FolderKanban },
  { label: "KPI Management",href: "/kpi",          icon: BarChart3 },
  { label: "Payroll",       href: "/payroll",      icon: DollarSign },
  { label: "Commissions",   href: "/commissions",  icon: Award },
  { label: "Employees",     href: "/employees",    icon: Users },
  { label: "Attendance",    href: "/attendance",   icon: Clock },
  { label: "Excel Imports", href: "/excel-import",  icon: FileSpreadsheet },
  { label: "Reports",       href: "/reports",       icon: FileText },
  { label: "Analytics",     href: "/analytics",     icon: LineChart },
  { label: "Workflows",     href: "/workflows",     icon: Workflow },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Audit Logs",    href: "/audit-logs",    icon: ScrollText },
  { label: "Settings",      href: "/settings",      icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ background: "#0F172A", borderRight: "1px solid #1E293B" }}
      className="fixed top-0 left-0 h-screen w-64 flex flex-col z-40"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}
        >
          TS
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">Top Sales</div>
          <div style={{ color: "#06B6D4" }} className="font-bold text-sm leading-tight">
            Webnova
          </div>
        </div>
        <Zap size={14} className="ml-auto text-yellow-400 opacity-70" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: "#2563EB" }}
          >
            AD
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">Admin User</p>
            <p style={{ color: "#64748B" }} className="text-xs truncate">admin@webnova.com</p>
          </div>
          <span className="badge badge-blue text-xs ml-auto flex-shrink-0">Admin</span>
        </div>
      </div>
    </aside>
  );
}
