"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Bell, AlertTriangle, CheckCircle, Info, X, Settings, Filter } from "lucide-react";

const notifs = [
  { id: 1, type: "warning", title: "3 Agents Below KPI Threshold", body: "Sara Johnson, Ahmed Malik, and Nina Patel are below 75% KPI this week.", time: "10 min ago", read: false, project: "Telecom Alpha" },
  { id: 2, type: "success", title: "Payroll Approved", body: "June 2025 payroll for 124 employees has been approved and queued for payout.", time: "2 hrs ago", read: false, project: "All Projects" },
  { id: 3, type: "info", title: "Excel Import Completed", body: "payroll_june_2025.xlsx was imported successfully. 124 rows processed.", time: "5 hrs ago", read: true, project: "System" },
  { id: 4, type: "warning", title: "Workflow Failed", body: "Excel Import Processor workflow failed for file: kpi_q1_data.xlsx. Check column mapping.", time: "1 day ago", read: true, project: "System" },
  { id: 5, type: "success", title: "Commission Payouts Sent", body: "$61,000 in commissions disbursed to 66 agents for June 2025.", time: "1 day ago", read: true, project: "All Projects" },
  { id: 6, type: "info", title: "New Project Created", body: "Project 'Fiber Deploy — Q3' has been set up by Admin. KPI rules pending configuration.", time: "2 days ago", read: true, project: "Fiber Deploy" },
  { id: 7, type: "warning", title: "Attendance Anomaly Detected", body: "12 absences without approval recorded in Week 23. Review required.", time: "3 days ago", read: true, project: "ISP Beta" },
  { id: 8, type: "success", title: "KPI Formula Updated", body: "Formula 'AHT Weight' updated by Finance team for ISP Beta project.", time: "4 days ago", read: true, project: "ISP Beta" },
];

const typeConfig = {
  warning: { icon: AlertTriangle, color: "#F59E0B", bg: "bg-amber-500/10 border-amber-500/20" },
  success: { icon: CheckCircle, color: "#10B981", bg: "bg-emerald-500/10 border-emerald-500/20" },
  info: { icon: Info, color: "#2563EB", bg: "bg-blue-500/10 border-blue-500/20" },
};

export default function NotificationsPage() {
  const [items, setItems] = useState(notifs);
  const [filter, setFilter] = useState<"all" | "unread" | "warning" | "success" | "info">("all");

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const dismiss = (id: number) => setItems((prev) => prev.filter((n) => n.id !== id));

  const filtered = items.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <AppLayout title="Notifications">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-wn-text-primary">All Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-wn-blue text-white text-xs font-bold">{unreadCount} new</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="wn-btn-ghost text-sm flex items-center gap-1">
            <CheckCircle size={13} /> Mark all read
          </button>
          <button className="wn-btn-ghost text-sm flex items-center gap-1">
            <Settings size={13} /> Preferences
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter size={13} className="text-wn-text-muted" />
        {(["all", "unread", "warning", "success", "info"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
              filter === f ? "bg-wn-blue text-white" : "bg-wn-surface text-wn-text-muted border border-wn-border hover:border-wn-blue/40"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3 max-w-3xl">
        {filtered.length === 0 && (
          <div className="wn-card p-12 text-center">
            <Bell size={32} className="text-wn-text-muted mx-auto mb-3" />
            <p className="text-wn-text-muted">No notifications to show.</p>
          </div>
        )}
        {filtered.map((n) => {
          const cfg = typeConfig[n.type as keyof typeof typeConfig];
          const Icon = cfg.icon;
          return (
            <div
              key={n.id}
              className={`relative flex gap-4 p-4 rounded-xl border transition-all ${
                !n.read ? "bg-wn-surface border-wn-blue/30" : `border ${cfg.bg}`
              }`}
            >
              {!n.read && (
                <div className="absolute top-4 right-10 w-2 h-2 rounded-full bg-wn-blue" />
              )}
              <div className="p-2 rounded-lg h-fit" style={{ backgroundColor: cfg.color + "20" }}>
                <Icon size={16} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-sm font-semibold ${!n.read ? "text-wn-text-primary" : "text-wn-text-secondary"}`}>
                    {n.title}
                  </span>
                  <span className="text-xs text-wn-text-muted whitespace-nowrap">{n.time}</span>
                </div>
                <p className="text-xs text-wn-text-muted mt-1">{n.body}</p>
                <span className="text-xs text-wn-text-muted mt-2 inline-block">📁 {n.project}</span>
              </div>
              <button
                onClick={() => dismiss(n.id)}
                className="absolute top-3 right-3 p-1 rounded hover:bg-wn-surface text-wn-text-muted hover:text-red-400 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
