"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Zap, Play, Pause, RefreshCw, Plus, CheckCircle, Clock, AlertTriangle, MoreVertical } from "lucide-react";

const workflows = [
  {
    id: "WF001", name: "Monthly Payroll Calculation", trigger: "Schedule — 1st of month",
    status: "active", lastRun: "2025-06-01 00:00", nextRun: "2025-07-01 00:00", runs: 12, success: 12,
    steps: ["Fetch attendance data", "Apply KPI weights", "Calculate gross salary", "Deduct penalties", "Generate payslips", "Notify HR"],
  },
  {
    id: "WF002", name: "KPI Alert — Below Threshold", trigger: "Event — KPI drops < 75%",
    status: "active", lastRun: "2025-06-10 14:22", nextRun: "On trigger", runs: 34, success: 33,
    steps: ["Detect low KPI", "Identify agent", "Send supervisor alert", "Log to audit trail"],
  },
  {
    id: "WF003", name: "Commission Payout Approval", trigger: "Manual — End of month",
    status: "paused", lastRun: "2025-05-31 10:00", nextRun: "Paused", runs: 6, success: 6,
    steps: ["Compile commission totals", "Submit for finance approval", "Trigger bank transfer", "Send payout slips"],
  },
  {
    id: "WF004", name: "Excel Import Processor", trigger: "Event — File uploaded",
    status: "active", lastRun: "2025-06-08 09:14", nextRun: "On trigger", runs: 28, success: 26,
    steps: ["Validate file format", "Map columns", "Sanitize data", "Insert to database", "Send confirmation"],
  },
];

export default function WorkflowsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedWf = workflows.find((w) => w.id === selected);

  return (
    <AppLayout title="Workflows">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-wn-text-muted">Automate recurring payroll, KPI, and notification tasks via n8n-powered workflows.</p>
        <button className="wn-btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> New Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              onClick={() => setSelected(wf.id === selected ? null : wf.id)}
              className={`wn-card p-5 cursor-pointer transition-all border-2 ${
                selected === wf.id ? "border-wn-blue" : "border-transparent hover:border-wn-border"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg mt-0.5 ${
                  wf.status === "active" ? "bg-emerald-500/20" : "bg-slate-500/20"
                }`}>
                  <Zap size={16} className={wf.status === "active" ? "text-emerald-400" : "text-slate-400"} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-wn-text-primary">{wf.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        wf.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"
                      }`}>
                        {wf.status === "active" ? "Active" : "Paused"}
                      </span>
                      <button className="p-1 rounded hover:bg-wn-surface text-wn-text-muted" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-wn-text-muted mt-1">{wf.trigger}</div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-wn-text-muted">
                    <span className="flex items-center gap-1">
                      <CheckCircle size={11} className="text-emerald-400" /> {wf.success}/{wf.runs} successful
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> Last: {wf.lastRun}
                    </span>
                    <span className="flex items-center gap-1">
                      <RefreshCw size={11} /> Next: {wf.nextRun}
                    </span>
                  </div>
                </div>
              </div>

              {selected === wf.id && (
                <div className="mt-4 pt-4 border-t border-wn-border">
                  <h4 className="text-xs font-semibold text-wn-text-muted uppercase tracking-wider mb-3">Workflow Steps</h4>
                  <div className="flex flex-wrap gap-2">
                    {wf.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-wn-blue/10 border border-wn-blue/20 rounded-lg text-xs text-wn-blue font-medium">
                          <span className="w-4 h-4 rounded-full bg-wn-blue/20 flex items-center justify-center text-[9px]">{i+1}</span>
                          {step}
                        </div>
                        {i < wf.steps.length - 1 && <span className="text-wn-text-muted text-xs">→</span>}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="wn-btn-primary flex items-center gap-1 text-xs py-1.5 px-3">
                      <Play size={11} /> Run Now
                    </button>
                    <button className="wn-btn-ghost flex items-center gap-1 text-xs py-1.5 px-3">
                      {wf.status === "active" ? <><Pause size={11} /> Pause</> : <><Play size={11} /> Resume</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <div className="wn-card p-5">
            <h3 className="text-sm font-semibold text-wn-text-primary mb-4">Workflow Stats</h3>
            <div className="space-y-4">
              {[
                { label: "Total Workflows", value: "4", color: "#2563EB" },
                { label: "Active", value: "3", color: "#10B981" },
                { label: "Total Runs (all time)", value: "80", color: "#8B5CF6" },
                { label: "Success Rate", value: "97.5%", color: "#F59E0B" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-wn-text-muted">{s.label}</span>
                  <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="wn-card p-5">
            <h3 className="text-sm font-semibold text-wn-text-primary mb-3">Recent Runs</h3>
            <div className="space-y-2">
              {[
                { name: "Payroll Calc", time: "Jun 01 00:00", ok: true },
                { name: "KPI Alert", time: "Jun 10 14:22", ok: true },
                { name: "Excel Import", time: "Jun 08 09:14", ok: false },
                { name: "KPI Alert", time: "Jun 07 11:05", ok: true },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {r.ok ? <CheckCircle size={12} className="text-emerald-400" /> : <AlertTriangle size={12} className="text-amber-400" />}
                  <span className="flex-1 text-wn-text-primary">{r.name}</span>
                  <span className="text-wn-text-muted">{r.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
