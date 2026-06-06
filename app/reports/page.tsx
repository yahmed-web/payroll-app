"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Download, FileText, Filter, BarChart3, DollarSign, Award } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area,
} from "recharts";

const payrollReport = [
  { month: "Jan", gross: 285000, net: 248000, deductions: 37000 },
  { month: "Feb", gross: 291000, net: 254000, deductions: 37000 },
  { month: "Mar", gross: 310000, net: 271000, deductions: 39000 },
  { month: "Apr", gross: 298000, net: 261000, deductions: 37000 },
  { month: "May", gross: 325000, net: 285000, deductions: 40000 },
  { month: "Jun", gross: 318000, net: 279000, deductions: 39000 },
];

const kpiReport = [
  { month: "Jan", alpha: 82, beta: 78, fiber: 74 },
  { month: "Feb", alpha: 85, beta: 80, fiber: 76 },
  { month: "Mar", alpha: 88, beta: 84, fiber: 79 },
  { month: "Apr", alpha: 84, beta: 81, fiber: 77 },
  { month: "May", alpha: 91, beta: 87, fiber: 83 },
  { month: "Jun", alpha: 89, beta: 85, fiber: 81 },
];

const commissionReport = [
  { dept: "Sales", paid: 52000, agents: 18 },
  { dept: "Support", paid: 31000, agents: 24 },
  { dept: "Tech", paid: 19000, agents: 14 },
  { dept: "Ops", paid: 14000, agents: 10 },
];

const reportTypes = [
  { id: "payroll", label: "Payroll Report", icon: DollarSign, color: "#2563EB" },
  { id: "kpi", label: "KPI Report", icon: BarChart3, color: "#10B981" },
  { id: "commission", label: "Commission Report", icon: Award, color: "#F59E0B" },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState("payroll");
  const [period, setPeriod] = useState("H1 2025");

  return (
    <AppLayout title="Reports">
      {/* Report Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {reportTypes.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveReport(r.id)}
            className={`wn-card p-5 flex items-center gap-4 text-left transition-all border-2 ${
              activeReport === r.id ? "border-wn-blue" : "border-transparent hover:border-wn-border"
            }`}
          >
            <div className="p-3 rounded-xl" style={{ backgroundColor: r.color + "20" }}>
              <r.icon size={22} style={{ color: r.color }} />
            </div>
            <div>
              <div className="text-sm font-semibold text-wn-text-primary">{r.label}</div>
              <div className="text-xs text-wn-text-muted mt-0.5">View & export</div>
            </div>
            {activeReport === r.id && (
              <div className="ml-auto w-2 h-2 rounded-full bg-wn-blue" />
            )}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-wn-text-muted" />
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="wn-input text-sm">
            {["H1 2025", "H2 2024", "Q2 2025", "Q1 2025", "Full Year 2024"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button className="wn-btn-ghost flex items-center gap-2 text-sm">
            <FileText size={14} /> PDF
          </button>
          <button className="wn-btn-primary flex items-center gap-2 text-sm">
            <Download size={14} /> Export Excel
          </button>
        </div>
      </div>

      {/* Payroll Report */}
      {activeReport === "payroll" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Total Gross Paid", value: "$1,827,000", sub: "H1 2025", color: "#2563EB" },
              { label: "Total Net Paid", value: "$1,598,000", sub: "-$229k deductions", color: "#10B981" },
              { label: "Avg Monthly Payroll", value: "$266,300", sub: "per month", color: "#F59E0B" },
            ].map((s) => (
              <div key={s.label} className="wn-card p-5">
                <div className="text-xs text-wn-text-muted uppercase tracking-wider mb-2">{s.label}</div>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-wn-text-muted mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="wn-card p-6">
            <h2 className="text-base font-semibold text-wn-text-primary mb-4">Payroll Breakdown by Month</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={payrollReport}>
                <defs>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9" }} formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                <Legend />
                <Area type="monotone" dataKey="gross" stroke="#2563EB" fill="url(#grossGrad)" strokeWidth={2} name="Gross" />
                <Area type="monotone" dataKey="net" stroke="#10B981" fill="url(#netGrad)" strokeWidth={2} name="Net" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="wn-card p-6">
            <h2 className="text-base font-semibold text-wn-text-primary mb-4">Detailed Table</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-wn-border">
                  {["Month", "Gross Payroll", "Deductions", "Net Payroll", "Change"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs text-wn-text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payrollReport.map((row, i) => {
                  const prev = payrollReport[i - 1];
                  const change = prev ? (((row.net - prev.net) / prev.net) * 100).toFixed(1) : null;
                  return (
                    <tr key={row.month} className="border-b border-wn-border/40 hover:bg-wn-surface/50">
                      <td className="py-3 px-3 font-medium text-wn-text-primary">{row.month} 2025</td>
                      <td className="py-3 px-3 text-wn-blue">${row.gross.toLocaleString()}</td>
                      <td className="py-3 px-3 text-red-400">-${row.deductions.toLocaleString()}</td>
                      <td className="py-3 px-3 font-semibold text-emerald-400">${row.net.toLocaleString()}</td>
                      <td className="py-3 px-3 text-xs">
                        {change ? (
                          <span className={parseFloat(change) >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {parseFloat(change) >= 0 ? "↑" : "↓"} {Math.abs(parseFloat(change))}%
                          </span>
                        ) : <span className="text-wn-text-muted">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPI Report */}
      {activeReport === "kpi" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Avg KPI — Telecom Alpha", value: "86.5%", color: "#2563EB" },
              { label: "Avg KPI — ISP Beta", value: "82.5%", color: "#10B981" },
              { label: "Avg KPI — Fiber Deploy", value: "78.3%", color: "#F59E0B" },
            ].map((s) => (
              <div key={s.label} className="wn-card p-5">
                <div className="text-xs text-wn-text-muted uppercase tracking-wider mb-2">{s.label}</div>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="wn-card p-6">
            <h2 className="text-base font-semibold text-wn-text-primary mb-4">KPI Trends by Project</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={kpiReport}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} unit="%" domain={[60, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9" }} formatter={(v: number) => [`${v}%`, ""]} />
                <Legend />
                <Line dataKey="alpha" stroke="#2563EB" strokeWidth={2} name="Telecom Alpha" dot={{ fill: "#2563EB", r: 3 }} />
                <Line dataKey="beta" stroke="#10B981" strokeWidth={2} name="ISP Beta" dot={{ fill: "#10B981", r: 3 }} />
                <Line dataKey="fiber" stroke="#F59E0B" strokeWidth={2} name="Fiber Deploy" dot={{ fill: "#F59E0B", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Commission Report */}
      {activeReport === "commission" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Total Commissions Paid", value: "$116,000", color: "#F59E0B" },
              { label: "Agents Paid Out", value: "66", color: "#2563EB" },
              { label: "Avg Per Agent", value: "$1,758", color: "#10B981" },
            ].map((s) => (
              <div key={s.label} className="wn-card p-5">
                <div className="text-xs text-wn-text-muted uppercase tracking-wider mb-2">{s.label}</div>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="wn-card p-6">
            <h2 className="text-base font-semibold text-wn-text-primary mb-4">Commission by Department</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={commissionReport} layout="vertical" barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey="dept" type="category" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Paid"]} />
                <Bar dataKey="paid" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
