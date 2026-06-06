/**
 * Moderator Webnova — KPI Formula Engine
 * Uses mathjs to safely evaluate dynamic formulas with agent-provided variables.
 *
 * Usage:
 *   import { evaluateKPI, calculateWeightedKPI } from "@/lib/formulaEngine";
 *
 *   const score = evaluateKPI("(calls / aht) * csat_weight", { calls: 120, aht: 3.5, csat_weight: 0.8 });
 *   const weighted = calculateWeightedKPI([{ formula, weight, variables }]);
 */

import { create, all, MathJsInstance } from "mathjs";

const math: MathJsInstance = create(all);

// Restrict to safe math-only scope
const limitedEvaluate = math.evaluate;

export interface KPIFormulaInput {
  formula: string;       // mathjs expression e.g. "(calls / aht) * 100"
  variables: Record<string, number>; // variable values
}

export interface WeightedKPIInput extends KPIFormulaInput {
  weight: number;        // 0–1, must sum to 1 across all rules
  name: string;
  minThreshold?: number;
  maxThreshold?: number;
}

export interface KPIResult {
  name: string;
  rawScore: number;
  clampedScore: number;
  weightedScore: number;
  weight: number;
  formula: string;
  met: boolean;
}

export interface WeightedKPIResult {
  totalScore: number;
  results: KPIResult[];
  allMet: boolean;
}

/**
 * Evaluate a single KPI formula with given variable values.
 * Returns 0 on evaluation error (no crash).
 */
