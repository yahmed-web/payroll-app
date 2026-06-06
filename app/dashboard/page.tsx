"use client";

import AppLayout from "@/components/layout/AppLayout";
import KPICard from "@/components/ui/KPICard";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Users, DollarSign, BarChart3, Award, AlertTriangle,
  Clock, TrendingUp, Crown, Medal, Star,
} from "lucide-react";
import { useState } from "react";

// ── Mock Data ──────────────────────────────────────────────
const kpiTrendData = {
  daily: [
    { name: "Mon", Alpha: 82, Beta: 74, Gamma: 91 },
    { name: "Tue", Alpha: 85, Beta: 78, Gamma: 88 },
    { name: "Wed", Alpha: 79, Beta: 80, Gamma: 93 },
    { name: "Thu", Alpha: 88, Beta: 72, Gamma: 87 },
    { name: "Fri", Alpha: 91, Beta: 83, Gamma: 95 },
    { name: "Sat", Alpha: 86, Beta: 76, Gamma: 89 },
    { name: "Sun", Alpha: 84, Beta: 81, Gamma: 92 },
  ],
  weekly: [
    { name: "Wk1", Alpha: 80, Beta: 72, Gamma: 88 },
    { name: "Wk2", Alpha: 84, Beta: 75, Gamma: 91 },
    { name: "Wk3", Alpha: 87, Beta: 79, Gamma: 89 },
    { name: "Wk4", Alpha: 91, Beta: 82, Gamma: 94 },
  ],
  monthly: [
    { name: "Jan", Alpha: 78, Beta: 70, Gamma: 85 },
    { name: "Feb", Alpha: 81, Beta: 73, Gamma: 87 },
    { name: "Mar", Alpha: 84, Beta: 76, Gamma: 90 },
    { name: "Apr", Alpha: 87, Beta: 78, Gamma: 88 },
    { name: "May", Alpha: 91, Beta: 82, Gamma: 94 },
    { name: "Jun", Alpha: 89, Beta: 80, Gamma: 92 },
  ],
  quarterly: [
    { name: "Q1", Alpha: 80, Beta: 73, Gamma: 87 },
    { name: "Q2", Alpha: 85, Beta: 77, Gamma: 90 },
    { name: "Q3", Alpha: 89, Beta: 80, Gamma: 93 },
    { name: "Q4", Alpha: 92, Beta: 84, Gamma: 95 },
  ],
};

const kpiWeightData = [
  { name: "Calls", value: 30, color: "#2563EB" },
  { name: "Sales", value: 40, color: "#06B6D4" },
  { name: "Quality", value: 20, color: "#22C55E" },
  { name: "Attendance", value: 10, color: "#F97316" },
];

const payrollBreakdownData = [
  { name: "Jan", base: 142000, kpi: 28000, commission: 15000, deductions: -8000 },
  { name: "Feb", base: 142000, kpi: 31000, commission: 18000, deductions: -6000 },
  { name: "Mar", base: 145000, kpi: 33000, commission: 21000, deductions: -7500 },
  { name: "Apr", base: 145000, kpi: 29000, commission: 16000, deductions: -9000 },
  { name: "May", base: 148000, kpi: 36000, commission: 24000, deductions: -5500 },
];

const leaderboard = [
  { rank: 1, name: "Sarah Al-Rashidi", project: "Alpha Telecom", score: 98.4, salary: "$4,820", icon: <Crown size={14} className="text-yellow-400" /> },
  { rank: 2, name: "Omar Khalid", project: "Beta Networks", score: 96.1, salary: "$4,650", icon: <Medal size={14} className="text-slate-300" /> },
  { rank: 3, name: "Layla Hassan", project: "Alpha Telecom", score: 94.7, salary: "$4,510", icon: <Medal size={14} className="text-amber-600" /> },
  { rank: 4, name: "Ahmed Mansour", project: "Gamma ISP", score: 93.2, salary: "$4,380", icon: <Star size={14} className="text-wn-blue" /> },
  { rank: 5, name: "Fatima Al-Zahra", project: "Beta Networks", score: 91.8, salary: "$4,290", icon: <Star size={14} className="text-wn-blue" /> },
];

const commissionLeaders = [
  { name: "Omar Khalid", commission: "$3,240", deals: 48, trend: "+12%" },
  { name: "Sarah Al-Rashidi", commission: "$2,980", deals: 44, trend: "+8%" },
  { name: "Ahmed Mansour", commission: "$2,760", deals: 41, trend: "+15%" },
  { name: "Nour Ibrahim", commission: "$2,510", deals: 37, trend: "+5%" },
];

type TimeFilter = "daily" | "weekly" | "monthly" | "quarterly";

const TOOLTIP_STYLE = {
  backgroundColor: "#1E293B",
  border: "1px solid #334155",
  borderRadius: "10px",
  color: "#F8FAFC",
  fontSize: "12px",
};

