import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateKPI } from "@/lib/formulaEngine";

export const dynamic = "force-dynamic";

const shouldScaleTarget = (kpi: any): boolean => {
  if ((kpi.targetType || "daily") !== "daily") return false;
  const name = kpi.name.toLowerCase();
  if (name.includes("%") || name.includes("rate") || name.includes("quality") || 
      name.includes("csat") || name.includes("aht") || name.includes("ur") || 
      name.includes("percent") || name.includes("average")) {
    return false;
  }
  if (name.includes("attendance") && kpi.target > 5) {
    return false; 
  }
  return true;
};

// Calculation helper
const runProjectCalculations = (emp: any, proj: any) => {
  const baseSalaryVal = proj.baseSalary ?? emp.base ?? 3000;
  const baseBonusVal = proj.baseBonus ?? 500;
  const attendanceDays = Number(emp.attendanceDays) || 1;
  const rawMetrics = typeof emp.rawMetrics === "string" ? JSON.parse(emp.rawMetrics) : emp.rawMetrics || {};
  const targets = typeof emp.targets === "string" ? JSON.parse(emp.targets) : emp.targets || {};

  // Compute targets if they are missing
  if (proj.kpiDetails) {
    const kpiDetailsList = typeof proj.kpiDetails === "string" ? JSON.parse(proj.kpiDetails) : proj.kpiDetails;
    kpiDetailsList.forEach((kpi: any) => {
      const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
      if (targets[cleanName] === undefined) {
        const targetVal = kpi.target || 1;
        targets[cleanName] = shouldScaleTarget(kpi) ? targetVal * attendanceDays : targetVal;
      }
    });
  }

  // 1. Calculate dynamic overall KPI score based on periodicity & custom formulas
  let calculatedKpiScore = emp.kpiScore ?? 80;
  if (proj.kpiDetails) {
    const kpiDetailsList = typeof proj.kpiDetails === "string" ? JSON.parse(proj.kpiDetails) : proj.kpiDetails;
    if (kpiDetailsList.length > 0) {
      let scoreSum = 0;
      kpiDetailsList.forEach((kpi: any) => {
        const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
        const caseCleanName = kpi.name.replace(/\s+/g, "");
        const achievedVal = rawMetrics[cleanName] !== undefined ? rawMetrics[cleanName] : 0;
        const targetVal = targets[cleanName] || kpi.target || 1;
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
          attendanceDays,
          days: attendanceDays
        };

        kpiDetailsList.forEach((o: any) => {
          const oClean = o.name.toLowerCase().replace(/\s+/g, "");
          const oCase = o.name.replace(/\s+/g, "");
          const oVal = rawMetrics[oClean] ?? 0;
          scopeKPI[oClean] = oVal;
          scopeKPI[oCase] = oVal;
        });

        const formula = kpi.formula || `(${cleanName} / target) * 100`;
        const rawScore = evaluateKPI(formula, scopeKPI);
        const formulaLower = formula.toLowerCase();
        const usesWeight = formulaLower.includes("weight") || formulaLower.includes(String(weightVal));
        const activeKpiScore = usesWeight ? rawScore : rawScore * (weightVal / 100);

        scoreSum += activeKpiScore;
      });
      calculatedKpiScore = Math.round(scoreSum * 10) / 10;
    }
  }

  // 2. Build the math scope for project formulas
  const scope: Record<string, number> = {
    base: baseSalaryVal,
    baseSalary: baseSalaryVal,
    baseBonus: baseBonusVal,
    kpiScore: calculatedKpiScore,
    totalKPIScore: calculatedKpiScore,
    cumulatedKPIScore: calculatedKpiScore
  };

  // 3. Bind dynamic KPI variable values
  if (proj.kpiDetails) {
    const kpiDetailsList = typeof proj.kpiDetails === "string" ? JSON.parse(proj.kpiDetails) : proj.kpiDetails;
    if (kpiDetailsList.length > 0) {
      kpiDetailsList.forEach((kpi: any) => {
        const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
        const caseCleanName = kpi.name.replace(/\s+/g, "");
        const achievedVal = rawMetrics[cleanName] !== undefined ? rawMetrics[cleanName] : 0;
        const targetVal = targets[cleanName] || kpi.target || 1;

        const scopeKPI: Record<string, number> = {
          [cleanName]: achievedVal,
          [caseCleanName]: achievedVal,
          [`${cleanName}Raw`]: achievedVal,
          [`${caseCleanName}Raw`]: achievedVal,
          [`${cleanName}Target`]: targetVal,
          [`${caseCleanName}Target`]: targetVal,
          achieved: achievedVal,
          target: targetVal,
          weight: kpi.weight,
          attendanceDays,
          days: attendanceDays
        };

        kpiDetailsList.forEach((o: any) => {
          const oClean = o.name.toLowerCase().replace(/\s+/g, "");
          const oCase = o.name.replace(/\s+/g, "");
          const oVal = rawMetrics[oClean] ?? 0;
          scopeKPI[oClean] = oVal;
          scopeKPI[oCase] = oVal;
        });

        const formula = kpi.formula || `(${cleanName} / target) * 100`;
        const rawScore = evaluateKPI(formula, scopeKPI);

        scope[cleanName] = rawScore;
        scope[caseCleanName] = rawScore;
        scope[`${cleanName}Score`] = rawScore;
        scope[`${caseCleanName}Score`] = rawScore;
        scope[`${cleanName}Raw`] = achievedVal;
        scope[`${caseCleanName}Raw`] = achievedVal;
        scope[`${cleanName}Target`] = targetVal;
        scope[`${caseCleanName}Target`] = targetVal;
        scope[`${cleanName}Weight`] = kpi.weight;
        scope[`${caseCleanName}Weight`] = kpi.weight;
      });
    }
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

export async function GET() {
  try {
    const payroll = await prisma.payrollRecord.findMany();
    const projects = await prisma.project.findMany();
    let changed = false;

    const synchronizedPayroll = [];

    for (const emp of payroll) {
      const proj = projects.find((p: any) => p.name === emp.project);
      if (!proj) {
        synchronizedPayroll.push({
          ...emp,
          rawMetrics: typeof emp.rawMetrics === "string" ? JSON.parse(emp.rawMetrics) : emp.rawMetrics,
          targets: typeof emp.targets === "string" ? JSON.parse(emp.targets) : emp.targets
        });
        continue;
      }

      const updated = runProjectCalculations(emp, proj);

      // Check if values actually changed to avoid redundant writes
      if (
        updated.base !== emp.base ||
        updated.bonus !== emp.bonus ||
        updated.commission !== emp.commission ||
        updated.final !== emp.final ||
        updated.kpiScore !== emp.kpiScore
      ) {
        changed = true;
        // Update database record
        await prisma.payrollRecord.update({
          where: { id: emp.id },
          data: {
            base: updated.base,
            bonus: updated.bonus,
            commission: updated.commission,
            final: updated.final,
            kpiScore: updated.kpiScore,
            targets: JSON.stringify(updated.targets),
            rawMetrics: JSON.stringify(updated.rawMetrics),
          },
        });
        synchronizedPayroll.push(updated);
      } else {
        synchronizedPayroll.push({
          ...emp,
          rawMetrics: typeof emp.rawMetrics === "string" ? JSON.parse(emp.rawMetrics) : emp.rawMetrics,
          targets: typeof emp.targets === "string" ? JSON.parse(emp.targets) : emp.targets
        });
      }
    }

    return NextResponse.json(synchronizedPayroll);
  } catch (error: any) {
    console.error("GET payroll error:", error);
    return NextResponse.json({ error: "Failed to load payroll records." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      // Batch update (useful for Recalculate All)
      for (const item of body) {
        if (!item.id) continue;
        await prisma.payrollRecord.update({
          where: { id: item.id },
          data: {
            name: item.name,
            project: item.project,
            kpiScore: item.kpiScore !== undefined ? Number(item.kpiScore) : undefined,
            base: item.base !== undefined ? Number(item.base) : undefined,
            commission: item.commission !== undefined ? Number(item.commission) : undefined,
            bonus: item.bonus !== undefined ? Number(item.bonus) : undefined,
            deductions: item.deductions !== undefined ? Number(item.deductions) : undefined,
            final: item.final !== undefined ? Number(item.final) : undefined,
            status: item.status,
            rawMetrics: item.rawMetrics !== undefined ? JSON.stringify(item.rawMetrics) : undefined,
            targets: item.targets !== undefined ? JSON.stringify(item.targets) : undefined,
            attendanceDays: item.attendanceDays !== undefined ? Number(item.attendanceDays) : undefined,
          },
        });
      }
      return NextResponse.json({ success: true, count: body.length });
    } else {
      // Single record update (useful for manual overrides in drawer)
      const { id, base, commission, bonus, deductions, final, status, project, kpiScore, rawMetrics, targets, attendanceDays } = body;

      if (!id) {
        return NextResponse.json({ error: "Employee payroll record ID is required." }, { status: 400 });
      }

      const existing = await prisma.payrollRecord.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json({ error: "Payroll record not found." }, { status: 404 });
      }

      const updated = await prisma.payrollRecord.update({
        where: { id },
        data: {
          base: base !== undefined ? Number(base) : undefined,
          commission: commission !== undefined ? Number(commission) : undefined,
          bonus: bonus !== undefined ? Number(bonus) : undefined,
          deductions: deductions !== undefined ? Number(deductions) : undefined,
          final: final !== undefined ? Number(final) : undefined,
          status: status !== undefined ? status : undefined,
          project: project !== undefined ? project : undefined,
          kpiScore: kpiScore !== undefined ? Number(kpiScore) : undefined,
          rawMetrics: rawMetrics !== undefined ? JSON.stringify(rawMetrics) : undefined,
          targets: targets !== undefined ? JSON.stringify(targets) : undefined,
          attendanceDays: attendanceDays !== undefined ? Number(attendanceDays) : undefined,
        },
      });

      const formatted = {
        ...updated,
        rawMetrics: typeof updated.rawMetrics === "string" ? JSON.parse(updated.rawMetrics) : updated.rawMetrics,
        targets: typeof updated.targets === "string" ? JSON.parse(updated.targets) : updated.targets
      };

      return NextResponse.json({ success: true, record: formatted });
    }
  } catch (error: any) {
    console.error("PUT payroll error:", error);
    return NextResponse.json({ error: "Failed to update payroll." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, project, kpiScore, base, status } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "Agent ID and Name are required." }, { status: 400 });
    }

    const existing = await prisma.payrollRecord.findUnique({
      where: { id },
    });

    if (existing) {
      return NextResponse.json({ error: `Agent with ID ${id} already exists.` }, { status: 400 });
    }

    const baseSalary = Number(base) || 2000;

    const newPay = await prisma.payrollRecord.create({
      data: {
        id,
        name,
        project: project || "Unassigned",
        kpiScore: Number(kpiScore) || 90.0,
        base: baseSalary,
        commission: 0,
        bonus: 0,
        deductions: 0,
        final: baseSalary,
        status: status || "pending",
        rawMetrics: JSON.stringify({}),
        targets: JSON.stringify({}),
        attendanceDays: 1,
      },
    });

    // Keep employees in sync!
    const existingEmp = await prisma.employee.findFirst({
      where: { name: { equals: name } },
    });

    if (!existingEmp) {
      const employees = await prisma.employee.findMany();
      let highestId = 0;
      employees.forEach((e) => {
        const match = e.id.match(/^EMP(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > highestId) highestId = num;
        }
      });
      const newEmpId = `EMP${String(highestId + 1).padStart(3, "0")}`;

      await prisma.employee.create({
        data: {
          id: newEmpId,
          name: name,
          project: project || "Unassigned",
          team: "Team A",
          role: "Agent",
          kpiScore: Number(kpiScore) || 90.0,
          salary: `$${baseSalary.toLocaleString()}`,
          attendance: 100,
          warnings: 0,
          status: "active",
          rawMetrics: JSON.stringify({}),
          targets: JSON.stringify({}),
          attendanceDays: 1,
        },
      });
    }

    const formatted = {
      ...newPay,
      rawMetrics: typeof newPay.rawMetrics === "string" ? JSON.parse(newPay.rawMetrics) : newPay.rawMetrics,
      targets: typeof newPay.targets === "string" ? JSON.parse(newPay.targets) : newPay.targets
    };

    return NextResponse.json({ success: true, record: formatted });
  } catch (error: any) {
    console.error("POST payroll error:", error);
    return NextResponse.json({ error: "Failed to create payroll record." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Payroll record ID is required." }, { status: 400 });
    }

    const existing = await prisma.payrollRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Payroll record not found." }, { status: 404 });
    }

    const payName = existing.name;

    // Delete from payroll
    await prisma.payrollRecord.delete({
      where: { id },
    });

    // Delete matching employee record
    const emp = await prisma.employee.findFirst({
      where: { name: payName },
    });

    if (emp) {
      await prisma.employee.delete({
        where: { id: emp.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE payroll error:", error);
    return NextResponse.json({ error: "Failed to delete payroll record." }, { status: 500 });
  }
}
