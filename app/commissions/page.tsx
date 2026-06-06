"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Award, TrendingUp, TrendingDown, DollarSign, Plus,
  Trash2, Save, ChevronDown, Download, Search, Star,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";

const commissionRules = [
  {
    id: "CR001", project: "Telecom Alpha", name: "Standard Commission",
    type: "percentage", rate: 8, threshold: 85, cap: 5000, active: true,
  },
  {
    id: "CR002", project: "ISP Beta", name: "High Performance Bonus",
    type: "tiered", rate: 12, threshold: 95, cap: 8000, active: true,
  },
  {
    id: "CR003", project: "Fiber Deploy", name: "Base Commission",
    type: "percentage", rate: 6, threshold: 80, cap: 3500, active: false,
  },
];

const leaderboard = [
  { rank: 1, name: "Sara Johnson", project: "Telecom Alpha", kpi: 98, earned: 4200, trend: "up", avatar: "SJ" },
  { rank: 2, name: "Ahmed Malik", project: "ISP Beta", kpi: 95, earned: 3850, trend: "up", avatar: "AM" },
  { rank: 3, name: "Layla Chen", project: "Telecom Alpha", kpi: 92, earned: 3400, trend: "down", avatar: "LC" },
  { rank: 4, name: "Tom Rivera", project: "Fiber Deploy", kpi: 88, earned: 2900, trend: "up", avatar: "TR" },
  { rank: 5, name: "Nina Patel", project: "ISP Beta", kpi: 85, earned: 2600, trend: "down", avatar: "NP" },
  { rank: 6, name: "Omar Diallo", project: "Telecom Alpha", kpi: 83, earned: 2250, trend: "up", avatar: "OD" },
];

const payoutHistory = [
  { month: "Jan", Commissions: 38000, Bonuses: 12000 },
  { month: "Feb", Commissions: 42000, Bonuses: 9000 },
  { month: "Mar", Commissions: 45000, Bonuses: 15000 },
  { month: "Apr", Commissions: 39000, Bonuses: 11000 },
  { month: "May", Commissions: 52000, Bonuses: 18000 },
  { month: "Jun", Commissions: 48000, Bonuses: 13000 },
];

const trendData = [
  { month: "Jan", rate: 7.2 },
  { month: "Feb", rate: 7.8 },
  { month: "Mar", rate: 8.1 },
  { month: "Apr", rate: 7.5 },
  { month: "May", rate: 9.2 },
  { month: "Jun", rate: 8.8 },
];

