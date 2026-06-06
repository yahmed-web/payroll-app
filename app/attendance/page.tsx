"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Clock, AlertTriangle, CheckCircle, Calendar, TrendingDown } from "lucide-react";

const attendanceData = [
  { id: "EMP001", name: "Sarah Al-Rashidi", project: "Alpha Telecom", present: 22, absent: 0, late: 1, overtime: 3, score: 99, penalty: 0 },
  { id: "EMP002", name: "Omar Khalid", project: "Beta Networks", present: 21, absent: 1, late: 2, overtime: 2, score: 97, penalty: 50 },
  { id: "EMP003", name: "Layla Hassan", project: "Alpha Telecom", present: 21, absent: 1, late: 3, overtime: 0, score: 95, penalty: 75 },
  { id: "EMP004", name: "Ahmed Mansour", project: "Gamma ISP", present: 22, absent: 0, late: 0, overtime: 5, score: 100, penalty: 0 },
  { id: "EMP005", name: "Khalid Ibrahim", project: "Alpha Telecom", present: 18, absent: 4, late: 5, overtime: 0, score: 82, penalty: 280 },
  { id: "EMP006", name: "Nour Hassan", project: "Gamma ISP", present: 17, absent: 5, late: 6, overtime: 0, score: 78, penalty: 350 },
  { id: "EMP007", name: "Reem Al-Saeed", project: "Delta Voice", present: 15, absent: 7, late: 8, overtime: 0, score: 70, penalty: 480 },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const generateWeek = () => weekDays.map(d => ({
  day: d,
  status: ["present", "present", "present", "late", "present", "present", "absent"][Math.floor(Math.random() * 7)] as string,
}));

const statusColor: Record<string, string> = {
  present: "#22C55E", late: "#F97316", absent: "#DC2626", leave: "#6366F1",
};

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<"daily" | "rules">("daily");

  const totalPresent = attendanceData.reduce((s, e) => s + e.present, 0);
  const totalAbsent = attendanceData.reduce((s, e) => s + e.absent, 0);
  const totalLate = attendanceData.reduce((s, e) => s + e.late, 0);
  const totalPenalty = attendanceData.reduce((s, e) => s + e.penalty, 0);

  return (
    <AppLayout title="Attendance">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="section-title">Attendance Management</h2>
          <p className="section-subtitle">Track daily attendance, absences, overtime and apply penalty rules</p>
        </div>
        <div className="flex gap-2">
          {["daily", "rules"].map(t => (
            <button key={t} onClick={() => setActiveTab(t as "daily" | "rules")}
              className={`px-4 py-2 rounded-btn text-sm font-semibold capitalize transition-all ${activeTab === t ? "text-white" : "text-[var(--text-secondary)]"}`}
              style={activeTab === t ? { background: "#2563EB" } : {}}>
              {t === "daily" ? "Daily View" : "Penalty Rules"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Present", val: totalPresent, icon: <CheckCircle size={18} />, color: "#22C55E" },
          { label: "Total Absent", val: totalAbsent, icon: <AlertTriangle size={18} />, color: "#DC2626" },
          { label: "Late Arrivals", val: totalLate, icon: <Clock size={18} />, color: "#F97316" },
          { label: "Total Penalties", val: `$${totalPenalty}`, icon: <TrendingDown size={18} />, color: "#DC2626" },
        ].map(c => (
          <div key={c.label} className="kpi-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${c.color}18`, color: c.color }}>{c.icon}</div>
            <div>
              <p className="font-bold text-xl text-[var(--text-primary)]">{c.val}</p>
              <p className="text-xs text-[var(--text-secondary)]">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {activeTab === "daily" && (
        <div className="kpi-card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <p className="font-bold text-[var(--text-primary)]">Weekly Attendance Grid</p>
            <div className="flex gap-4 text-xs">
              {Object.entries(statusColor).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: v }} />
                  <span className="text-[var(--text-secondary)] capitalize">{k}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="wn-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Project</th>
                  {weekDays.map(d => <th key={d}>{d}</th>)}
                  <th>Score</th><th>Penalty</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map(emp => {
                  const week = generateWeek();
                  return (
                    <tr key={emp.id}>
                      <td className="font-semibold text-sm">{emp.name}</td>
                      <td className="text-sm text-[var(--text-secondary)]">{emp.project}</td>
                      {week.map((d, i) => (
                        <td key={i}>
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mx-auto"
                            style={{ background: statusColor[d.status] || "#64748B" }}>
                            {d.status[0].toUpperCase()}
                          </span>
                        </td>
                      ))}
                      <td>
                        <span className={`text-sm font-bold ${emp.score >= 90 ? "text-green-400" : emp.score >= 80 ? "text-orange-400" : "text-red-400"}`}>
                          {emp.score}%
                        </span>
                      </td>
                      <td className="text-sm" style={{ color: emp.penalty > 0 ? "#DC2626" : "#22C55E" }}>
                        {emp.penalty > 0 ? `-$${emp.penalty}` : "None"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "rules" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: "Absence Penalty", desc: "Penalty applied per unexcused absence day", value: "$50 per day", color: "#DC2626" },
            { title: "Late Arrival Penalty", desc: "Penalty for arrivals more than 15 minutes late", value: "$20 per occurrence", color: "#F97316" },
            { title: "Overtime Bonus", desc: "Bonus rate for approved overtime hours", value: "+$15 per hour", color: "#22C55E" },
            { title: "Attendance Bonus", desc: "Bonus for 100% monthly attendance achievement", value: "+$200 per month", color: "#2563EB" },
            { title: "Warning Threshold", desc: "Attendance score below this triggers warning", value: "Below 80%", color: "#F97316" },
            { title: "Termination Threshold", desc: "Consecutive absences before HR review", value: "5 consecutive days", color: "#DC2626" },
          ].map(rule => (
            <div key={rule.title} className="kpi-card flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: `${rule.color}15`, border: `1px solid ${rule.color}30` }} />
              <div className="flex-1">
                <p className="font-bold text-sm text-[var(--text-primary)] mb-1">{rule.title}</p>
                <p className="text-xs text-[var(--text-secondary)] mb-2">{rule.desc}</p>
                <span className="badge badge-blue text-xs">{rule.value}</span>
              </div>
              <button className="text-xs font-semibold" style={{ color: "#2563EB" }}>Edit</button>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
