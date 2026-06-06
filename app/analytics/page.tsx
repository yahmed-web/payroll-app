"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { TrendingUp, Users, Clock, AlertTriangle, BarChart3, Activity } from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, LineChart, Line, Legend,
} from "recharts";

const forecastData = [
  { month: "Jul", actual: null, forecast: 318000 },
  { month: "Aug", actual: null, forecast: 332000 },
  { month: "Sep", actual: null, forecast: 345000 },
  { month: "Jun", actual: 318000, forecast: 315000 },
  { month: "May", actual: 325000, forecast: 320000 },
  { month: "Apr", actual: 298000, forecast: 302000 },
  { month: "Mar", actual: 310000, forecast: 308000 },
  { month: "Feb", actual: 291000, forecast: 290000 },
  { month: "Jan", actual: 285000, forecast: 283000 },
].reverse();

const workforceData = [
  { week: "W1", utilization: 82, capacity: 100 },
  { week: "W2", utilization: 87, capacity: 100 },
  { week: "W3", utilization: 91, capacity: 100 },
  { week: "W4", utilization: 78, capacity: 100 },
  { week: "W5", utilization: 85, capacity: 100 },
  { week: "W6", utilization: 93, capacity: 100 },
  { week: "W7", utilization: 89, capacity: 100 },
  { week: "W8", utilization: 95, capacity: 100 },
];

const performanceScatter = [
  { kpi: 98, salary: 4500, name: "Sara J." }, { kpi: 95, salary: 3800, name: "Ahmed M." },
  { kpi: 92, salary: 4200, name: "Layla C." }, { kpi: 88, salary: 5100, name: "Tom R." },
  { kpi: 85, salary: 3400, name: "Nina P." }, { kpi: 83, salary: 3200, name: "Omar D." },
  { kpi: 78, salary: 2900, name: "Fatima K." }, { kpi: 72, salary: 2700, name: "James L." },
  { kpi: 68, salary: 3600, name: "Anna W." }, { kpi: 91, salary: 4100, name: "Ryan T." },
];

const radarData = [
  { metric: "Attendance", score: 88 },
  { metric: "KPI Score", score: 84 },
  { metric: "Commissions", score: 76 },
  { metric: "Payroll Accuracy", score: 95 },
  { metric: "Efficiency", score: 79 },
  { metric: "Retention", score: 82 },
];

const CustomScatterTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { kpi: number; salary: number; name: string } }[] }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-wn-midnight border border-wn-border rounded-xl p-3 text-xs">
        <div className="font-semibold text-wn-text-primary mb-1">{d.name}</div>
        <div className="text-wn-text-muted">KPI: <span className="text-wn-blue">{d.kpi}%</span></div>
        <div className="text-wn-text-muted">Salary: <span className="text-emerald-400">${d.salary.toLocaleString()}</span></div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [view, setView] = useState<"workforce" | "forecast" | "performance">("workforce");

  return (
    <AppLayout title="Analytics">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Workforce Utilization", value: "88.5%", icon: Users, color: "#2563EB", sub: "+2.3% WoW" },
          { label: "Avg Efficiency Score", value: "84.2", icon: Activity, color: "#10B981", sub: "Above target" },
          { label: "Projected Payroll (Jul)", value: "$318k", icon: TrendingUp, color: "#F59E0B", sub: "Forecast" },
          { label: "At-Risk Agents", value: "7", icon: AlertTriangle, color: "#EF4444", sub: "KPI < 75%" },
        ].map((s) => (
          <div key={s.label} className="wn-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-wn-text-muted uppercase tracking-wider">{s.label}</span>
              <div className="p-2 rounded-lg" style={{ backgroundColor: s.color + "20" }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-wn-text-primary">{s.value}</div>
            <div className="text-xs text-wn-text-muted mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* View Switcher */}
      <div className="flex gap-1 mb-6 bg-wn-surface rounded-xl p-1 w-fit border border-wn-border">
        {([
          { key: "workforce", label: "Workforce Utilization" },
          { key: "forecast", label: "Payroll Forecast" },
          { key: "performance", label: "Performance Analysis" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === tab.key ? "bg-wn-blue text-white shadow" : "text-wn-text-muted hover:text-wn-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workforce Utilization */}
      {view === "workforce" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 wn-card p-6">
            <h2 className="text-base font-semibold text-wn-text-primary mb-4">Weekly Utilization Rate</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={workforceData}>
                <defs>
                  <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="week" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} domain={[60, 100]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9" }} formatter={(v: number) => [`${v}%`, "Utilization"]} />
                <Area type="monotone" dataKey="utilization" stroke="#2563EB" fill="url(#utilGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="wn-card p-6">
            <h2 className="text-base font-semibold text-wn-text-primary mb-4">Org Health Radar</h2>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} outerRadius={90}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748B", fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 9 }} />
                <Radar dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Payroll Forecast */}
      {view === "forecast" && (
        <div className="wn-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-wn-text-primary">Payroll Forecast — Jul–Sep 2025</h2>
            <div className="flex items-center gap-4 text-xs text-wn-text-muted">
              <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-wn-blue inline-block" /> Actual</span>
              <span className="flex items-center gap-1"><span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-400 inline-block" /> Forecast</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9" }} formatter={(v: number) => v ? [`$${v.toLocaleString()}`, ""] : ["N/A", ""]} />
              <Line dataKey="actual" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: "#2563EB", r: 4 }} connectNulls={false} name="Actual" />
              <Line dataKey="forecast" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: "#10B981", r: 3 }} name="Forecast" />
            </LineChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { month: "July 2025", forecast: "$318,000", conf: "94%" },
              { month: "August 2025", forecast: "$332,000", conf: "87%" },
              { month: "September 2025", forecast: "$345,000", conf: "79%" },
            ].map((f) => (
              <div key={f.month} className="p-4 rounded-xl bg-wn-surface border border-wn-border text-center">
                <div className="text-xs text-wn-text-muted mb-1">{f.month}</div>
                <div className="text-xl font-bold text-emerald-400">{f.forecast}</div>
                <div className="text-xs text-wn-text-muted mt-1">Confidence: {f.conf}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Analysis */}
      {view === "performance" && (
        <div className="wn-card p-6">
          <h2 className="text-base font-semibold text-wn-text-primary mb-2">KPI Score vs. Salary Correlation</h2>
          <p className="text-xs text-wn-text-muted mb-5">Each dot represents an agent. Explore patterns between KPI performance and compensation.</p>
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="kpi" type="number" name="KPI Score" unit="%" domain={[60, 100]} tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} label={{ value: "KPI Score (%)", position: "insideBottom", offset: -5, fill: "#64748B", fontSize: 12 }} />
              <YAxis dataKey="salary" type="number" name="Salary" domain={[2000, 6000]} tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
              <Tooltip content={<CustomScatterTooltip />} />
              <Scatter data={performanceScatter} fill="#2563EB" opacity={0.85} />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 rounded-xl bg-wn-blue/10 border border-wn-blue/20 text-xs text-wn-text-muted">
            💡 <strong className="text-wn-text-primary">Insight:</strong> Agents with KPI &gt; 90% earn on average 28% more than those below 80%, suggesting strong alignment between performance and compensation.
          </div>
        </div>
      )}
    </AppLayout>
  );
}
