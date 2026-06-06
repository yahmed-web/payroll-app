"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Search, Filter, Download, Eye, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, X, Trash2 } from "lucide-react";

const statusCfg: Record<string, { badge: string; label: string }> = {
  active: { badge: "badge badge-green", label: "Active" },
  warning: { badge: "badge badge-orange", label: "Warning" },
  inactive: { badge: "badge badge-red", label: "Inactive" },
};

interface Employee {
  id: string;
  name: string;
  project: string;
  team: string;
  role: string;
  kpiScore: number;
  salary: string;
  attendance: number;
  warnings: number;
  status: string;
  attendanceDays?: number;
  rawMetrics?: Record<string, number>;
  targets?: Record<string, number>;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Employee | null>(null);

  // Add Employee Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmp, setNewEmp] = useState({
    id: "",
    name: "",
    project: "",
    team: "Team A",
    role: "Agent",
    salary: "3000",
    attendance: "100",
    kpiScore: "90",
    status: "active"
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmp)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewEmp({
          id: "",
          name: "",
          project: "",
          team: "Team A",
          role: "Agent",
          salary: "3000",
          attendance: "100",
          kpiScore: "90",
          status: "active"
        });
        fetchEmployees();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to add employee");
      }
    } catch (err) {
      console.error("Error adding employee:", err);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee? This will also remove them from payroll databases.")) return;
    try {
      const res = await fetch(`/api/employees?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchEmployees();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete employee");
      }
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  };

  const filtered = employees.filter(e =>
    (e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "all" || e.status === statusFilter)
  );


  return (
    <AppLayout title="Employees">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="section-title">Employee Directory</h2>
          <p className="section-subtitle">{employees.length} total · {employees.filter(e => e.status === "active").length} active · {employees.filter(e => e.status === "warning").length} warnings</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary"><Download size={15} />Export</button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add Employee</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input className="wn-input pl-9 text-sm" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["all", "active", "warning", "inactive"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-btn text-xs font-semibold capitalize transition-all ${statusFilter === s ? "text-white" : "text-[var(--text-secondary)]"}`}
              style={statusFilter === s ? { background: "#2563EB" } : {}}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="kpi-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="wn-table">
            <thead>
              <tr>
                <th>Employee</th><th>ID</th><th>Project</th><th>Role</th>
                <th>KPI Score</th><th>Attendance</th><th>Salary</th><th>Cumulated Days</th><th>Warnings</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading employees...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-slate-400">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filtered.map(emp => {
                  const cfg = statusCfg[emp.status];
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: `hsl(${emp.id.charCodeAt(3) * 37 % 360},60%,40%)` }}>
                            {emp.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                          <span className="font-semibold text-sm text-[var(--text-primary)]">{emp.name}</span>
                        </div>
                      </td>
                      <td className="text-xs font-mono" style={{ color: "#64748B" }}>{emp.id}</td>
                      <td className="text-sm">{emp.project}</td>
                      <td><span className="badge badge-blue">{emp.role}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${emp.kpiScore}%`, background: emp.kpiScore >= 85 ? "#22C55E" : emp.kpiScore >= 70 ? "#F97316" : "#DC2626" }} />
                          </div>
                          <span className={`text-xs font-bold ${emp.kpiScore >= 85 ? "text-green-400" : emp.kpiScore >= 70 ? "text-orange-400" : "text-red-400"}`}>{emp.kpiScore}%</span>
                        </div>
                      </td>
                      <td className="text-sm">{emp.attendance}%</td>
                      <td className="font-semibold text-sm" style={{ color: "#22C55E" }}>{emp.salary}</td>
                      <td className="text-sm font-mono text-center font-bold text-blue-400">{emp.attendanceDays || 1} days</td>
                      <td>
                        {emp.warnings > 0
                          ? <span className="badge badge-orange"><AlertTriangle size={10} />{emp.warnings}</span>
                          : <span className="badge badge-green"><CheckCircle size={10} />None</span>
                        }
                      </td>
                      <td><span className={cfg.badge}>{cfg.label}</span></td>
                      <td>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setSelected(emp)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="View Profile">
                            <Eye size={15} style={{ color: "#2563EB" }} />
                          </button>
                          <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 rounded-lg hover:bg-red-950/30 transition-colors" title="Delete Employee">
                            <Trash2 size={15} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Profile Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setSelected(null)}>
          <div className="ml-auto w-full max-w-lg h-full overflow-y-auto p-6" style={{ background: "var(--card-bg)", borderLeft: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#2563EB,#06B6D4)" }}>
                {selected.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="font-bold text-lg text-[var(--text-primary)]">{selected.name}</p>
                <p className="text-sm text-[var(--text-secondary)]">{selected.id} · {selected.role}</p>
                <span className={statusCfg[selected.status].badge}>{statusCfg[selected.status].label}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "KPI Score", val: `${selected.kpiScore}%`, color: selected.kpiScore >= 85 ? "#22C55E" : selected.kpiScore >= 70 ? "#F97316" : "#DC2626" },
                { label: "Attendance", val: `${selected.attendance}%`, color: "#2563EB" },
                { label: "Warnings", val: selected.warnings.toString(), color: selected.warnings === 0 ? "#22C55E" : "#F97316" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Details */}
            {[["Project", selected.project], ["Team", selected.team], ["Monthly Salary", selected.salary], ["Cumulated Days", `${selected.attendanceDays || 1} days`], ["Payroll Status", "Approved"]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b text-sm" style={{ borderColor: "var(--border)" }}>
                <span className="text-[var(--text-secondary)]">{k}</span>
                <span className="font-medium text-[var(--text-primary)]">{v}</span>
              </div>
            ))}

            {/* KPI Bar */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">KPI Score Breakdown</p>
              {[["Calls", 87], ["Sales", 92], ["Quality", 79], ["Attendance", selected.attendance]].map(([label, val]) => (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-secondary)]">{label}</span>
                    <span className="font-semibold text-[var(--text-primary)]">{val}%</span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{ background: "var(--border)" }}>
                    <div className="h-2 rounded-full" style={{ width: `${val}%`, background: Number(val) >= 85 ? "#22C55E" : Number(val) >= 70 ? "#F97316" : "#DC2626" }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1">Edit Profile</button>
              <button className="btn-primary flex-1">View Payroll</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Add New Employee</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Employee ID</label>
                <input required type="text" placeholder="e.g. EMP011" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={newEmp.id} onChange={e => setNewEmp({...newEmp, id: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input required type="text" placeholder="e.g. John Doe" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project Name</label>
                  <input type="text" placeholder="e.g. Alpha Telecom" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    value={newEmp.project} onChange={e => setNewEmp({...newEmp, project: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Role</label>
                  <input type="text" placeholder="e.g. Agent" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Base Salary ($)</label>
                  <input type="number" placeholder="3000" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    value={newEmp.salary} onChange={e => setNewEmp({...newEmp, salary: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">KPI Score (%)</label>
                  <input type="number" step="0.1" placeholder="90" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    value={newEmp.kpiScore} onChange={e => setNewEmp({...newEmp, kpiScore: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors">
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
