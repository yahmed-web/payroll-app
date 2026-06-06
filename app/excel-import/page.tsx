"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import * as XLSX from "xlsx";
import {
  Upload, FileSpreadsheet, CheckCircle, AlertTriangle,
  Download, Trash2, RefreshCw, ChevronRight, X, ArrowRight,
  Database, PlayCircle, ChevronDown
} from "lucide-react";

type MappingRow = {
  excelCol: string;
  systemField: string;
};

const systemFieldsConfig = {
  employees: [
    { value: "id", label: "Employee ID (Required)" },
    { value: "name", label: "Full Name (Required)" },
    { value: "project", label: "Project Name" },
    { value: "team", label: "Team Name" },
    { value: "role", label: "Role" },
    { value: "salary", label: "Base Salary ($)" },
    { value: "attendance", label: "Attendance (%)" },
    { value: "warnings", label: "Warnings" },
    { value: "status", label: "Status (active/warning/inactive)" },
    { value: "-- ignore --", label: "-- Ignore Column --" }
  ],
  payroll: [
    { value: "id", label: "Employee ID (Required)" },
    { value: "name", label: "Full Name (Required)" },
    { value: "project", label: "Project Name" },
    { value: "kpiScore", label: "KPI Score (%)" },
    { value: "base", label: "Base Salary ($)" },
    { value: "commission", label: "Commission ($)" },
    { value: "bonus", label: "Bonus ($)" },
    { value: "deductions", label: "Deductions ($)" },
    { value: "final", label: "Final Salary ($)" },
    { value: "status", label: "Payroll Status (pending/approved/rejected)" },
    { value: "-- ignore --", label: "-- Ignore Column --" }
  ]
};

const mapHeaderToSystemField = (header: string, systemFields: { value: string; label: string }[]) => {
  const norm = header.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  if (norm === "") return "-- ignore --";

  // Synonym mappings
  const synonyms: Record<string, string[]> = {
    id: ["id", "employeeid", "agentid", "empid", "code", "empnum", "employee"],
    name: ["name", "fullname", "agentname", "employee", "employeename", "agent", "names", "agentname"],
    project: ["project", "projectname", "campaign", "client"],
    team: ["team", "group", "department", "dept"],
    role: ["role", "position", "title", "job"],
    salary: ["salary", "basesalary", "base", "pay", "rate", "salary€", "basesalary€"],
    base: ["salary", "basesalary", "base", "pay", "rate", "salary€", "basesalary€"],
    attendance: ["attendance", "presence", "attendancedays", "days", "present"],
    warnings: ["warnings", "warning", "penalties"],
    status: ["status", "active"],
    kpiScore: ["kpi", "kpiscore", "kpi%", "score", "totalscore", "cumulatedkpiscore"],
    commission: ["commission", "commissions", "incentive", "commission€"],
    bonus: ["bonus", "bonusamount", "bonus€"],
    deductions: ["deductions", "deduction", "ded", "deductions€"],
    final: ["final", "finalsalary", "finalpay", "netpay", "net", "totalgrosspay", "grosspay", "totalgrosspay€", "grosspay€"]
  };

  // KPI Specific synonyms
  const kpiSynonyms: Record<string, string[]> = {
    calls: ["calls", "actualcalls", "callsachieved", "numberofcalls", "calltarget", "callach%"],
    saleachieved: ["saleachieved", "salesachieved", "sale", "sales", "totalbuying", "buying", "procurement", "totalcorporateprocurement", "corporateprocurement"],
    sales: ["saleachieved", "salesachieved", "sale", "sales", "totalbuying", "buying", "procurement", "totalcorporateprocurement", "corporateprocurement"],
    quality: ["quality", "qualityscore", "qa", "qascore"],
    ur: ["ur", "utilization", "utilizationrate"]
  };

  // 1. Try exact or synonym match
  for (const [sysField, aliases] of Object.entries(synonyms)) {
    if (aliases.includes(norm) && systemFields.some(f => f.value === sysField)) {
      return sysField;
    }
  }

  // 2. Try KPI Specific synonym match
  for (const [kpiField, aliases] of Object.entries(kpiSynonyms)) {
    if (aliases.includes(norm)) {
      const matchedField = systemFields.find(f => f.value.toLowerCase().replace(/[^a-z0-9]/g, "") === kpiField.toLowerCase());
      if (matchedField) return matchedField.value;
    }
  }

  // 3. Try partial matches: if the header contains the KPI/field clean name or vice-versa
  for (const f of systemFields) {
    if (f.value === "-- ignore --") continue;
    const cleanField = f.value.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (norm.includes(cleanField) || cleanField.includes(norm)) {
      return f.value;
    }
  }

  return "-- ignore --";
};