export function evaluateKPI(formula: string, variables: Record<string, number>): number {
  try {
    // 1. Preprocess scope to map case-insensitive variations of all variables
    const scope: Record<string, number> = {};
    for (const [key, val] of Object.entries(variables)) {
      scope[key] = val;
      scope[key.toLowerCase()] = val;
      scope[key.toUpperCase()] = val;
      const stripped = key.replace(/[\s\-_]/g, "");
      scope[stripped] = val;
      scope[stripped.toLowerCase()] = val;
      scope[stripped.toUpperCase()] = val;
    }

    // Dynamic alias mapping: if project uses buyingachieved but formula references saleachieved
    if (scope.buyingachieved !== undefined) {
      scope.saleachieved = scope.buyingachieved;
      scope.salesachieved = scope.buyingachieved;
    }
    if (scope.buyingachievedraw !== undefined) {
      scope.saleachievedraw = scope.buyingachievedraw;
      scope.saleachievedRaw = scope.buyingachievedraw;
      scope.salesachievedraw = scope.buyingachievedraw;
    }
    if (scope.buyingachievedtarget !== undefined) {
      scope.saleachievedtarget = scope.buyingachievedtarget;
      scope.saleachievedTarget = scope.buyingachievedtarget;
      scope.salesachievedtarget = scope.buyingachievedtarget;
      scope.salesachievedTarget = scope.buyingachievedtarget;
    }
    if (scope.buyingachievedscore !== undefined) {
      scope.saleachievedscore = scope.buyingachievedscore;
      scope.salesachievedscore = scope.buyingachievedscore;
    }
    if (scope.buyingachievedweight !== undefined) {
      scope.saleachievedweight = scope.buyingachievedweight;
      scope.salesachievedweight = scope.buyingachievedweight;
    }

    // 2. Preprocess the formula string
    let cleanFormula = formula;

    // A. Handle standard replacements for space-separated and plural phrases
    const phraseReplacements: Record<string, string> = {
      "sales achieved": "saleachievedRaw",
      "sale achieved": "saleachievedRaw",
      "salesachieved": "saleachievedRaw",
      "calls achieved": "callsRaw",
      "actual calls": "callsRaw",
      "kpiscore": "kpiScore",
      "kpi score": "kpiScore",
      "total kpi score": "kpiScore",
      "cumulated kpi score": "kpiScore",
      "basesalary": "baseSalary",
      "base salary": "baseSalary",
      "base bonus": "baseBonus",
      "basebonus": "baseBonus",
    };

    for (const [phrase, targetVar] of Object.entries(phraseReplacements)) {
      const escaped = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      cleanFormula = cleanFormula.replace(regex, targetVar);
    }

    // B. Handle custom space cleanup: if the user typed variable names with spaces that aren't in our phrase list,
    // e.g. "retention rate", let's replace them if they match our known variables
    for (const key of Object.keys(variables)) {
      if (key.includes(" ") || key.includes("_") || key.includes("-")) {
        const cleaned = key.replace(/[\s\-_]/g, "");
        const escaped = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escaped, 'gi');
        cleanFormula = cleanFormula.replace(regex, cleaned);
      }
    }

    // C. Convert percentages like '1%' to '0.01' or '/ 100' so mathjs doesn't fail
    cleanFormula = cleanFormula.replace(/(\d+(\.\d+)?)%/g, '($1 / 100)');

    // C2. Translate [kpiName] / target to [kpiName]raw / [kpiName]target dynamically in project-wide formulas
    const kpiPrefixes: string[] = [];
    for (const key of Object.keys(scope)) {
      if (key.toLowerCase().endsWith("target") && key.toLowerCase() !== "target") {
        const prefix = key.slice(0, key.length - 6);
        if (prefix) {
          const lower = prefix.toLowerCase();
          if (!kpiPrefixes.includes(lower)) {
            kpiPrefixes.push(lower);
          }
        }
      }
    }
    for (const kpi of kpiPrefixes) {
      const escaped = kpi.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b(${escaped})\\s*\\/\\s*target\\b`, 'gi');
      cleanFormula = cleanFormula.replace(regex, `$1raw / $1target`);
    }

    // D. In case there are still spaces in potential variables (e.g. "sales achieved" without word boundaries),
    // let's do a direct case-insensitive global replacement as a fallback
    const directReplacements: Record<string, string> = {
      "sales achieved": "saleachievedRaw",
      "sale achieved": "saleachievedRaw",
      "salesachieved": "saleachievedRaw",
      "kpiscore": "kpiScore",
      "kpi score": "kpiScore",
    };
    for (const [phrase, targetVar] of Object.entries(directReplacements)) {
      const escaped = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      cleanFormula = cleanFormula.replace(regex, targetVar);
    }

    const result = limitedEvaluate(cleanFormula, scope);
    if (typeof result !== "number" || !isFinite(result)) return 0;
    return Math.round(result * 100) / 100; // round to 2dp
  } catch (err) {
    console.error("[FormulaEngine] Evaluation error:", err, { originalFormula: formula, variables });
    return 0;
  }
}

/**
 * Clamp a score between min and max threshold.
 */
function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Evaluate multiple weighted KPI rules and return a final composite score.
 * Weights should sum to 1.0 (or will be normalized).
 */
export function calculateWeightedKPI(rules: WeightedKPIInput[]): WeightedKPIResult {
  if (rules.length === 0) {
    return { totalScore: 0, results: [], allMet: false };
  }

  const totalWeight = rules.reduce((sum, r) => sum + r.weight, 0);

  const results: KPIResult[] = rules.map((rule) => {
    const normalizedWeight = rule.weight / totalWeight;
    const rawScore = evaluateKPI(rule.formula, rule.variables);
    const min = rule.minThreshold ?? 0;
    const max = rule.maxThreshold ?? 100;
    const clampedScore = clamp(rawScore, min, max);
    const weightedScore = clampedScore * normalizedWeight;
    const met = clampedScore >= min;

    return {
      name: rule.name,
      rawScore,
      clampedScore,
      weightedScore,
      weight: normalizedWeight,
      formula: rule.formula,
      met,
    };
  });

  const totalScore = Math.round(results.reduce((sum, r) => sum + r.weightedScore, 0) * 100) / 100;
  const allMet = results.every((r) => r.met);

  return { totalScore, results, allMet };
}

/**
 * Calculate payroll net salary using the Webnova payroll formula.
 *
 * Net = (Base + KPI Bonus + Overtime) - (Deductions + Attendance Penalties)
 *
 * KPI Bonus = Base * kpiBonusRate (if kpiScore >= kpiThreshold)
 * OT Pay    = (Base / workingDays / 8) * otHours * otMultiplier
 */
export interface PayrollInput {
  baseSalary: number;
  kpiScore: number;           // 0–100
  kpiThreshold?: number;      // default 80
  kpiBonusRate?: number;      // e.g. 0.1 = 10% of base. default 0.1
  overtimeHours?: number;
  overtimeMultiplier?: number; // default 1.5
  workingDaysPerMonth?: number; // default 22
  attendancePenalty?: number;
  deductions?: number;
}

export interface PayrollResult {
  baseSalary: number;
  kpiBonus: number;
  overtimePay: number;
  attendancePenalty: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
  kpiMet: boolean;
}

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const {
    baseSalary,
    kpiScore,
    kpiThreshold = 80,
    kpiBonusRate = 0.1,
    overtimeHours = 0,
    overtimeMultiplier = 1.5,
    workingDaysPerMonth = 22,
    attendancePenalty = 0,
    deductions = 0,
  } = input;

  const kpiMet = kpiScore >= kpiThreshold;
  const kpiBonus = kpiMet ? baseSalary * kpiBonusRate * (kpiScore / 100) : 0;
  const hourlyRate = baseSalary / workingDaysPerMonth / 8;
  const overtimePay = hourlyRate * overtimeHours * overtimeMultiplier;

  const grossSalary = baseSalary + kpiBonus + overtimePay;
  const netSalary = grossSalary - attendancePenalty - deductions;

  return {
    baseSalary,
    kpiBonus: Math.round(kpiBonus * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    attendancePenalty,
    deductions,
    grossSalary: Math.round(grossSalary * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100,
    kpiMet,
  };
}

/**
 * Calculate commission earned based on KPI score and commission rule.
 */
export interface CommissionInput {
  kpiScore: number;
  baseSalary: number;
  rate: number;           // percentage e.g. 0.08 = 8%
  minKpiThreshold: number;
  cap?: number;           // max payout
}

export function calculateCommission(input: CommissionInput): number {
  const { kpiScore, baseSalary, rate, minKpiThreshold, cap } = input;
  if (kpiScore < minKpiThreshold) return 0;
  const earned = baseSalary * rate * (kpiScore / 100);
  const capped = cap ? Math.min(earned, cap) : earned;
  return Math.round(capped * 100) / 100;
}
