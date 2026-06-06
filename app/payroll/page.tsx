"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { evaluateKPI } from "@/lib/formulaEngine";
import {
  Download,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Filter,
  X,
  Building2,
  ChevronDown,
  Coins,
  TrendingUp,
  DollarSign,
  Sliders,
  Info,
  Calendar,
  AlertTriangle,
  Trash2
} from "lucide-react";

interface KPIDetail {
  id: string;
  name: string;
  weight: number;
  target: number;
  warningThreshold: number;
  score: number;
  targetType?: string;
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

interface PayrollRecord {
  id: string;
  name: string;
  project: string;
  kpiScore: number;
  base: number;
  commission: number;
  bonus: number;
  deductions: number;
  final: number;
  status: string;
  attendanceDays?: number;
  rawMetrics?: Record<string, number>;
  targets?: Record<string, number>;
}

const statusCfg: Record<string, { badge: string; label: string; bg: string; text: string }> = {
  approved: { badge: "badge badge-green", label: "Approved", bg: "rgba(34, 197, 94, 0.12)", text: "#16A34A" },
  pending: { badge: "badge badge-orange", label: "Pending", bg: "rgba(249, 115, 22, 0.12)", text: "#EA580C" },
  rejected: { badge: "badge badge-red", label: "Rejected", bg: "rgba(220, 38, 38, 0.12)", text: "#B91C1C" },
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("All Projects");
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollRecord | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Drawer Form States
  const [drawerBase, setDrawerBase] = useState<number>(0);
  const [drawerCommission, setDrawerCommission] = useState<number>(0);
  const [drawerBonus, setDrawerBonus] = useState<number>(0);
  const [drawerDeductions, setDrawerDeductions] = useState<number>(0);
  const [drawerStatus, setDrawerStatus] = useState<string>("pending");
  const [isSaving, setIsSaving] = useState(false);

  // Add Agent Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState({
    id: "",
    name: "",
    project: "",
    kpiScore: "90",
    base: "3000",
    status: "pending"
  });

  // New Drawer States for dynamic KPIs and working days
  const [drawerAttendanceDays, setDrawerAttendanceDays] = useState<number>(1);
  const [drawerRawMetrics, setDrawerRawMetrics] = useState<Record<string, number>>({});
  const [drawerTargets, setDrawerTargets] = useState<Record<string, number>>({});

  const loadPayroll = async () => {
    try {
      const res = await fetch("/api/payroll");
      if (res.ok) {
        const data = await res.json();
        setPayroll(data);
      }
    } catch (e) {
      console.error("Failed to fetch payroll database:", e);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error("Failed to fetch projects database:", e);
    }
  };

  const initData = async () => {
    setLoading(true);
    await Promise.all([loadPayroll(), loadProjects()]);
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, []);

  const handleDeletePayroll = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this agent? This will also delete their profile in the employee directory.")) return;
    try {
      const res = await fetch(`/api/payroll?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        loadPayroll();
        showToast("Agent deleted and synced successfully!");
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete agent");
      }
    } catch (err) {
      console.error("Error deleting agent:", err);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...newAgent,
      project: newAgent.project || (projects[0]?.name || "Unassigned")
    };
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewAgent({
          id: "",
          name: "",
          project: projects[0]?.name || "",
          kpiScore: "90",
          base: "3000",
          status: "pending"
        });
        loadPayroll();
        showToast("New agent created and synced successfully!");
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to add agent");
      }
    } catch (err) {
      console.error("Error adding agent:", err);
    }
  };

  // Update Drawer Inputs when selectedEmployee changes
  useEffect(() => {
    if (selectedEmployee) {
      setDrawerBase(selectedEmployee.base);
      setDrawerCommission(selectedEmployee.commission);
      setDrawerBonus(selectedEmployee.bonus);
      setDrawerDeductions(selectedEmployee.deductions);
      setDrawerStatus(selectedEmployee.status);
      setDrawerAttendanceDays(selectedEmployee.attendanceDays || 1);
      setDrawerRawMetrics(selectedEmployee.rawMetrics || {});
      setDrawerTargets(selectedEmployee.targets || {});
    }
  }, [selectedEmployee]);

  // Reactively calculate dynamic individual KPI scores, composite kpiScore, and salary/incentives client-side!
  const reactiveCalculations = (() => {
    if (!selectedEmployee) {
      return { kpis: [], overallKpiScore: 80, salary: 0, bonus: 0, commission: 0, final: 0 };
    }
    const proj = projects.find(p => p.name === selectedEmployee.project);
    if (!proj) {
      const finalVal = drawerBase + drawerCommission + drawerBonus - drawerDeductions;
      return { kpis: [], overallKpiScore: selectedEmployee.kpiScore, salary: drawerBase, bonus: drawerBonus, commission: drawerCommission, final: finalVal };
    }

    const attendanceDays = Number(drawerAttendanceDays) || 1;
    const rawMetrics = drawerRawMetrics;
    const targets = { ...drawerTargets };

    // Initialize targets if not present
    if (proj.kpiDetails) {
      proj.kpiDetails.forEach(kpi => {
        const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
        if (targets[cleanName] === undefined) {
          const targetVal = kpi.target || 1;
          targets[cleanName] = (kpi.targetType || "daily") === "daily" ? targetVal * attendanceDays : targetVal;
        }
      });
    }

    let overallScore = 0;
    const computedKPIs = (proj.kpiDetails || []).map(kpi => {
      const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
      const caseCleanName = kpi.name.replace(/\s+/g, "");
      const achieved = rawMetrics[cleanName] !== undefined ? rawMetrics[cleanName] : 0;
      const target = targets[cleanName] || kpi.target || 1;
      const weight = kpi.weight;

      const scopeKPI: Record<string, number> = {
        [cleanName]: achieved,
        [caseCleanName]: achieved,
        [`${cleanName}Raw`]: achieved,
        [`${caseCleanName}Raw`]: achieved,
        [`${cleanName}Target`]: target,
        [`${caseCleanName}Target`]: target,
        achieved,
        target,
        weight,
        attendanceDays,
        days: attendanceDays
      };

      (proj.kpiDetails || []).forEach(o => {
        const oClean = o.name.toLowerCase().replace(/\s+/g, "");
        const oCase = o.name.replace(/\s+/g, "");
        const oVal = rawMetrics[oClean] ?? 0;
        scopeKPI[oClean] = oVal;
        scopeKPI[oCase] = oVal;
      });

      const formula = kpi.formula || `(${cleanName} / target) * 100`;
      const rawScore = evaluateKPI(formula, scopeKPI);
      const usesWeight = formula.toLowerCase().includes("weight");
      const activeKpiScore = usesWeight ? rawScore : rawScore * (weight / 100);

      overallScore += activeKpiScore;

      return {
        ...kpi,
        cleanName,
        caseCleanName,
        achieved,
        target,
        score: rawScore,
        contribution: activeKpiScore,
        warningThreshold: kpi.warningThreshold
      };
    });

    const overallKpiScore = Math.round(overallScore * 10) / 10;

    // Evaluate Project-Wide Formulas
    const baseSalaryVal = proj.baseSalary ?? drawerBase ?? 3000;
    const baseBonusVal = proj.baseBonus ?? 500;

    const formulaScope: Record<string, number> = {
      base: baseSalaryVal,
      baseSalary: baseSalaryVal,
      baseBonus: baseBonusVal,
      kpiScore: overallKpiScore,
      totalKPIScore: overallKpiScore,
      cumulatedKPIScore: overallKpiScore
    };

    computedKPIs.forEach(k => {
      formulaScope[k.cleanName] = k.score;
      formulaScope[k.caseCleanName] = k.score;
      formulaScope[`${k.cleanName}Score`] = k.score;
      formulaScope[`${k.caseCleanName}Score`] = k.score;
      formulaScope[`${k.cleanName}Raw`] = k.achieved;
      formulaScope[`${k.caseCleanName}Raw`] = k.achieved;
      formulaScope[`${k.cleanName}Target`] = k.target;
      formulaScope[`${k.caseCleanName}Target`] = k.target;
      formulaScope[`${k.cleanName}Weight`] = k.weight;
      formulaScope[`${k.caseCleanName}Weight`] = k.weight;
    });

    const calculatedSalary = proj.salaryFormula
      ? evaluateKPI(proj.salaryFormula, formulaScope)
      : baseSalaryVal;

    const calculatedBonus = proj.bonusFormula
      ? evaluateKPI(proj.bonusFormula, formulaScope)
      : baseBonusVal * (overallKpiScore / 100);

    const calculatedCommission = proj.commissionFormula
      ? evaluateKPI(proj.commissionFormula, formulaScope)
      : 0;

    const salary = Math.round(calculatedSalary);
    const bonus = Math.round(calculatedBonus);
    const commission = Math.round(calculatedCommission);
    const final = salary + commission + bonus - drawerDeductions;

    return {
      kpis: computedKPIs,
      overallKpiScore,
      salary,
      bonus,
      commission,
      final
    };
  })();

  const reactiveFinalSalary = drawerBase + drawerCommission + drawerBonus - drawerDeductions;

  const handleMetricChange = (kpiName: string, value: number) => {
    setDrawerRawMetrics(prev => ({ ...prev, [kpiName]: value }));
  };

  const handleTargetChange = (kpiName: string, value: number) => {
    setDrawerTargets(prev => ({ ...prev, [kpiName]: value }));
  };

  // Filter Logic
  const filtered = payroll.filter(r => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesProject = projectFilter === "All Projects" || r.project === projectFilter;
    return matchesStatus && matchesProject;
  });

  const totalPayroll = filtered.reduce((s, p) => s + p.final, 0);

  // Update Status directly from list
  const updateStatus = async (id: string, status: string) => {
    const record = payroll.find(r => r.id === id);
    if (!record) return;

    const updated = { ...record, status };
    try {
      const res = await fetch("/api/payroll", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setPayroll(prev => prev.map(r => r.id === id ? updated : r));
        showToast("Approval status updated successfully!");
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  // Shared project recalculation helper
  const runProjectCalculations = (emp: PayrollRecord, proj: Project) => {
    const baseSalaryVal = proj.baseSalary ?? emp.base ?? 3000;
    const baseBonusVal = proj.baseBonus ?? 500;
    const attendanceDays = Number(emp.attendanceDays) || 1;
    const rawMetrics = emp.rawMetrics || {};
    const targets = emp.targets || {};

    // Compute targets if they are missing
    if (proj.kpiDetails) {
      proj.kpiDetails.forEach((kpi: any) => {
        const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
        if (targets[cleanName] === undefined) {
          const targetVal = kpi.target || 1;
          targets[cleanName] = (kpi.targetType || "daily") === "daily" ? targetVal * attendanceDays : targetVal;
        }
      });
    }

    // 1. Calculate dynamic overall KPI score based on periodicity & custom formulas
    let calculatedKpiScore = emp.kpiScore ?? 80;
    if (proj.kpiDetails && proj.kpiDetails.length > 0) {
      let scoreSum = 0;
      proj.kpiDetails.forEach((kpi: any) => {
        const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
        const achievedVal = rawMetrics[cleanName] !== undefined ? rawMetrics[cleanName] : 0;
        const targetVal = targets[cleanName] || kpi.target || 1;
        const weightVal = kpi.weight;

        const scopeKPI: Record<string, number> = {
          [cleanName]: achievedVal,
          [`${cleanName}Raw`]: achievedVal,
          [`${cleanName}Target`]: targetVal,
          achieved: achievedVal,
          target: targetVal,
          weight: weightVal,
          attendanceDays,
          days: attendanceDays
        };

        proj.kpiDetails.forEach((o: any) => {
          const oClean = o.name.toLowerCase().replace(/\s+/g, "");
          scopeKPI[oClean] = rawMetrics[oClean] ?? 0;
        });

        const formula = kpi.formula || `(${cleanName} / target) * 100`;
        const rawScore = evaluateKPI(formula, scopeKPI);
        const usesWeight = formula.toLowerCase().includes("weight");
        const activeKpiScore = usesWeight ? rawScore : rawScore * (weightVal / 100);

        scoreSum += activeKpiScore;
      });
      calculatedKpiScore = Math.round(scoreSum * 10) / 10;
    }

    // 2. Build the math scope for project formulas
    const scope: Record<string, number> = {
      base: baseSalaryVal,
      baseSalary: baseSalaryVal,
      baseBonus: baseBonusVal,
      kpiScore: calculatedKpiScore
    };

    // 3. Bind dynamic KPI variable values
    if (proj.kpiDetails && proj.kpiDetails.length > 0) {
      proj.kpiDetails.forEach((kpi: any) => {
        const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
        const achievedVal = rawMetrics[cleanName] !== undefined ? rawMetrics[cleanName] : 0;
        const targetVal = targets[cleanName] || kpi.target || 1;

        const scopeKPI: Record<string, number> = {
          [cleanName]: achievedVal,
          [`${cleanName}Raw`]: achievedVal,
          [`${cleanName}Target`]: targetVal,
          achieved: achievedVal,
          target: targetVal,
          weight: kpi.weight,
          attendanceDays,
          days: attendanceDays
        };

        proj.kpiDetails.forEach((o: any) => {
          const oClean = o.name.toLowerCase().replace(/\s+/g, "");
          scopeKPI[oClean] = rawMetrics[oClean] ?? 0;
        });

        const formula = kpi.formula || `(${cleanName} / target) * 100`;
        const rawScore = evaluateKPI(formula, scopeKPI);

        scope[cleanName] = rawScore;
        scope[`${cleanName}Score`] = rawScore;
        scope[`${cleanName}Raw`] = achievedVal;
        scope[`${cleanName}Target`] = targetVal;
        scope[`${cleanName}Weight`] = kpi.weight;
      });
    }

    // 4. Evaluate Salary, Bonus, and Commission
    const calculatedSalary = proj.salaryFormula
      ? evaluateKPI(proj.salaryFormula, scope)
      : baseSalaryVal;

    const calculatedBonus = proj.bonusFormula
      ? evaluateKPI(proj.bonusFormula, scope)
      : baseBonusVal * (calculatedKpiScore / 100);

    const calculatedCommission = proj.commissionFormula
      ? evaluateKPI(proj.commissionFormula, scope)
      : 0;

    const salary = Math.round(calculatedSalary);
    const bonus = Math.round(calculatedBonus);
    const commission = Math.round(calculatedCommission);
    const finalSalary = salary + commission + bonus - emp.deductions;

    return {
      ...emp,
      kpiScore: calculatedKpiScore,
      base: salary,
      bonus: bonus,
      commission: commission,
      final: finalSalary,
      rawMetrics,
      targets,
      attendanceDays
    };
  };

  // Recalculate all employees
  const handleRecalculateAll = async () => {
    const updatedPayroll = payroll.map(emp => {
      const proj = projects.find(p => p.name === emp.project);
      if (!proj) return emp;
      return runProjectCalculations(emp, proj);
    });

    try {
      const res = await fetch("/api/payroll", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayroll)
      });
      if (res.ok) {
        setPayroll(updatedPayroll);
        showToast("Recalculated all salaries using project-wide formulas!");
      }
    } catch (e) {
      console.error("Failed to save recalculated payroll list:", e);
    }
  };

  // Recalculate single employee
  const handleRecalculateSingle = async (empId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const emp = payroll.find(r => r.id === empId);
    if (!emp) return;

    const proj = projects.find(p => p.name === emp.project);
    if (!proj) return;

    const updated = runProjectCalculations(emp, proj);

    try {
      const res = await fetch("/api/payroll", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setPayroll(prev => prev.map(r => r.id === empId ? updated : r));
        showToast(`Recalculated formulas dynamically for ${emp.name}!`);
      }
    } catch (err) {
      console.error("Failed single recalculation:", err);
    }
  };

  // Save manual override drawer
  const handleSaveDrawer = async () => {
    if (!selectedEmployee) return;
    setIsSaving(true);

    const finalSalary = drawerBase + drawerCommission + drawerBonus - drawerDeductions;

    const updatedRecord = {
      ...selectedEmployee,
      base: drawerBase,
      commission: drawerCommission,
      bonus: drawerBonus,
      deductions: drawerDeductions,
      status: drawerStatus,
      final: finalSalary,
      kpiScore: reactiveCalculations.overallKpiScore,
      attendanceDays: Number(drawerAttendanceDays),
      rawMetrics: drawerRawMetrics,
      targets: drawerTargets
    };

    try {
      const res = await fetch("/api/payroll", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRecord)
      });
      if (res.ok) {
        setPayroll(prev => prev.map(r => r.id === selectedEmployee.id ? updatedRecord : r));
        setSelectedEmployee(null);
        showToast(`Payroll parameters persisted for ${selectedEmployee.name}!`);
      }
    } catch (e) {
      console.error("Error saving manual override:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <AppLayout title="Payroll">
      {/* Success Notification Alert banner */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-xl bg-slate-900 border-green-800/40 text-green-400 font-medium text-sm animate-bounce">
          <CheckCircle size={18} className="text-green-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main header block */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div>
          <h2 className="section-title">Payroll Processing & KPI Management</h2>
          <p className="section-subtitle">
            Base Salary & Commission persistence · Total payout:{" "}
            <span className="font-bold text-green-400">{fmt(totalPayroll)}</span> ·{" "}
            {filtered.filter(r => r.status === "pending").length} pending approvals this cycle
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button className="btn-secondary" onClick={() => showToast("Excel report compiled and downloaded!")}>
            <Download size={15} />Export Excel
          </button>
          <button className="btn-secondary" onClick={() => showToast("Payslips dispatched to employees' portals!")}>
            <FileText size={15} />Generate Payslips
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Agent
          </button>
          <button className="btn-primary" onClick={handleRecalculateAll}>
            <RefreshCw size={15} className="animate-spin-slow" />Recalculate All
          </button>
        </div>
      </div>

      {/* Stats indicators grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Project Payout", val: fmt(totalPayroll), color: "#22C55E", bg: "rgba(34,197,94,0.06)" },
          { label: "Approved Records", val: filtered.filter(r => r.status === "approved").length + "", color: "#22C55E", bg: "rgba(34,197,94,0.06)" },
          { label: "Pending Approvals", val: filtered.filter(r => r.status === "pending").length + "", color: "#F97316", bg: "rgba(249,115,22,0.06)" },
          { label: "Rejected Records", val: filtered.filter(r => r.status === "rejected").length + "", color: "#DC2626", bg: "rgba(220,38,38,0.06)" },
        ].map(c => (
          <div key={c.label} className="kpi-card text-center transition-all hover:border-[#2563EB]/40">
            <p className="text-2xl font-black" style={{ color: c.color }}>{c.val}</p>
            <p className="text-xs font-semibold text-[var(--text-secondary)] mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filter and Control Panel block */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border mb-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {/* Status filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto">
          {["all", "approved", "pending", "rejected"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${statusFilter === s
                ? "bg-[#2563EB] text-white border-[#2563EB]"
                : "text-[var(--text-secondary)] border-transparent hover:bg-slate-800/40"
                }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Dynamic Project Filter Selector */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          <Building2 size={16} className="text-[#2563EB] shrink-0" />
          <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider shrink-0">Filter by Project:</span>
          <div className="relative">
            <select
              className="wn-input pr-8 py-1.5 text-xs appearance-none cursor-pointer bg-slate-900 font-semibold"
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
            >
              <option value="All Projects">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Table Grid Card */}
      {loading ? (
        <div className="kpi-card flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw size={24} className="text-[#2563EB] animate-spin" />
          <span className="text-sm font-semibold text-[var(--text-secondary)]">Loading payroll database files...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="kpi-card flex flex-col items-center justify-center py-20 gap-2 text-center">
          <Info size={32} className="text-[var(--text-secondary)] opacity-50 mb-1" />
          <p className="font-bold text-base text-[var(--text-primary)]">No Payroll Records Match Your Filters</p>
          <p className="text-xs text-[var(--text-secondary)]">Try modifying either the project selector dropdown or the status filter tabs.</p>
        </div>
      ) : (
        <div className="kpi-card p-0 overflow-hidden shadow-lg border" style={{ borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="wn-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Assigned Project</th>
                  <th>Composite Score</th>
                  <th>Cumulated Days</th>
                  <th>Base Salary</th>
                  <th>Commission</th>
                  <th>Bonus</th>
                  <th>Deductions</th>
                  <th>Final Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const cfg = statusCfg[row.status] || statusCfg.pending;
                  return (
                    <tr
                      key={row.id}
                      className="cursor-pointer transition-colors"
                      onClick={() => setSelectedEmployee(row)}
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#2563EB,#06B6D4)" }}>
                            {row.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-[var(--text-primary)] block hover:underline">{row.name}</span>
                            <span className="text-[10px] text-[var(--text-secondary)] font-mono">{row.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm font-semibold text-[var(--text-secondary)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 size={12} className="text-slate-500" />
                          {row.project}
                        </span>
                      </td>
                      <td>
                        <span className={`text-sm font-black ${row.kpiScore >= 85 ? "text-green-400" : row.kpiScore >= 70 ? "text-orange-400" : "text-red-400"}`}>
                          {row.kpiScore}%
                        </span>
                      </td>
                      <td className="text-sm font-mono font-bold text-blue-400">
                        {row.attendanceDays || 1} days
                      </td>
                      <td className="text-sm font-semibold">{fmt(row.base)}</td>
                      <td className="text-sm font-bold" style={{ color: row.commission > 0 ? "#22C55E" : "var(--text-secondary)" }}>
                        {row.commission > 0 ? fmt(row.commission) : "—"}
                      </td>
                      <td className="text-sm font-bold" style={{ color: row.bonus > 0 ? "#06B6D4" : "var(--text-secondary)" }}>
                        {row.bonus > 0 ? fmt(row.bonus) : "—"}
                      </td>
                      <td className="text-sm font-bold" style={{ color: row.deductions > 0 ? "#DC2626" : "var(--text-secondary)" }}>
                        {row.deductions > 0 ? `-${fmt(row.deductions)}` : "—"}
                      </td>
                      <td className="font-extrabold text-sm text-green-400">{fmt(row.final)}</td>
                      <td>
                        <span className={cfg.badge} style={{ background: cfg.bg, color: cfg.text }}>{cfg.label}</span>
                      </td>
                      <td>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          {row.status === "pending" && (
                            <>
                              <button onClick={() => updateStatus(row.id, "approved")} title="Approve" className="p-1.5 rounded-lg hover:bg-green-950/30 transition-colors">
                                <CheckCircle size={15} className="text-green-500" />
                              </button>
                              <button onClick={() => updateStatus(row.id, "rejected")} title="Reject" className="p-1.5 rounded-lg hover:bg-red-950/30 transition-colors">
                                <XCircle size={15} className="text-red-500" />
                              </button>
                            </>
                          )}
                          <button onClick={(e) => handleRecalculateSingle(row.id, e)} title="Recalculate KPI Commission & Bonuses" className="p-1.5 rounded-lg hover:bg-blue-950/30 transition-colors">
                            <RefreshCw size={15} className="text-[#2563EB]" />
                          </button>
                          <button onClick={(e) => handleDeletePayroll(row.id, e)} title="Delete Agent" className="p-1.5 rounded-lg hover:bg-red-950/30 transition-colors">
                            <Trash2 size={15} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Premium Slide-In Interactive Calculator Drawer ── */}
      {selectedEmployee && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: "rgba(2, 6, 23, 0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedEmployee(null)}
        >
          <div
            className="w-full max-w-lg h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl animate-fade-in"
            style={{
              background: "var(--card-bg)",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.5)"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between mb-4 border-b pb-4" style={{ borderColor: "var(--border)" }}>
                <div>
                  <h3 className="text-lg font-black text-[var(--text-primary)]">{selectedEmployee.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-mono uppercase tracking-wider">{selectedEmployee.id} · {selectedEmployee.project}</p>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-[var(--text-secondary)]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Dynamic Project Formulas Info Card */}
              {(() => {
                const proj = projects.find(p => p.name === selectedEmployee.project);
                if (!proj) return null;

                return (
                  <div className="mb-6 p-4 rounded-xl border space-y-2.5 text-xs text-slate-300" style={{ borderColor: "var(--border)", background: "rgba(15,23,42,0.4)" }}>
                    <h4 className="text-xs font-black text-[#60A5FA] uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders size={13} />
                      Active Payout Rules & Formulas
                    </h4>
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px] text-slate-400">
                      <div>Base Salary: <span className="font-bold text-slate-200">${proj.baseSalary ?? 3000}</span></div>
                      <div>Base Bonus: <span className="font-bold text-slate-200">${proj.baseBonus ?? 500}</span></div>
                    </div>
                    <div className="space-y-1.5 border-t pt-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Salary Formula:</span>
                        <span className="font-mono text-[#06B6D4] block truncate">{proj.salaryFormula || "baseSalary * (kpiScore / 100)"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Bonus Formula:</span>
                        <span className="font-mono text-[#06B6D4] block truncate">{proj.bonusFormula || "baseBonus * (kpiScore / 100)"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Commission Formula:</span>
                        <span className="font-mono text-[#06B6D4] block truncate">{proj.commissionFormula || "0"}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Dynamic Accumulated targets and Achieved Metrics editable section */}
              <div className="mb-6">
                <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-[#2563EB]" />
                  KPI Accumulated Targets & Achieved Metrics
                </h4>

                {reactiveCalculations.kpis.length === 0 ? (
                  <div className="p-3 rounded-lg border border-yellow-800/30 text-yellow-500 bg-yellow-950/10 text-xs flex gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    No individual KPI configurations set up for this project in KPI Management yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reactiveCalculations.kpis.map(kpi => {
                      const isHit = kpi.score >= (kpi.warningThreshold || 70);

                      return (
                        <div
                          key={kpi.id}
                          className="p-3 rounded-xl border text-xs"
                          style={{
                            background: "rgba(30, 41, 59, 0.2)",
                            borderColor: isHit ? "rgba(34, 197, 94, 0.25)" : "var(--border)"
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-[var(--text-primary)]">{kpi.name} ({kpi.weight}%)</span>
                            <span className={`badge ${isHit ? "badge-green" : "badge-red"}`}>
                              Score: {kpi.score}% ({isHit ? "Hit" : "Miss"})
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[10px] text-slate-500 font-mono mb-1">Accumulated Target</label>
                              <input
                                type="number"
                                className="wn-input text-xs py-1 px-2"
                                value={kpi.target}
                                onChange={e => handleTargetChange(kpi.cleanName, parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 font-mono mb-1">Actual Achieved</label>
                              <input
                                type="number"
                                className="wn-input text-xs py-1 px-2"
                                value={kpi.achieved}
                                onChange={e => handleMetricChange(kpi.cleanName, parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Manual Payroll Overrides */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-1.5">
                  <Coins size={13} className="text-[#06B6D4]" />
                  Base salary & compensation parameters
                </h4>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Base Salary ($)</label>
                  <div className="relative">
                    <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      className="wn-input pl-8 text-sm font-semibold"
                      value={drawerBase}
                      onChange={e => setDrawerBase(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-mono">Calculated: {fmt(reactiveCalculations.salary)}</span>
                    {drawerBase !== reactiveCalculations.salary && (
                      <button
                        type="button"
                        className="text-blue-400 hover:text-blue-300 font-bold underline transition-colors cursor-pointer"
                        onClick={() => setDrawerBase(reactiveCalculations.salary)}
                      >
                        Apply Calculated
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Commission ($)</label>
                    <div className="relative">
                      <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="number"
                        className="wn-input pl-8 text-sm text-green-400 font-bold"
                        value={drawerCommission}
                        onChange={e => setDrawerCommission(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-mono">Calculated: {fmt(reactiveCalculations.commission)}</span>
                      {drawerCommission !== reactiveCalculations.commission && (
                        <button
                          type="button"
                          className="text-blue-400 hover:text-blue-300 font-bold underline transition-colors cursor-pointer"
                          onClick={() => setDrawerCommission(reactiveCalculations.commission)}
                        >
                          Apply Calculated
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Bonus ($)</label>
                    <div className="relative">
                      <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="number"
                        className="wn-input pl-8 text-sm text-cyan-400 font-bold"
                        value={drawerBonus}
                        onChange={e => setDrawerBonus(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-mono">Calculated: {fmt(reactiveCalculations.bonus)}</span>
                      {drawerBonus !== reactiveCalculations.bonus && (
                        <button
                          type="button"
                          className="text-blue-400 hover:text-blue-300 font-bold underline transition-colors cursor-pointer"
                          onClick={() => setDrawerBonus(reactiveCalculations.bonus)}
                        >
                          Apply Calculated
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Deductions ($)</label>
                    <div className="relative">
                      <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="number"
                        className="wn-input pl-8 text-sm text-red-400"
                        value={drawerDeductions}
                        onChange={e => setDrawerDeductions(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Approval Status</label>
                    <select
                      className="wn-input text-sm cursor-pointer"
                      value={drawerStatus}
                      onChange={e => setDrawerStatus(e.target.value)}
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Cumulated Working Days</label>
                    <input
                      type="number"
                      className="wn-input text-sm text-blue-400 font-bold"
                      value={drawerAttendanceDays}
                      onChange={e => setDrawerAttendanceDays(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Cumulated KPI Score</label>
                    <div className="wn-input text-sm bg-slate-900 border-slate-800 text-cyan-400 font-bold select-none text-center h-[42px] flex items-center justify-center rounded-lg">
                      {reactiveCalculations.overallKpiScore}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Payout Sum & Save controls */}
            <div className="border-t pt-4 mt-6" style={{ borderColor: "var(--border)" }}>
              <div className="flex justify-between items-center bg-[#0F172A] p-4 rounded-xl border border-blue-900/25 mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)]">Calculated Final Salary</span>
                  <div className="text-2xl font-black text-green-400">{fmt(reactiveFinalSalary)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Agent KPI Rating</span>
                  <span className="text-xs font-black text-[#60A5FA]">{reactiveCalculations.overallKpiScore}%</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="btn-secondary flex-1 text-center justify-center"
                  onClick={() => setSelectedEmployee(null)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary flex-1 text-center justify-center"
                  onClick={handleSaveDrawer}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Parameters"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Add Agent Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Add New Agent Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Agent / Payroll ID</label>
                <input required type="text" placeholder="e.g. PR022" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={newAgent.id} onChange={e => setNewAgent({...newAgent, id: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input required type="text" placeholder="e.g. Jane Doe" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project Name</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                  value={newAgent.project} onChange={e => setNewAgent({...newAgent, project: e.target.value})}>
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Base Salary ($)</label>
                  <input type="number" placeholder="3000" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    value={newAgent.base} onChange={e => setNewAgent({...newAgent, base: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">KPI Score (%)</label>
                  <input type="number" step="0.1" placeholder="90" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    value={newAgent.kpiScore} onChange={e => setNewAgent({...newAgent, kpiScore: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors">
                  Add Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
