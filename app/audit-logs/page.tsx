"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Search, Filter, Download, Shield, User, Settings, Database, FileText } from "lucide-react";

const auditLogs = [
  { id: "AL001", action: "Payroll Approved", actor: "Admin", role: "Admin", entity: "Payroll/June-2025", ip: "192.168.1.10", time: "2025-06-01 10:22:05", category: "payroll" },
  { id: "AL002", action: "KPI Formula Updated", actor: "Finance Lead", role: "Finance", entity: "KPI/AHT-Weight", ip: "10.0.0.42", time: "2025-05-30 14:15:33", category: "kpi" },
  { id: "AL003", action: "Employee Record Edited", actor: "HR Manager", role: "HR", entity: "EMP/EMP004", ip: "10.0.0.21", time: "2025-05-28 09:10:17", category: "employee" },
  { id: "AL004", action: "Excel Import — payroll_june.xlsx", actor: "Admin", role: "Admin", entity: "Import/IMP001", ip: "192.168.1.10", time: "2025-06-01 09:14:02", category: "system" },
  { id: "AL005", action: "Commission Rule Created", actor: "Finance Lead", role: "Finance", entity: "Commission/CR002", ip: "10.0.0.42", time: "2025-05-25 16:08:44", category: "commission" },
  { id: "AL006", action: "Attendance Penalty Applied", actor: "System", role: "System", entity: "Attendance/Week-23", ip: "—", time: "2025-05-23 00:01:00", category: "attendance" },
  { id: "AL007", action: "User Login", actor: "Supervisor A", role: "Supervisor", entity: "Auth/Session", ip: "172.16.0.8", time: "2025-05-20 08:33:21", category: "auth" },
  { id: "AL008", action: "Project Created", actor: "Admin", role: "Admin", entity: "Project/Fiber-Q3", ip: "192.168.1.10", time: "2025-05-15 11:45:09", category: "system" },
  { id: "AL009", action: "Payroll Recalculated", actor: "Finance Lead", role: "Finance", entity: "Payroll/May-2025", ip: "10.0.0.42", time: "2025-05-14 15:22:00", category: "payroll" },
  { id: "AL010", action: "Workflow Paused", actor: "Admin", role: "Admin", entity: "Workflow/WF003", ip: "192.168.1.10", time: "2025-05-10 10:00:00", category: "system" },
];

const categoryColors: Record<string, string> = {
  payroll: "#2563EB", kpi: "#10B981", employee: "#8B5CF6",
  system: "#64748B", commission: "#F59E0B", attendance: "#F97316",
  auth: "#EC4899",
};

const categoryIcons: Record<string, React.ElementType> = {
  payroll: Database, kpi: FileText, employee: User,
  system: Settings, commission: Database, attendance: Database, auth: Shield,
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const categories = ["all", ...Array.from(new Set(auditLogs.map((l) => l.category)))];

  const filtered = auditLogs.filter((l) => {
    const matchCat = catFilter === "all" || l.category === catFilter;
    const matchSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <AppLayout title="Audit Logs">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-wn-text-muted">Immutable trail of all system actions and user events.</p>
        <button className="wn-btn-ghost flex items-center gap-2 text-sm">
          <Download size={14} /> Export Logs
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Events (30d)", value: "1,248", color: "#2563EB" },
          { label: "Unique Actors", value: "12", color: "#10B981" },
          { label: "System Events", value: "384", color: "#64748B" },
          { label: "Critical Actions", value: "23", color: "#EF4444" },
        ].map((s) => (
          <div key={s.label} className="wn-card p-4">
            <div className="text-xs text-wn-text-muted mb-1">{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-wn-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor, entity..."
            className="wn-input pl-8 text-sm w-60"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} className="text-wn-text-muted" />
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                catFilter === c ? "bg-wn-blue text-white" : "bg-wn-surface text-wn-text-muted border border-wn-border hover:border-wn-blue/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Log Table */}
      <div className="wn-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-wn-surface border-b border-wn-border">
              <tr>
                {["ID", "Action", "Actor", "Entity", "IP Address", "Timestamp"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-wn-text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const Icon = categoryIcons[log.category] ?? Database;
                const color = categoryColors[log.category] ?? "#64748B";
                return (
                  <tr key={log.id} className="border-b border-wn-border/40 hover:bg-wn-surface/60 transition-colors">
                    <td className="py-3 px-4 text-xs text-wn-text-muted font-mono">{log.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded" style={{ backgroundColor: color + "20" }}>
                          <Icon size={12} style={{ color }} />
                        </div>
                        <span className="text-wn-text-primary font-medium text-xs">{log.action}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-wn-text-primary">{log.actor}</div>
                      <div className="text-xs text-wn-text-muted">{log.role}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-wn-blue font-mono">{log.entity}</td>
                    <td className="py-3 px-4 text-xs text-wn-text-muted font-mono">{log.ip}</td>
                    <td className="py-3 px-4 text-xs text-wn-text-muted">{log.time}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-wn-text-muted text-sm">No matching audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
