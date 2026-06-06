"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Plus, Search, Settings, CheckCircle, Clock, PauseCircle, FolderKanban, X, ChevronRight, Edit2, BarChart3 } from "lucide-react";

interface KPIDetail {
  id: string;
  name: string;
  weight: number;
  target: number;
  formula: string;
  warningThreshold: number;
  score: number;
  achievedBonus?: string | number;
  achievedCommission?: string | number;
}

interface Project {
  id: string;
  name: string;
  client: string;
  department: string;
  agents: number;
  status: string;
  currency: string;
  payrollCycle: string;
  created: string;
  kpis: string[];
  kpiDetails: KPIDetail[];
  salaryFormula: string;
  commissionSystem: string;
}

const statusCfg: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  active: { label: "Active", badge: "badge badge-green", icon: <CheckCircle size={12} /> },
  paused: { label: "Paused", badge: "badge badge-orange", icon: <PauseCircle size={12} /> },
  draft: { label: "Draft", badge: "badge badge-gray", icon: <Clock size={12} /> },
};

const emptyForm = { name: "", client: "", department: "", currency: "USD", payrollCycle: "Monthly", kpiMethod: "Weighted", warningThreshold: "80", attendanceRules: "" };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showKPIManager, setShowKPIManager] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState<Partial<Project>>({});
  const [newKPI, setNewKPI] = useState("");

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error("Error fetching projects:", e);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.client.toLowerCase().includes(search.toLowerCase())
  );

  // Open Edit modal pre-filled with selected project data
  const handleEditProject = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditForm({
      name: project.name,
      client: project.client,
      department: project.department,
      currency: project.currency,
      payrollCycle: project.payrollCycle,
      status: project.status,
    });
    setEditMode(true);
    setSelected(null);
  };

  // Save edits back to the project
  const saveEdit = async () => {
    const targetId = selected?.id ?? projects.find(x => x.name === editForm.name)?.id;
    if (!targetId) return;
    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetId, ...editForm }),
      });
      if (res.ok) {
        await fetchProjects();
      }
    } catch (e) {
      console.error("Error saving edits:", e);
    }
    setEditMode(false);
    setSelected(null);
  };

  // Open KPI manager for a specific project
  const handleManageKPIs = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setSelected(project);
    setShowKPIManager(true);
  };

  const removeKPI = (kpiLabel: string) => {
    if (!selected) return;
    const updated = { ...selected, kpis: selected.kpis.filter(k => k !== kpiLabel) };
    setSelected(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const addKPI = () => {
    if (!newKPI.trim() || !selected) return;
    const updated = { ...selected, kpis: [...selected.kpis, newKPI.trim()] };
    setSelected(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    setNewKPI("");
  };

  const handleSaveKPIs = async () => {
    if (!selected) return;
    try {
      // Build kpiDetails to correspond to the kpis list
      const existingDetails = selected.kpiDetails || [];
      const updatedDetails = selected.kpis.map((kpiName: string) => {
        const cleanName = kpiName.split("(")[0].trim();
        const existing = existingDetails.find((d: any) => d.name.toLowerCase() === cleanName.toLowerCase());
        if (existing) return existing;

        // Parse weight from name if format is "Calls (30%)"
        const weightMatch = kpiName.match(/\((\d+)%\)/);
        const weight = weightMatch ? parseInt(weightMatch[1]) : 0;
        return {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
          name: cleanName,
          weight,
          target: 100,
          formula: `(${cleanName}/100)*${weight}`,
          warningThreshold: 70,
          score: 80,
          achievedBonus: 0,
          achievedCommission: 0,
        };
      });

      // Recalculate salary formula based on new weights if formula is empty
      let formula = selected.salaryFormula;
      if (!formula) {
        formula = updatedDetails.map(d => `((${d.name}/${d.target})*${d.weight})`).join(" + ");
      }

      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          kpis: selected.kpis,
          kpiDetails: updatedDetails,
          salaryFormula: formula,
        }),
      });
      if (res.ok) {
        await fetchProjects();
      }
    } catch (e) {
      console.error("Error saving KPIs:", e);
    }
    setShowKPIManager(false);
    setSelected(null);
  };

  return (
    <AppLayout title="Projects">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="section-title">Telecom Projects</h2>
          <p className="section-subtitle">{projects.length} projects · {projects.filter(p => p.status === "active").length} active</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />New Project</button>
      </div>

      <div className="relative mb-5 max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input className="wn-input pl-9 text-sm" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(project => {
          const cfg = statusCfg[project.status] || statusCfg.draft;
          return (
            <div key={project.id} className="kpi-card cursor-pointer" onClick={() => { setSelected(project); setShowKPIManager(false); }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(37,99,235,0.15)" }}>
                    <FolderKanban size={17} style={{ color: "#2563EB" }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[var(--text-primary)]">{project.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{project.client}</p>
                  </div>
                </div>
                <span className={cfg.badge}>{cfg.icon}{cfg.label}</span>
              </div>

              <div className="space-y-1.5 mb-4 text-xs">
                {[["Department", project.department], ["Agents", (project.agents || 0).toString()], ["Payroll", project.payrollCycle], ["Currency", project.currency]].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-[var(--text-secondary)]">{k}</span><span className="font-medium text-[var(--text-primary)]">{v}</span></div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {(project.kpis || []).map(k => <span key={k} className="badge badge-blue text-xs">{k}</span>)}
              </div>

              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <span className="text-xs text-[var(--text-secondary)]">{project.created}</span>
                <button className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#2563EB" }}>Configure <ChevronRight size={12}/></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Create New Project Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="kpi-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">Create New Project</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              {([["Project Name", "name", "e.g. Alpha Telecom"], ["Telecom Client", "client", "e.g. Alpha Corp"], ["Department", "department", "e.g. Inbound Sales"], ["Warning Threshold (%)", "warningThreshold", "e.g. 80"], ["Attendance Rules", "attendanceRules", "-5% per absence"]] as [string, string, string][]).map(([label, key, ph]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">{label}</label>
                  <input className="wn-input" placeholder={ph} value={form[key as keyof typeof form]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Currency</label>
                  <select className="wn-input" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                    {["USD", "EUR", "GBP", "AED", "SAR"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Payroll Cycle</label>
                  <select className="wn-input" value={form.payrollCycle} onChange={e => setForm({ ...form, payrollCycle: e.target.value })}>
                    {["Monthly", "Bi-weekly", "Weekly"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">KPI Calculation Method</label>
                <select className="wn-input" value={form.kpiMethod} onChange={e => setForm({ ...form, kpiMethod: e.target.value })}>
                  {["Weighted", "Simple Average", "Custom Formula"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={async () => {
                if (form.name.trim()) {
                  try {
                    const res = await fetch("/api/projects", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: form.name,
                        client: form.client,
                        department: form.department,
                        currency: form.currency,
                        payrollCycle: form.payrollCycle,
                        status: "draft"
                      }),
                    });
                    if (res.ok) {
                      await fetchProjects();
                    }
                  } catch (e) {
                    console.error("Error creating project:", e);
                  }
                }
                setShowModal(false);
                setForm(emptyForm);
              }}>Create Project</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Project Modal ── */}
      {editMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="kpi-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title flex items-center gap-2"><Edit2 size={16} /> Edit Project</h2>
              <button onClick={() => setEditMode(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              {([["Project Name", "name"], ["Client", "client"], ["Department", "department"]] as [string, keyof typeof editForm][]).map(([label, key]) => (
                <div key={String(key)}>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">{label}</label>
                  <input className="wn-input" value={String(editForm[key] ?? "")} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Currency</label>
                  <select className="wn-input" value={String(editForm.currency ?? "USD")} onChange={e => setEditForm({ ...editForm, currency: e.target.value })}>
                    {["USD", "EUR", "GBP", "AED", "SAR"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Payroll Cycle</label>
                  <select className="wn-input" value={String(editForm.payrollCycle ?? "Monthly")} onChange={e => setEditForm({ ...editForm, payrollCycle: e.target.value })}>
                    {["Monthly", "Bi-weekly", "Weekly"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Status</label>
                <select className="wn-input" value={String(editForm.status ?? "active")} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                  {["active", "paused", "draft"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setEditMode(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Project Detail Drawer ── */}
      {selected && !showKPIManager && (
        <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setSelected(null)}>
          <div className="ml-auto w-full max-w-md h-full overflow-y-auto p-6" style={{ background: "var(--card-bg)", borderLeft: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">{selected.name}</h2>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            {[["Client", selected.client], ["Department", selected.department], ["Currency", selected.currency], ["Payroll Cycle", selected.payrollCycle], ["Created", selected.created], ["Agents", (selected.agents || 0).toString()]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b text-sm" style={{ borderColor: "var(--border)" }}>
                <span className="text-[var(--text-secondary)]">{k}</span>
                <span className="font-medium text-[var(--text-primary)]">{v}</span>
              </div>
            ))}
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mt-5 mb-3">KPI Configuration</p>
            {(selected.kpis || []).map(k => (
              <div key={k} className="flex items-center justify-between px-3 py-2 rounded-lg mb-2" style={{ background: "rgba(37,99,235,0.08)" }}>
                <span className="text-sm font-medium" style={{ color: "#60A5FA" }}>{k}</span>
                <Settings size={13} style={{ color: "#2563EB" }} />
              </div>
            ))}
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mt-5 mb-2">Salary Formula</p>
            <div className="px-3 py-3 rounded-lg font-mono text-xs" style={{ background: "#0F172A", color: "#06B6D4", border: "1px solid #1E293B" }}>{selected.salaryFormula || "None configured"}</div>
            <div className="flex gap-3 mt-8">
              <button
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
                onClick={(e) => handleEditProject(e, selected)}
              >
                <Edit2 size={14} /> Edit Project
              </button>
              <button
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                onClick={(e) => handleManageKPIs(e, selected)}
              >
                <BarChart3 size={14} /> Manage KPIs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Manager Drawer ── */}
      {selected && showKPIManager && (
        <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => { setShowKPIManager(false); setSelected(null); }}>
          <div className="ml-auto w-full max-w-md h-full overflow-y-auto p-6" style={{ background: "var(--card-bg)", borderLeft: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="section-title flex items-center gap-2"><BarChart3 size={16} /> Manage KPIs</h2>
              <button onClick={() => { setShowKPIManager(false); setSelected(null); }}><X size={18} /></button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-6">Project: <span className="text-[#60A5FA] font-semibold">{selected.name}</span></p>

            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">Current KPIs</p>
            {(selected.kpis || []).length === 0 && (
              <p className="text-sm text-[var(--text-secondary)] italic mb-4">No KPIs configured yet.</p>
            )}
            {(selected.kpis || []).map(k => (
              <div key={k} className="flex items-center justify-between px-3 py-2.5 rounded-lg mb-2" style={{ background: "rgba(37,99,235,0.08)" }}>
                <span className="text-sm font-medium" style={{ color: "#60A5FA" }}>{k}</span>
                <button onClick={() => removeKPI(k)} className="text-red-400 hover:text-red-300 transition-colors p-1">
                  <X size={13} />
                </button>
              </div>
            ))}

            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mt-6 mb-3">Add New KPI</p>
            <div className="flex gap-2">
              <input
                className="wn-input flex-1 text-sm"
                placeholder='e.g. "CSAT (25%)"'
                value={newKPI}
                onChange={e => setNewKPI(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addKPI(); }}
              />
              <button className="btn-primary px-4" onClick={addKPI}><Plus size={14} /></button>
            </div>

            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mt-6 mb-2">Salary Formula</p>
            <textarea
              className="wn-input w-full font-mono text-xs"
              rows={2}
              value={selected.salaryFormula}
              onChange={e => setSelected({ ...selected, salaryFormula: e.target.value })}
              style={{ color: "#06B6D4" }}
            />

            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => { setShowKPIManager(false); setSelected(null); }}>Close</button>
              <button className="btn-primary flex-1" onClick={handleSaveKPIs}>Save KPIs</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