const importHistory = [
  { id: "IMP001", file: "payroll_june_2025.xlsx", rows: 124, status: "success", date: "2025-06-01 09:14" },
  { id: "IMP002", file: "attendance_may.xlsx", rows: 340, status: "success", date: "2025-05-31 16:22" },
  { id: "IMP003", file: "kpi_q1_data.xlsx", rows: 87, status: "error", date: "2025-05-15 11:05" },
  { id: "IMP004", file: "employees_master.xlsx", rows: 201, status: "success", date: "2025-04-02 08:30" },
];

export default function ExcelImportPage() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [importType, setImportType] = useState<"employees" | "payroll">("employees");

  // Project selection states
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectName, setSelectedProjectName] = useState<string>("All Projects");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
          if (data.length > 0) {
            setSelectedProjectName(data[0].name);
          }
        }
      } catch (e) {
        console.error("Failed to load projects in import:", e);
      }
    };
    loadProjects();
  }, []);

  // Excel parsing states
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<any[][]>([]);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [importResult, setImportResult] = useState<{ added: number; updated: number; total: number } | null>(null);

  // Multi-sheet workbook states
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseSheet = (worksheet: XLSX.WorkSheet) => {
    // Recalculate true worksheet dimensions by scanning all cell coordinate keys.
    // This resolves SheetJS range truncation bugs where !ref is incorrectly truncated (e.g. A1:H7) in programmatic sheets.
    let maxRow = -1;
    let maxCol = -1;
    for (const key of Object.keys(worksheet)) {
      if (key[0] === "!") continue; // Skip "!ref", "!margins", etc.
      const match = key.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const colStr = match[1];
        const rowNum = parseInt(match[2], 10) - 1; // 0-indexed row
        
        let colNum = 0;
        for (let i = 0; i < colStr.length; i++) {
          colNum = colNum * 26 + (colStr.charCodeAt(i) - 64);
        }
        colNum = colNum - 1; // 0-indexed col
        
        if (rowNum > maxRow) maxRow = rowNum;
        if (colNum > maxCol) maxCol = colNum;
      }
    }

    if (maxRow !== -1 && maxCol !== -1) {
      const startCell = "A1";
      let endColStr = "";
      let temp = maxCol;
      while (temp >= 0) {
        endColStr = String.fromCharCode((temp % 26) + 65) + endColStr;
        temp = Math.floor(temp / 26) - 1;
      }
      const endCell = `${endColStr}${maxRow + 1}`;
      worksheet["!ref"] = `${startCell}:${endCell}`;
    }

    // raw: true gets cached values/formula evaluation and defval programmatically replaces null/undefined cells with "" to be fully safe
    const rawJsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: true });
    if (rawJsonData.length === 0) {
      alert("Selected sheet is empty.");
      return;
    }

    const jsonData = rawJsonData.map((row) => {
      if (!Array.isArray(row)) return [];
      return row.map(cell => (cell === undefined || cell === null) ? "" : cell);
    });

    // Scan the first 15 rows to find the headers row dynamically
    let headerRowIndex = 0;
    let maxScore = -1;
    const keywords = [
      "name", "agent", "id", "employee", "attendance", "target", "calls",
      "sales", "salary", "commission", "bonus", "total", "arrival", "departure",
      "achieved", "project", "team", "role", "warnings", "status", "kpi"
    ];

    const maxScanRows = Math.min(jsonData.length, 15);
    for (let r = 0; r < maxScanRows; r++) {
      const row = jsonData[r] || [];
      if (!Array.isArray(row) || row.length === 0) continue;

      let score = 0;
      let nonEmpCount = 0;

      row.forEach((cell) => {
        if (cell === undefined || cell === null) return;
        const cellStr = String(cell).trim().toLowerCase();
        if (cellStr !== "") {
          nonEmpCount++;
          // Add substantial points for matching core header words
          const matchesKeyword = keywords.some(kw => cellStr.includes(kw));
          if (matchesKeyword) {
            score += 10;
          }
        }
      });

      // Tie-breaker: add minor score for non-empty cells
      score += nonEmpCount;

      if (score > maxScore && nonEmpCount > 1) {
        maxScore = score;
        headerRowIndex = r;
      }
    }

    const headers = (jsonData[headerRowIndex] as any[] || []).map(h => String(h || "").trim());
    const rawRows = jsonData.slice(headerRowIndex + 1) as any[][];

    // Filter out blank rows that only have undefined/null/empty cells
    const rows = rawRows.filter(row => {
      if (!row || !Array.isArray(row)) return false;
      return row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== "");
    });

    setParsedHeaders(headers);
    setParsedRows(rows);

    // Perform smart dynamic auto-mapping based on selected project's system fields
    const systemFields = getSystemFields();
    const autoMappings = headers
      .map((header) => {
        if (header === "") return null;
        const matched = mapHeaderToSystemField(header, systemFields);
        return { excelCol: header, systemField: matched };
      })
      .filter(m => m !== null) as MappingRow[];

    setMappings(autoMappings);
  };

  const processFile = (selectedFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);

        const firstSheetName = wb.SheetNames[0];
        setSelectedSheetName(firstSheetName);

        const worksheet = wb.Sheets[firstSheetName];
        parseSheet(worksheet);

        setFile(selectedFile);
        setStep("map");
      } catch (err) {
        console.error("Error parsing file:", err);
        alert("Failed to parse the file. Please ensure it is a valid Excel or CSV file.");
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (
      droppedFile?.name.endsWith(".xlsx") ||
      droppedFile?.name.endsWith(".xls") ||
      droppedFile?.name.endsWith(".csv")
    ) {
      processFile(droppedFile);
    } else {
      alert("Invalid file format. Please upload a .xlsx, .xls, or .csv file.");
    }
  }, [importType]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      processFile(f);
    }
  };

  const isFooterOrEmpty = (item: Record<string, any>) => {
    const name = String(item.name || "").trim().toLowerCase();
    if (name && (name.startsWith("total") || name.includes("average") || name.includes("company"))) return true;
    return false;
  };

  const getMappedPreviewRows = () => {
    const firstFive: Record<string, any>[] = [];
    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      const rowData: Record<string, any> = {};
      mappings.forEach((m) => {
        if (m.systemField === "-- ignore --") return;
        const excelIndex = parsedHeaders.indexOf(m.excelCol);
        if (excelIndex !== -1) {
          rowData[m.systemField] = row[excelIndex];
        }
      });
      
      if (!isFooterOrEmpty(rowData)) {
        firstFive.push(rowData);
      }
      if (firstFive.length >= 5) break;
    }
    return firstFive;
  };

  const getValidRowsCount = () => {
    const processedData = parsedRows.map((row) => {
      const item: Record<string, any> = {};
      mappings.forEach((m) => {
        if (m.systemField === "-- ignore --") return;
        const excelIndex = parsedHeaders.indexOf(m.excelCol);
        if (excelIndex !== -1) {
          item[m.systemField] = row[excelIndex];
        }
      });
      return item;
    });
    return processedData.filter(item => {
      if (isFooterOrEmpty(item)) return false;
      return Object.entries(item).some(([key, val]) => val !== undefined && val !== null && String(val).trim() !== "");
    }).length;
  };

  const handleImport = async () => {
    try {
      const processedData = parsedRows.map((row) => {
        const item: Record<string, any> = {};
        mappings.forEach((m) => {
          if (m.systemField === "-- ignore --") return;
          const excelIndex = parsedHeaders.indexOf(m.excelCol);
          if (excelIndex !== -1) {
            item[m.systemField] = row[excelIndex];
          }
        });
        return item;
      });

      const validData = processedData.filter(item => {
        if (isFooterOrEmpty(item)) return false;
        return Object.entries(item).some(([key, val]) => val !== undefined && val !== null && String(val).trim() !== "");
      });

      if (validData.length === 0) {
        alert("No valid records found in the Excel sheet to import.");
        return;
      }

      const res = await fetch("/api/excel-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          importType,
          projectName: selectedProjectName,
          data: validData
        })
      });

      if (res.ok) {
        const result = await res.json();
        setImportResult({
          added: result.added,
          updated: result.updated,
          total: result.total
        });
        setStep("done");
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to complete import");
      }
    } catch (err) {
      console.error("Error importing data:", err);
      alert("An error occurred during import.");
    }
  };

  const getSystemFields = () => {
    const baseFields = importType === "employees"
      ? [
          { value: "id", label: "Employee ID (Required)" },
          { value: "name", label: "Full Name (Required)" },
          { value: "project", label: "Project Name" },
          { value: "team", label: "Team Name" },
          { value: "role", label: "Role" },
          { value: "salary", label: "Base Salary ($)" },
          { value: "attendance", label: "Attendance (%)" },
          { value: "warnings", label: "Warnings" },
          { value: "status", label: "Status (active/warning/inactive)" }
        ]
      : [
          { value: "id", label: "Employee ID (Required)" },
          { value: "name", label: "Full Name (Required)" },
          { value: "project", label: "Project Name" },
          { value: "kpiScore", label: "KPI Score (%)" },
          { value: "base", label: "Base Salary ($)" },
          { value: "commission", label: "Commission ($)" },
          { value: "bonus", label: "Bonus ($)" },
          { value: "deductions", label: "Deductions ($)" },
          { value: "final", label: "Final Salary ($)" },
          { value: "status", label: "Payroll Status (pending/approved/rejected)" }
        ];

    if (selectedProjectName !== "All Projects") {
      const proj = projects.find(p => p.name === selectedProjectName);
      if (proj && proj.kpiDetails) {
        proj.kpiDetails.forEach((k: any) => {
          const cleanVal = k.name.toLowerCase().replace(/\s+/g, "");
          if (!baseFields.some(f => f.value === cleanVal)) {
            baseFields.push({
              value: cleanVal,
              label: `${k.name} Achievement (KPI target: ${k.target} ${k.targetType || "daily"})`
            });
          }
        });
      }
    }

    baseFields.push({ value: "-- ignore --", label: "-- Ignore Column --" });
    return baseFields;
  };

  const currentSystemFields = getSystemFields();
  const mappedPreview = getMappedPreviewRows();

  return (
    <AppLayout title="Excel Import / Export">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {["Upload File", "Map Columns", "Preview Data", "Import"].map((label, i) => {
          const stepKeys = ["upload", "map", "preview", "done"];
          const isActive = step === stepKeys[i];
          const isDone = stepKeys.indexOf(step) > i;
          return (
            <div key={label} className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" :
                isDone ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                "bg-[#1E293B] text-slate-400 border border-slate-800"
              }`}>
                {isDone ? <CheckCircle size={12} /> : <span className="w-4 h-4 rounded-full bg-white/15 flex items-center justify-center text-[10px]">{i+1}</span>}
                {label}
              </div>
              {i < 3 && <ArrowRight size={12} className="text-slate-600" />}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2">
          {step === "upload" && (
            <div className="space-y-6">
              {/* Configuration Panel */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Database size={15} className="text-blue-500" />
                    1. Select Destination Database
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setImportType("employees")}
                      className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                        importType === "employees"
                          ? "bg-blue-500/10 border-blue-500 text-white"
                          : "bg-slate-950/40 border-slate-850 hover:border-slate-700 text-slate-400"
                      }`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">Target</span>
                      <span className="font-bold text-sm">Employee Directory</span>
                      <span className="text-xs text-slate-500 mt-1">Register new agents & warning profiles</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportType("payroll")}
                      className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                        importType === "payroll"
                          ? "bg-blue-500/10 border-blue-500 text-white"
                          : "bg-slate-950/40 border-slate-850 hover:border-slate-700 text-slate-400"
                      }`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">Target</span>
                      <span className="font-bold text-sm">Payroll Directory</span>
                      <span className="text-xs text-slate-500 mt-1">Import base salary, KPI payouts, bonuses</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Database size={15} className="text-blue-400" />
                    2. Select Target Project
                  </h3>
                  <div className="relative">
                    <select
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer pr-10"
                      value={selectedProjectName}
                      onChange={e => setSelectedProjectName(e.target.value)}
                    >
                      <option value="All Projects">All Projects / General</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Upload Panel */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`bg-slate-900 rounded-2xl p-12 flex flex-col items-center justify-center text-center border-2 border-dashed transition-all cursor-pointer ${
                  dragOver ? "border-blue-500 bg-blue-500/5" : "border-slate-800 hover:border-blue-500/50"
                }`}
              >
                <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <Upload size={36} className="text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Drop your Excel sheet here</h3>
                <p className="text-slate-400 text-sm mb-6">Supports .xlsx, .xls, .csv up to 50MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <button
                  type="button"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </button>
                <p className="text-xs text-slate-500 mt-4">
                  Will map columns to system fields automatically based on sheet headers.
                </p>
              </div>
            </div>
          )}

          {step === "map" && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white">Map Excel Columns</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    File: <span className="text-blue-400">{file?.name}</span> — {parsedHeaders.length} columns detected
                  </p>
                </div>
                <button onClick={() => setStep("upload")} className="text-slate-400 hover:text-red-400 transition-colors">
                  <X size={16} />
                </button>
              </div>
              {sheetNames.length > 1 && (
                <div className="mb-5 p-4 rounded-xl bg-slate-950 border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold block text-left">Workbook contains multiple sheets:</span>
                    <span className="text-[10px] text-slate-500 block text-left">Select the correct tab containing your agents data</span>
                  </div>
                  <div className="relative shrink-0 w-full md:w-60">
                    <select
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer pr-10"
                      value={selectedSheetName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setSelectedSheetName(name);
                        if (workbook) {
                          const ws = workbook.Sheets[name];
                          parseSheet(ws);
                        }
                      }}
                    >
                      {sheetNames.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {mappings.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-850">
                    <div className="flex-1 flex items-center gap-2">
                      <FileSpreadsheet size={14} className="text-emerald-400 shrink-0" />
                      <span className="text-sm text-white font-medium">{m.excelCol}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-500" />
                    <div className="flex-1">
                      <select
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                        value={m.systemField}
                        onChange={(e) => {
                          const updated = [...mappings];
                          updated[idx] = { ...m, systemField: e.target.value };
                          setMappings(updated);
                        }}
                      >
                        {currentSystemFields.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button onClick={() => setStep("upload")} className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-medium rounded-xl transition-colors">Back</button>
                <button onClick={() => setStep("preview")} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
                  Preview Data →
                </button>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white">
              <h2 className="text-lg font-bold text-white mb-4">Data Preview — First 5 Rows</h2>
              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900">
                      {mappings
                        .filter(m => m.systemField !== "-- ignore --")
                        .map((m) => (
                          <th key={m.excelCol} className="text-left py-3 px-4 text-slate-400 font-semibold uppercase tracking-wider">
                            {currentSystemFields.find(f => f.value === m.systemField)?.label.split(" (")[0] || m.systemField}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mappedPreview.map((row, i) => (
                      <tr key={i} className="border-b border-slate-850 hover:bg-slate-900/40">
                        {mappings
                          .filter(m => m.systemField !== "-- ignore --")
                          .map((m) => {
                            const val = row[m.systemField];
                            return (
                              <td key={m.systemField} className="py-3 px-4 text-slate-200 font-medium">
                                {val !== undefined && val !== null ? String(val) : <span className="text-slate-600 italic">empty</span>}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-400">
                <AlertTriangle size={14} />
                Please verify if columns align correctly before confirming the database write.
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button onClick={() => setStep("map")} className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-medium rounded-xl transition-colors">Back</button>
                <button onClick={handleImport} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2">
                  <PlayCircle size={14} /> Confirm Import ({getValidRowsCount()} rows)
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 flex flex-col items-center text-center text-white">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Import Successful!</h3>
              <p className="text-slate-400 mb-6 max-w-md">
                Successfully processed and imported the Excel records into the system.
              </p>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 mb-8 w-full max-w-sm flex justify-around text-center">
                <div>
                  <span className="block text-2xl font-extrabold text-emerald-400">{importResult?.added ?? 0}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Added</span>
                </div>
                <div className="border-l border-slate-850 h-10 self-center" />
                <div>
                  <span className="block text-2xl font-extrabold text-blue-400">{importResult?.updated ?? 0}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Updated</span>
                </div>
                <div className="border-l border-slate-850 h-10 self-center" />
                <div>
                  <span className="block text-2xl font-extrabold text-white">{importResult?.total ?? 0}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total Records</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("upload");
                    setFile(null);
                    setParsedRows([]);
                    setParsedHeaders([]);
                    setMappings([]);
                    setWorkbook(null);
                    setSheetNames([]);
                    setSelectedSheetName("");
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Import Another
                </button>
                <a
                  href={importType === "employees" ? "/employees" : "/payroll"}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2"
                >
                  View Database
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: History + Export Templates */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white">
            <h3 className="text-sm font-semibold text-white mb-4">Import History</h3>
            <div className="space-y-3">
              {importHistory.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <div className={`mt-0.5 ${item.status === "success" ? "text-emerald-400" : "text-red-400"}`}>
                    {item.status === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-xs font-semibold text-slate-200 truncate">{item.file}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.rows} rows · {item.date}</div>
                  </div>
                  <button className="text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white">
            <h3 className="text-sm font-semibold text-white mb-4">Export Templates</h3>
            <div className="space-y-2">
              {["Payroll Template", "Attendance Template", "KPI Template", "Employee Master"].map((t) => (
                <button key={t} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/40 hover:bg-slate-950 border border-slate-850 hover:border-slate-700 transition-colors text-sm text-left text-slate-200">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={14} className="text-emerald-400" />
                    {t}
                  </div>
                  <Download size={13} className="text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Dynamic Scraper Debug Panel */}
      {file && (
        <details className="mt-8 bg-slate-900 border border-slate-800 p-5 rounded-2xl text-left text-xs text-slate-400">
          <summary className="cursor-pointer font-semibold text-slate-200 select-none">
            🔍 Excel Scraper Debug Logs (Click to expand)
          </summary>
          <div className="mt-4 space-y-3 font-mono">
            <div>
              <span className="text-blue-400">File Name:</span> {file.name}
            </div>
            <div>
              <span className="text-blue-400">Database Target:</span> {importType}
            </div>
            <div>
              <span className="text-blue-400">Target Project:</span> {selectedProjectName}
            </div>
            <div>
              <span className="text-blue-400">Workbook Sheet Names ({sheetNames.length}):</span> {JSON.stringify(sheetNames)}
            </div>
            <div>
              <span className="text-blue-400">Selected Sheet:</span> "{selectedSheetName}"
            </div>
            <div>
              <span className="text-blue-400">Sheet Bounds (!ref):</span> {workbook?.Sheets[selectedSheetName]?.['!ref'] || "none"}
            </div>
            <div>
              <span className="text-blue-400">Total Worksheet Keys Count:</span> {workbook ? Object.keys(workbook.Sheets[selectedSheetName] || {}).length : 0}
            </div>
            <div>
              <span className="text-blue-400">Non-Empty Data Cells Count:</span> {workbook ? Object.keys(workbook.Sheets[selectedSheetName] || {}).filter(k => k[0] !== '!').length : 0}
            </div>
            <div>
              <span className="text-blue-400">Scanned Column Headers ({parsedHeaders.length}):</span>
              <pre className="mt-1 bg-slate-950 p-2.5 rounded border border-slate-850 overflow-x-auto text-[10px]">
                {JSON.stringify(parsedHeaders, null, 2)}
              </pre>
            </div>
            <div>
              <span className="text-blue-400">Auto-Mapped Column Bindings ({mappings.length}):</span>
              <pre className="mt-1 bg-slate-950 p-2.5 rounded border border-slate-850 overflow-x-auto text-[10px]">
                {JSON.stringify(mappings, null, 2)}
              </pre>
            </div>
            <div>
              <span className="text-blue-400">Parsed Agent Data Rows ({parsedRows.length}):</span>
              <pre className="mt-1 bg-slate-950 p-2.5 rounded border border-slate-850 overflow-x-auto text-[10px]">
                {JSON.stringify(parsedRows.slice(0, 3), null, 2)}
              </pre>
            </div>
          </div>
        </details>
      )}
    </AppLayout>
  );
}