export default function CommissionsPage() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "rules" | "history">("leaderboard");
  const [search, setSearch] = useState("");
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [showNewRule, setShowNewRule] = useState(false);

  const filtered = leaderboard.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.project.toLowerCase().includes(search.toLowerCase())
  );

  const rankColors = ["#F59E0B", "#94A3B8", "#CD7F32"];

  return (
    <AppLayout title="Commissions">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Paid (Jun)", value: "$61,000", icon: DollarSign, color: "#2563EB", change: "+8.3%" },
          { label: "Avg Commission Rate", value: "8.8%", icon: TrendingUp, color: "#10B981", change: "+0.3%" },
          { label: "Top Earner", value: "$4,200", icon: Award, color: "#F59E0B", change: "Sara J." },
          { label: "Active Rules", value: "2 / 3", icon: Star, color: "#8B5CF6", change: "1 paused" },
        ].map((card) => (
          <div key={card.label} className="wn-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-wn-text-muted uppercase tracking-wider">{card.label}</span>
              <div className="p-2 rounded-lg" style={{ backgroundColor: card.color + "20" }}>
                <card.icon size={16} style={{ color: card.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-wn-text-primary mb-1">{card.value}</div>
            <div className="text-xs text-wn-text-muted">{card.change}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-wn-surface rounded-xl p-1 w-fit border border-wn-border">
        {(["leaderboard", "rules", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-wn-blue text-white shadow"
                : "text-wn-text-muted hover:text-wn-text-primary"
            }`}
          >
            {tab === "leaderboard" ? "Leaderboard" : tab === "rules" ? "Rules" : "Payout History"}
          </button>
        ))}
      </div>

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 wn-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-wn-text-primary">Commission Leaderboard</h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-wn-text-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search agents..."
                  className="wn-input pl-8 text-sm w-44"
                />
              </div>
            </div>
            <div className="space-y-3">
              {filtered.map((agent) => (
                <div
                  key={agent.rank}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-wn-surface/60 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: agent.rank <= 3 ? rankColors[agent.rank - 1] + "30" : "#1E293B",
                      color: agent.rank <= 3 ? rankColors[agent.rank - 1] : "#94A3B8",
                    }}
                  >
                    {agent.rank <= 3 ? ["🥇","🥈","🥉"][agent.rank-1] : `#${agent.rank}`}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-wn-blue/20 flex items-center justify-center text-xs font-bold text-wn-blue">
                    {agent.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-wn-text-primary">{agent.name}</div>
                    <div className="text-xs text-wn-text-muted">{agent.project}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-wn-text-primary">{agent.kpi}%</div>
                    <div className="text-xs text-wn-text-muted">KPI</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">${agent.earned.toLocaleString()}</div>
                    <div className="flex items-center justify-end gap-1 text-xs">
                      {agent.trend === "up" ? (
                        <TrendingUp size={11} className="text-emerald-400" />
                      ) : (
                        <TrendingDown size={11} className="text-red-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Chart */}
          <div className="wn-card p-6">
            <h2 className="text-lg font-semibold text-wn-text-primary mb-4">Avg Rate Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9" }}
                  formatter={(v: number) => [`${v}%`, "Rate"]}
                />
                <Line dataKey="rate" stroke="#2563EB" strokeWidth={2} dot={{ fill: "#2563EB", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 rounded-xl bg-wn-surface border border-wn-border">
              <div className="text-xs text-wn-text-muted mb-1">Current Month</div>
              <div className="text-2xl font-bold text-wn-blue">8.8%</div>
              <div className="text-xs text-emerald-400 mt-1">↑ +0.3% from last month</div>
            </div>
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <div className="wn-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-wn-text-primary">Commission Rules</h2>
            <button
              onClick={() => setShowNewRule(true)}
              className="wn-btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={15} /> New Rule
            </button>
          </div>

          <div className="space-y-4">
            {commissionRules.map((rule) => (
              <div key={rule.id} className="p-4 rounded-xl border border-wn-border bg-wn-surface/40 hover:border-wn-blue/40 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-wn-text-primary">{rule.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        rule.active ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"
                      }`}>
                        {rule.active ? "Active" : "Paused"}
                      </span>
                      <span className="text-xs text-wn-text-muted">→ {rule.project}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-wn-text-muted">Rate</span>
                        <div className="font-semibold text-wn-text-primary">{rule.rate}%</div>
                      </div>
                      <div>
                        <span className="text-wn-text-muted">Min KPI</span>
                        <div className="font-semibold text-wn-text-primary">{rule.threshold}%</div>
                      </div>
                      <div>
                        <span className="text-wn-text-muted">Cap</span>
                        <div className="font-semibold text-wn-text-primary">${rule.cap.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingRule(editingRule === rule.id ? null : rule.id)}
                      className="p-2 rounded-lg hover:bg-wn-blue/10 text-wn-blue transition-colors text-xs"
                    >
                      Edit
                    </button>
                    <button className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {editingRule === rule.id && (
                  <div className="mt-4 pt-4 border-t border-wn-border grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-wn-text-muted mb-1 block">Commission Rate (%)</label>
                      <input defaultValue={rule.rate} type="number" className="wn-input w-full text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-wn-text-muted mb-1 block">Minimum KPI (%)</label>
                      <input defaultValue={rule.threshold} type="number" className="wn-input w-full text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-wn-text-muted mb-1 block">Payout Cap ($)</label>
                      <input defaultValue={rule.cap} type="number" className="wn-input w-full text-sm" />
                    </div>
                    <div className="col-span-3 flex justify-end gap-2">
                      <button onClick={() => setEditingRule(null)} className="wn-btn-ghost text-sm">Cancel</button>
                      <button onClick={() => setEditingRule(null)} className="wn-btn-primary flex items-center gap-1 text-sm">
                        <Save size={13} /> Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="wn-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-wn-text-primary">Payout History</h2>
            <button className="wn-btn-ghost flex items-center gap-2 text-sm">
              <Download size={14} /> Export
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={payoutHistory} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9" }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
              />
              <Legend />
              <Bar dataKey="Commissions" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Bonuses" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-wn-border">
                  {["Month", "Commissions", "Bonuses", "Total", "Agents Paid"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs text-wn-text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payoutHistory.map((row) => (
                  <tr key={row.month} className="border-b border-wn-border/50 hover:bg-wn-surface/50">
                    <td className="py-3 px-3 font-medium text-wn-text-primary">{row.month} 2025</td>
                    <td className="py-3 px-3 text-wn-blue">${row.Commissions.toLocaleString()}</td>
                    <td className="py-3 px-3 text-emerald-400">${row.Bonuses.toLocaleString()}</td>
                    <td className="py-3 px-3 font-semibold text-wn-text-primary">${(row.Commissions + row.Bonuses).toLocaleString()}</td>
                    <td className="py-3 px-3 text-wn-text-muted">{Math.floor(Math.random() * 30 + 40)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
