"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { evaluateKPI } from "@/lib/formulaEngine";
import { Plus, Trash2, Save, Play, BarChart3, AlertTriangle, ChevronDown, Sparkles, HelpCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const TOOLTIP_STYLE = { backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "10px", color: "#F8FAFC", fontSize: "12px" };

interface KPIDetail {
  id: string;
  name: string;
  weight: number;
  target: number;
  warningThreshold: number;
  score: number;
  targetType?: string;
  achieved?: number;
  manualScore?: number;
  formula?: string;
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
  baseSalary?: number;
  baseBonus?: number;
  bonusFormula?: string;
  commissionFormula?: string;
}

const defaultRadarData = [
  { kpi: "Calls", score: 80 },
  { kpi: "Sales", score: 85 },
  { kpi: "Quality", score: 75 },
  { kpi: "Attendance", score: 90 }
];

export default function KPIPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [kpis, setKPIs] = useState<KPIDetail[]>([]);
  const [selectedProject, setSelectedProject] = useState("All Projects");
  
  // Project-wide calculation variables
  const [baseSalary, setBaseSalary] = useState<number>(3000);
  const [baseBonus, setBaseBonus] = useState<number>(500);
  const [salaryFormula, setSalaryFormula] = useState<string>("");
  const [bonusFormula, setBonusFormula] = useState<string>("");
  const [commissionFormula, setCommissionFormula] = useState<string>("");

  const [formulaResult, setFormulaResult] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error("Failed to load projects:", e);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Sync state whenever projects or selected project changes
  useEffect(() => {
    if (selectedProject === "All Projects") {
      // Default KPIs shown as mock template when no specific project is selected
      setKPIs([
        { id: "1", name: "Calls", weight: 30, target: 200, warningThreshold: 70, score: 87 },
        { id: "2", name: "Sales", weight: 40, target: 50, warningThreshold: 65, score: 92 },
        { id: "3", name: "Quality", weight: 20, target: 90, warningThreshold: 75, score: 79 },
        { id: "4", name: "Attendance", weight: 10, target: 100, warningThreshold: 80, score: 95 }
      ]);
      setBaseSalary(3200);
      setBaseBonus(500);
      setSalaryFormula("baseSalary * (kpiScore / 100)");
      setBonusFormula("baseBonus * (kpiScore / 100)");
      setCommissionFormula("baseSalary * 0.1 * (Sales / 50)");
    } else {
      const proj = projects.find(p => p.name === selectedProject);
      if (proj) {
        setKPIs(proj.kpiDetails || []);
        setBaseSalary(proj.baseSalary ?? 3000);
        setBaseBonus(proj.baseBonus ?? 500);
        setSalaryFormula(proj.salaryFormula || "baseSalary * (kpiScore / 100)");
        setBonusFormula(proj.bonusFormula || "baseBonus * (kpiScore / 100)");
        setCommissionFormula(proj.commissionFormula || "0");
      }
    }
    setFormulaResult(null);
    setSaveSuccess(false);
  }, [selectedProject, projects]);

  // 1. Automatically calculate each KPI score and dynamic contribution using our formula engine!
  const calculatedKPIs = kpis.map(kpi => {
    const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
    const caseCleanName = kpi.name.replace(/\s+/g, "");
    // Use stored database score as base for a healthy mock achievement value in builder view
    const achievedVal = kpi.achieved ?? Math.round((kpi.target * (kpi.score || 85) / 100));
    const targetVal = kpi.target || 1;
    const weightVal = kpi.weight;

    const scopeKPI: Record<string, number> = {
      [cleanName]: achievedVal,
      [caseCleanName]: achievedVal,
      [`${cleanName}Raw`]: achievedVal,
      [`${caseCleanName}Raw`]: achievedVal,
      [`${cleanName}Target`]: targetVal,
      [`${caseCleanName}Target`]: targetVal,
      achieved: achievedVal,
      target: targetVal,
      weight: weightVal,
      attendanceDays: 22,
      days: 22
    };

    kpis.forEach(o => {
      const oClean = o.name.toLowerCase().replace(/\s+/g, "");
      const oCase = o.name.replace(/\s+/g, "");
      const oVal = o.achieved ?? Math.round((o.target * (o.score || 85) / 100));
      scopeKPI[oClean] = oVal;
      scopeKPI[oCase] = oVal;
    });

    const formula = kpi.formula || `(${cleanName} / target) * 100`;
    const evaluatedScore = evaluateKPI(formula, scopeKPI);
    const usesWeight = formula.toLowerCase().includes("weight");
    const contribution = usesWeight ? evaluatedScore : evaluatedScore * (weightVal / 100);

    return {
      ...kpi,
      evaluatedScore,
      contribution
    };
  });

  const totalKPIScore = Math.round(calculatedKPIs.reduce((sum, k) => sum + k.contribution, 0) * 10) / 10;

  const getKPIActiveScore = (k: any) => {
    const found = calculatedKPIs.find(item => item.id === k.id);
    return found ? found.evaluatedScore : (k.score || 80);
  };

  const getProjectOverallScore = (details: any[]) => {
    if (details.length === 0) return 80;
    return totalKPIScore;
  };

  const totalWeight = kpis.reduce((s, k) => s + k.weight, 0);

  // Compute performance for charts
  const filteredPerf = selectedProject === "All Projects"
    ? projects.map(p => {
      const details = p.kpiDetails || [];
      const score = details.length > 0 ? getProjectOverallScore(details) : 80;
      return { project: p.name, score };
    })
    : (() => {
      const proj = projects.find(p => p.name === selectedProject);
      if (!proj) return [];
      const details = proj.kpiDetails || [];
      const score = details.length > 0 ? getProjectOverallScore(details) : 80;
      return [{ project: proj.name, score }];
    })();

  // Compute radar data
  const radarData = (() => {
    if (selectedProject === "All Projects") {
      const allDetails = projects.flatMap(p => p.kpiDetails || []);
      if (allDetails.length === 0) return defaultRadarData;

      const radarMap: Record<string, { sum: number; count: number }> = {};
      allDetails.forEach(d => {
        if (!radarMap[d.name]) radarMap[d.name] = { sum: 0, count: 0 };
        radarMap[d.name].sum += getKPIActiveScore(d);
        radarMap[d.name].count += 1;
      });
      return Object.entries(radarMap).map(([kpi, data]) => ({
        kpi,
        score: Math.round(data.sum / data.count)
      }));
    } else {
      const proj = projects.find(p => p.name === selectedProject);
      if (!proj || !proj.kpiDetails || proj.kpiDetails.length === 0) {
        return defaultRadarData;
      }
      return proj.kpiDetails.map(k => ({
        kpi: k.name,
        score: getKPIActiveScore(k)
      }));
    }
  })();

  const testFormula = () => {
    try {
      const formulaScope: Record<string, number> = {
        base: baseSalary,
        baseSalary: baseSalary,
        baseBonus: baseBonus,
        kpiScore: totalKPIScore,
        totalKPIScore: totalKPIScore,
      };
      calculatedKPIs.forEach(k => {
        formulaScope[k.name.toLowerCase().replace(/\s+/g, "")] = k.evaluatedScore;
      });
      
      const testSal = salaryFormula ? evaluateKPI(salaryFormula, formulaScope) : baseSalary;
      const testBon = bonusFormula ? evaluateKPI(bonusFormula, formulaScope) : baseBonus;
      const testCom = commissionFormula ? evaluateKPI(commissionFormula, formulaScope) : 0;
      
      setFormulaResult(`✓ Valid! Mock Salary: $${Math.round(testSal)}, Mock Bonus: $${Math.round(testBon)}, Mock Commission: $${Math.round(testCom)}`);
    } catch (e: any) {
      setFormulaResult(`✗ Invalid formula syntax: ${e.message}`);
    }
  };

  const addKPI = () => setKPIs([...kpis, { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), name: "New KPI", weight: 0, target: 100, warningThreshold: 70, score: 80, targetType: "daily", formula: "(achieved / target) * 100" }]);
  const removeKPI = (id: string) => setKPIs(kpis.filter(k => k.id !== id));
  const updateKPI = (id: string, field: string, val: any) => setKPIs(kpis.map(k => k.id === id ? { ...k, [field]: val } : k));

  const handleSave = async () => {
    const proj = projects.find(p => p.name === selectedProject);
    if (!proj) return;

    try {
      const updatedKPIStrings = kpis.map(k => `${k.name} (${k.weight}%)`);
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: proj.id,
          kpiDetails: kpis,
          kpis: updatedKPIStrings,
          salaryFormula: salaryFormula,
          baseSalary,
          baseBonus,
          bonusFormula,
          commissionFormula
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await loadProjects();
      }
    } catch (e) {
      console.error("Error saving project KPIs:", e);
    }
  };

  return (
    <AppLayout title="KPI Management">
      {/* Project Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <BarChart3 size={16} className="text-[#2563EB] shrink-0" />
          <span className="text-sm font-semibold text-[var(--text-primary)] shrink-0">Project:</span>
          <div className="relative">
            <select
              className="wn-input pr-8 text-sm appearance-none cursor-pointer"
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
            >
              <option value="All Projects">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
          </div>
        </div>

        {selectedProject !== "All Projects" && (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-500/20 text-blue-400">
            Showing KPIs for: {selectedProject}
          </span>
        )}

        <div className="md:ml-auto flex gap-3">
          {selectedProject !== "All Projects" && (
            <>
              <button className="btn-secondary text-xs md:text-sm" onClick={testFormula}><Play size={14} />Test Formulas</button>
              <button className="btn-primary text-xs md:text-sm" onClick={addKPI}><Plus size={14} />Add KPI</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* KPI Builder */}
        <div className="kpi-card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-[var(--text-primary)]">KPI Configuration Builder</p>
            <span className={`badge ${totalWeight === 100 ? "badge-green" : "badge-orange"}`}>
              Total Weight: {totalWeight}%
            </span>
          </div>

          {selectedProject === "All Projects" ? (
            <div className="flex items-center gap-2 px-3 py-3 rounded-lg text-sm bg-blue-950/20 text-blue-400 border border-blue-800/20 mb-4">
              💡 Select a specific project in the dropdown above to edit and persist custom KPI configuration metrics.
            </div>
          ) : (
            totalWeight !== 100 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs" style={{ background: "rgba(249,115,22,0.1)", color: "#F97316" }}>
                <AlertTriangle size={13} /> Weights must total 100%. Currently: {totalWeight}%
              </div>
            )
          )}

          {/* Sleek Aligned List */}
          <div className="space-y-3">
            {kpis.map(kpi => {
              const targetPeriod = kpi.targetType || "daily";

              return (
                <div key={kpi.id} className="p-4 rounded-xl border flex flex-col gap-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <div className="flex flex-col md:flex-row items-end gap-3">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-1 w-full text-left">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 whitespace-nowrap">KPI Name</label>
                        <input 
                          className="wn-input text-sm" 
                          value={kpi.name} 
                          disabled={selectedProject === "All Projects"} 
                          onChange={e => updateKPI(kpi.id, "name", e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 whitespace-nowrap">Periodicity</label>
                        <select 
                          className="wn-input text-sm appearance-none pr-8 cursor-pointer" 
                          value={targetPeriod}
                          disabled={selectedProject === "All Projects"}
                          onChange={e => updateKPI(kpi.id, "targetType", e.target.value)}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 whitespace-nowrap">Target</label>
                        <input 
                          className="wn-input text-sm" 
                          type="number" 
                          value={kpi.target} 
                          disabled={selectedProject === "All Projects"} 
                          onChange={e => updateKPI(kpi.id, "target", +e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 whitespace-nowrap">Weight (%)</label>
                        <input 
                          className="wn-input text-sm" 
                          type="number" 
                          min={0} 
                          max={100} 
                          value={kpi.weight} 
                          disabled={selectedProject === "All Projects"} 
                          onChange={e => updateKPI(kpi.id, "weight", +e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 whitespace-nowrap">Warning Threshold (%)</label>
                        <input 
                          className="wn-input text-sm" 
                          type="number" 
                          min={0} 
                          max={100} 
                          value={kpi.warningThreshold} 
                          disabled={selectedProject === "All Projects"} 
                          onChange={e => updateKPI(kpi.id, "warningThreshold", +e.target.value)} 
                        />
                      </div>
                    </div>
                    {selectedProject !== "All Projects" && (
                      <button onClick={() => removeKPI(kpi.id)} className="btn-danger py-2.5 px-3 mb-0.5"><Trash2 size={15} /></button>
                    )}
                  </div>

                  {/* KPI Score Formula field */}
                  <div className="pt-2 border-t border-slate-800/40">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      KPI Score Formula
                    </label>
                    <input
                      type="text"
                      className="wn-input text-xs font-mono w-full py-1.5 px-3 bg-slate-950/60 border-slate-850 text-[#06B6D4]"
                      value={kpi.formula || ""}
                      placeholder="e.g. (calls / target) * 100"
                      disabled={selectedProject === "All Projects"}
                      onChange={e => updateKPI(kpi.id, "formula", e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {selectedProject !== "All Projects" && (
            <div className="mt-4 flex flex-col gap-2">
              <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={handleSave}>
                <Save size={15} />Save KPI Configuration & Parameters
              </button>
              {saveSuccess && (
                <div className="text-center text-xs font-semibold text-green-400 py-1.5 bg-green-950/20 rounded border border-green-800/25 animate-pulse">
                  ✓ KPI Configuration and Project-wide Formulas saved and synchronized!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Radar Chart */}
        <div className="kpi-card flex flex-col justify-between">
          <div>
            <p className="font-bold text-[var(--text-primary)] mb-1">KPI Score Overview</p>
            <p className="text-xs text-[var(--text-secondary)] mb-4">Current month performance</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="kpi" tick={{ fill: "#64748B", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.25} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `${v}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Project-Wide Calculations Panel */}
      {selectedProject !== "All Projects" && (
        <div className="kpi-card mb-6 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 text-[var(--text-primary)]">
              <Sparkles size={18} className="text-blue-400" />
              <p className="font-bold text-lg">Project-Wide Calculation & Formulas</p>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Configure global payout multipliers, base salaries, and dynamic evaluation formulas for the entire project.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Base Parameters & Legend */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="p-4 rounded-xl border space-y-4" style={{ borderColor: "var(--border)", background: "rgba(15,23,42,0.3)" }}>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Base Project Parameters</p>
                
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Base Salary ($)</label>
                  <input
                    type="number"
                    className="wn-input text-sm"
                    value={baseSalary}
                    onChange={e => setBaseSalary(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Base Bonus ($)</label>
                  <input
                    type="number"
                    className="wn-input text-sm"
                    value={baseBonus}
                    onChange={e => setBaseBonus(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Dynamic legend */}
              <div className="p-4 rounded-xl border text-xs" style={{ borderColor: "var(--border)", background: "rgba(15,23,42,0.15)" }}>
                <div className="flex items-center gap-1 mb-2 font-semibold text-slate-300">
                  <HelpCircle size={14} className="text-slate-400" />
                  <span>Available Variables Legend</span>
                </div>
                <ul className="space-y-1.5 font-mono text-[10px] text-slate-400">
                  <li><span className="text-blue-400">baseSalary</span> / <span className="text-blue-400">base</span> : Base Salary</li>
                  <li><span className="text-blue-400">baseBonus</span> : Base Bonus</li>
                  <li><span className="text-blue-400">kpiScore</span> : Composite Score (0-100)</li>
                  {kpis.map(k => (
                    <li key={k.id}>
                      <span className="text-[#06B6D4]">{k.name.replace(/\s+/g, "")}</span> : Achieved Metric
                    </li>
                  ))}
                  {kpis.map(k => (
                    <li key={k.id + "_w"}>
                      <span className="text-[#06B6D4]">{k.name.replace(/\s+/g, "")}Weight</span> : {k.weight}% Weight
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Col: Formulas Textareas */}
            <div className="lg:col-span-2 space-y-4">
              {/* Salary Formula */}
              <div className="p-4 rounded-xl border flex flex-col gap-2" style={{ borderColor: "var(--border)", background: "#020617" }}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Weighted Salary Calculation Formula</span>
                  <span className="text-[10px] text-slate-500 font-mono">Resolves to Base Pay Column</span>
                </div>
                <textarea
                  className="w-full bg-transparent outline-none resize-none font-mono text-sm text-[#06B6D4]"
                  rows={2}
                  value={salaryFormula}
                  onChange={e => setSalaryFormula(e.target.value)}
                  placeholder="e.g. baseSalary * (kpiScore / 100)"
                />
              </div>

              {/* Bonus Formula */}
              <div className="p-4 rounded-xl border flex flex-col gap-2" style={{ borderColor: "var(--border)", background: "#020617" }}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Project-Wide KPI Bonus Formula</span>
                  <span className="text-[10px] text-slate-500 font-mono">Resolves to Bonus Column</span>
                </div>
                <textarea
                  className="w-full bg-transparent outline-none resize-none font-mono text-sm text-[#06B6D4]"
                  rows={2}
                  value={bonusFormula}
                  onChange={e => setBonusFormula(e.target.value)}
                  placeholder="e.g. baseBonus * (kpiScore / 100)"
                />
              </div>

              {/* Commission Formula */}
              <div className="p-4 rounded-xl border flex flex-col gap-2" style={{ borderColor: "var(--border)", background: "#020617" }}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Project-Wide Commission Formula</span>
                  <span className="text-[10px] text-slate-500 font-mono">Resolves to Commission Column</span>
                </div>
                <textarea
                  className="w-full bg-transparent outline-none resize-none font-mono text-sm text-[#06B6D4]"
                  rows={2}
                  value={commissionFormula}
                  onChange={e => setCommissionFormula(e.target.value)}
                  placeholder="e.g. baseSalary * 0.1 * (Sales / 50)"
                />
              </div>

              {formulaResult && (
                <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${formulaResult.startsWith("✓") ? "badge-green animate-pulse" : "badge-red"}`}
                  style={{ background: formulaResult.startsWith("✓") ? "rgba(34,197,94,0.1)" : "rgba(220,38,38,0.1)", color: formulaResult.startsWith("✓") ? "#16A34A" : "#B91C1C" }}>
                  {formulaResult}
                </div>
              )}

              <div className="flex gap-2">
                <button className="btn-secondary text-xs md:text-sm" onClick={testFormula}>
                  <Play size={14} className="mr-1 inline-block" />Run Structures Validation
                </button>
                <button className="btn-primary text-xs md:text-sm ml-auto" onClick={handleSave}>
                  <Save size={14} className="mr-1 inline-block" />Save All Calculations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project KPI Performance */}
      <div className="kpi-card">
        <p className="font-bold text-[var(--text-primary)] mb-1">Project KPI Performance</p>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          {selectedProject === "All Projects" ? "Average KPI score across all projects this month" : `KPI score for ${selectedProject}`}
        </p>
        <div className="w-full">
          {filteredPerf.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] italic py-8 text-center">No project statistics loaded.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={filteredPerf} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="project" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `${v}%`} />
                <Bar dataKey="score" name="KPI Score" radius={[6, 6, 0, 0]}>
                  {filteredPerf.map((p, i) => (
                    <rect key={i} fill={p.score >= 85 ? "#22C55E" : p.score >= 75 ? "#2563EB" : "#F97316"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