// ── Mini bar for KPI weight legend ────────────────────────
function WeightBar({ color, pct }: { color: string; pct: number }) {
  return (
    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Dashboard Page ─────────────────────────────────────────
export default function DashboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("monthly");

  return (
    <AppLayout title="Dashboard">
      {/* ── KPI Overview Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <KPICard
          title="Total Workforce"
          value="1,284"
          subValue="142 inactive · 12 depts"
          change={4.2}
          icon={<Users size={20} />}
          accentColor="#2563EB"
        />
        <KPICard
          title="Payroll Summary"
          value="$248K"
          subValue="Monthly total payout"
          change={6.8}
          icon={<DollarSign size={20} />}
          accentColor="#22C55E"
        />
        <KPICard
          title="KPI Performance"
          value="87.3%"
          subValue="Avg across all projects"
          change={2.1}
          icon={<BarChart3 size={20} />}
          accentColor="#06B6D4"
        />
        <KPICard
          title="Commissions"
          value="$42.6K"
          subValue="Total bonuses paid"
          change={11.4}
          icon={<Award size={20} />}
          accentColor="#F97316"
        />
        <KPICard
          title="Warnings & Penalties"
          value="23"
          subValue="Active warnings · $3.2K deducted"
          change={-8.5}
          icon={<AlertTriangle size={20} />}
          accentColor="#DC2626"
        />
        <KPICard
          title="Attendance"
          value="94.6%"
          subValue="18 absences · 41 late"
          change={1.3}
          icon={<Clock size={20} />}
          accentColor="#8B5CF6"
        />
      </div>

      {/* ── Row 2: KPI Trend + Weight ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* KPI Trend Line Chart */}
        <div className="kpi-card xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-title">KPI Performance Trend</p>
              <p className="section-subtitle">Comparing KPI achievement across telecom projects</p>
            </div>
            <div className="flex gap-1">
              {(["daily", "weekly", "monthly", "quarterly"] as TimeFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-3 py-1.5 rounded-btn text-xs font-semibold transition-all capitalize ${timeFilter === f
                    ? "text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  style={timeFilter === f ? { background: "#2563EB" } : {}}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={kpiTrendData[timeFilter]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#94A3B8" }} />
              <Line type="monotone" dataKey="Alpha" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: "#2563EB" }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Beta" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 4, fill: "#06B6D4" }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Gamma" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4, fill: "#22C55E" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* KPI Weight Donut */}
        <div className="kpi-card">
          <p className="section-title">KPI Weight Distribution</p>
          <p className="section-subtitle">Current project formula weights</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={kpiWeightData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {kpiWeightData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2.5 mt-2">
            {kpiWeightData.map((d) => (
              <div key={d.name}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-[var(--text-secondary)]">{d.name}</span>
                  </div>
                  <span className="font-semibold text-[var(--text-primary)]">{d.value}%</span>
                </div>
                <WeightBar color={d.color} pct={d.value} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Payroll Chart + Leaderboard ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Payroll Breakdown */}
        <div className="kpi-card xl:col-span-2">
          <p className="section-title">Payroll Breakdown</p>
          <p className="section-subtitle">Base salary · KPI earnings · Commission · Deductions</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={payrollBreakdownData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#94A3B8" }} />
              <Bar dataKey="base" fill="#2563EB" name="Base Salary" radius={[4, 4, 0, 0]} />
              <Bar dataKey="kpi" fill="#06B6D4" name="KPI Earnings" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commission" fill="#22C55E" name="Commission" radius={[4, 4, 0, 0]} />
              <Bar dataKey="deductions" fill="#DC2626" name="Deductions" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team Performance Leaderboard */}
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-4">
            <p className="section-title">Top Performers</p>
            <TrendingUp size={16} style={{ color: "#2563EB" }} />
          </div>
          <div className="space-y-3">
            {leaderboard.map((agent) => (
              <div key={agent.rank} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: agent.rank <= 3 ? "rgba(37,99,235,0.15)" : "rgba(100,116,139,0.1)", color: "#2563EB" }}>
                  {agent.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{agent.name}</p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{agent.project}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: "#22C55E" }}>{agent.score}%</p>
                  <p className="text-xs text-[var(--text-secondary)]">{agent.salary}</p>
                </div>
                {agent.icon}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 4: Commission Leaderboard ── */}
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="section-title">Commission Leaderboard</p>
            <p className="section-subtitle">Top earners by commission payout this month</p>
          </div>
          <button className="btn-secondary text-xs py-2">View All</button>
        </div>
        <table className="wn-table">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Commission Earned</th>
              <th>Deals Closed</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {commissionLeaders.map((c) => (
              <tr key={c.name}>
                <td className="font-semibold">{c.name}</td>
                <td className="font-bold" style={{ color: "#22C55E" }}>{c.commission}</td>
                <td>{c.deals} deals</td>
                <td><span className="stat-up">{c.trend}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
