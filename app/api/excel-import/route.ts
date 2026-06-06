import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateKPI } from "@/lib/formulaEngine";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const parseNumericValue = (val: any): number => {
  if (val === undefined || val === null) return 0;
  const str = String(val).trim().toLowerCase();
  if (str === "present" || str === "1" || str === "yes" || str === "true") return 1;
  if (str === "absent" || str === "0" || str === "no" || str === "false") return 0;
  
  let cleanStr = str.replace(/[^0-9.,-]/g, ""); // keep only digits, dots, commas, minus
  if (cleanStr.includes(",") && cleanStr.includes(".")) {
    // European style: 25.181,00 -> remove dots, replace comma with dot
    cleanStr = cleanStr.replace(/\./g, "").replace(/,/g, ".");
  } else if (cleanStr.includes(",")) {
    const parts = cleanStr.split(",");
    if (parts[parts.length - 1].length === 3) {
      // Thousands separator: "25,181" -> "25181"
      cleanStr = cleanStr.replace(/,/g, "");
    } else {
      // Decimal: "25,18" -> "25.18"
      cleanStr = cleanStr.replace(/,/g, ".");
    }
  } else if (cleanStr.includes(".")) {
    const parts = cleanStr.split(".");
    if (parts[parts.length - 1].length === 3) {
      // Thousands separator: "58.500" -> "58500"
      cleanStr = cleanStr.replace(/\./g, "");
    }
  }
  
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};

const isPresent = (val: any): boolean => {
  if (val === undefined || val === null) return true; // Default to true if not mapped/provided
  const str = String(val).trim().toLowerCase();
  if (str === "present" || str === "1" || str === "yes" || str === "true") return true;
  if (str === "absent" || str === "0" || str === "no" || str === "false") return false;
  return true; // Default to true for other values if not explicitly absent
};

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

function loadEnvIfNeeded() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    try {
      const envPath = path.join(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        const lines = content.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx !== -1) {
            const key = trimmed.substring(0, eqIdx).trim();
            let val = trimmed.substring(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.substring(1, val.length - 1);
            }
            process.env[key] = val;
          }
        }
      }
    } catch (e) {
      console.error("Failed to manually load .env file:", e);
    }
  }
}

async function sendSmtpWarningEmail(projectName: string, underperformingAgents: any[]) {
  if (underperformingAgents.length === 0) return false;
  
  loadEnvIfNeeded();
  
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn("[SMTP Alert PREVIEW] SMTP parameters are not fully set in .env. Warning email was not sent.");
    console.log(`[Developer Preview] ${underperformingAgents.length} agents below warning threshold:`, underperformingAgents.map(a => `${a.name} (${a.kpiScore}%)`));
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: parseInt(smtpPort, 10) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const subject = underperformingAgents.length === 1
      ? `⚠️ [KPI Alert] Agent Performance Warning: ${underperformingAgents[0].name} (${underperformingAgents[0].project})`
      : `⚠️ [KPI Alert] Consolidated Underperformance Report: ${underperformingAgents.length} Agents below Warning Threshold`;

    const agentsListHtml = underperformingAgents.map(agent => {
      const metricsList = Object.entries(agent.rawMetrics || {}).map(([key, val]) => {
        const targetVal = agent.targets?.[key] || 100;
        return `
          <li style="margin: 6px 0; font-size: 13px; color: #475569;">
            <strong style="text-transform: capitalize; color: #1E293B;">${key}:</strong> 
            ${val} achieved / target of ${targetVal}
          </li>
        `;
      }).join("");

      const failedKpisHtml = agent.failedKpis && agent.failedKpis.length > 0
        ? `
          <div style="margin-top: 10px; background-color: #FEF2F2; border: 1px solid #FEE2E2; padding: 10px; border-radius: 8px;">
            <strong style="font-size: 12px; color: #DC2626; display: block; margin-bottom: 4px;">KPI Targets Missed:</strong>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #991B1B;">
              ${agent.failedKpis.map((fk: string) => `<li>${fk}</li>`).join("")}
            </ul>
          </div>
        `
        : "";

      return `
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px; margin-bottom: 20px; font-family: sans-serif; text-align: left;">
          <div style="border-bottom: 1px solid #E2E8F0; padding-bottom: 12px; margin-bottom: 12px;">
            <h3 style="margin: 0; color: #0F172A; font-size: 16px; font-weight: bold;">${agent.name}</h3>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748B;">ID: ${agent.id} | Role: ${agent.role}</p>
            <div style="margin-top: 8px;">
              <span style="display: inline-block; background-color: #FEF3C7; color: #D97706; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 9999px; text-transform: uppercase;">
                Warning count: ${agent.warnings}
              </span>
            </div>
          </div>
          
          <div style="margin-bottom: 14px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 13px; color: #64748B; padding: 4px 0;">Project/Team:</td>
                <td style="font-size: 13px; color: #0F172A; font-weight: 600; padding: 4px 0; text-align: right;">${agent.project} / ${agent.team}</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #64748B; padding: 4px 0;">Overall KPI Score:</td>
                <td style="font-size: 13px; color: #EF4444; font-weight: bold; padding: 4px 0; text-align: right;">${agent.kpiScore}%</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #64748B; padding: 4px 0;">Warning Threshold:</td>
                <td style="font-size: 13px; color: #0F172A; font-weight: 600; padding: 4px 0; text-align: right;">${agent.warningThreshold}%</td>
              </tr>
            </table>
          </div>
          
          <div>
            <h4 style="margin: 0 0 8px 0; color: #334155; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">Raw Metrics & Targets:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${metricsList || '<li style="font-size: 13px; color: #64748B; font-style: italic;">No specific KPI metrics calculated</li>'}
            </ul>
          </div>
          
          ${failedKpisHtml}
        </div>
      `;
    }).join("");

    const htmlBody = `
      <div style="background-color: #F1F5F9; padding: 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
        <div style="background-color: #FFFFFF; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #1E293B, #0F172A); padding: 30px 25px; text-align: center; border-bottom: 3px solid #F59E0B;">
            <div style="background: linear-gradient(135deg, #F59E0B, #D97706); color: white; display: inline-block; width: 44px; height: 44px; line-height: 44px; font-weight: 800; border-radius: 12px; font-size: 24px; text-align: center; margin-bottom: 12px; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);">⚠️</div>
            <h1 style="color: #FFFFFF; font-size: 20px; font-weight: bold; margin: 0; letter-spacing: -0.025em;">Performance Warning Alert</h1>
            <p style="color: #94A3B8; font-size: 13px; margin: 6px 0 0 0;">Webnova Telecom Workforce Platform</p>
          </div>
          
          <div style="padding: 25px; text-align: left;">
            <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
              Hello Operations Team,
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">
              During the recent Excel KPI import for project <strong style="color: #0F172A;">${projectName}</strong>, the system identified <strong>${underperformingAgents.length} agent(s)</strong> who fell below their target KPI performance limits.
            </p>
            
            <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 8px; margin: 20px 0 25px 0;">
              <p style="margin: 0; font-size: 13px; color: #B45309; line-height: 1.5; font-weight: 600;">
                Action Required: HR Policies and standard supervisory interventions are recommended. Warning letters will be automatically generated inside their profiles.
              </p>
            </div>

            <div style="margin-bottom: 25px;">
              ${agentsListHtml}
            </div>
            
            <div style="text-align: center; margin: 30px 0 10px 0;">
              <a href="http://localhost:3000/employees" style="background: linear-gradient(135deg, #1E293B, #0F172A); color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(15,23,42,0.25);">Manage Employee Directory</a>
            </div>
          </div>
          
          <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px; text-align: center;">
            <p style="color: #94A3B8; font-size: 11px; margin: 0; line-height: 1.5;">
              This notification was generated automatically by Webnova SMTP Mailer because direct alert integrations are active.<br />
              Sent to Administrator Inbox: <span style="color: #64748B;">${smtpUser}</span>
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Webnova KPI Alerts" <${smtpUser}>`,
      to: smtpUser,
      subject: subject,
      html: htmlBody,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SMTP Alert] Direct KPI Warning Email successfully sent to ${smtpUser} for ${underperformingAgents.length} agents.`);
    return true;
  } catch (mailError) {
    console.error("[SMTP Alert ERROR] Nodemailer failed to send warning email:", mailError);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { importType, projectName, data } = await request.json();

    if (!importType || !Array.isArray(data)) {
      return NextResponse.json({ error: "Import type and data array are required." }, { status: 400 });
    }

    // Load active projects to get custom formulas and targets
    const projects = await prisma.project.findMany();
    const activeProject = projects.find((p: any) => p.name === projectName);

    if (importType === "employees") {
      const employees = (await prisma.employee.findMany()) as any[];
      let addedCount = 0;
      let updatedCount = 0;
      const underperformingAgents: any[] = [];

      const activeProjectEmployees = employees.filter((e: any) => e.project === projectName);

      data.forEach((newRecord: any, idx: number) => {
        let isNew = true;
        let index = -1;

        // Try mapping by ID first
        if (newRecord.id) {
          index = employees.findIndex((e: any) => e.id === newRecord.id);
        } else if (newRecord.name) {
          // Fallback: match by employee name (case-insensitive)
          index = employees.findIndex((e: any) => e.name.toLowerCase() === newRecord.name.toLowerCase());
          if (index !== -1) {
            newRecord.id = employees[index].id;
          }
        }

        // Sequential fallback mapping if name/ID both failed to match
        if (index === -1 && projectName && projectName !== "All Projects" && activeProjectEmployees[idx]) {
          const matchedDbEmp = activeProjectEmployees[idx];
          index = employees.findIndex((e: any) => e.id === matchedDbEmp.id);
          if (index !== -1) {
            newRecord.id = employees[index].id;
            if (!newRecord.name) {
              newRecord.name = employees[index].name;
            }
          }
        }

        // Generate sequential EMP ID if still no ID
        if (!newRecord.id) {
          let highestId = 0;
          employees.forEach((e: any) => {
            const match = e.id.match(/^EMP(\d+)$/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > highestId) highestId = num;
            }
          });
          newRecord.id = `EMP${String(highestId + 1).padStart(3, "0")}`;
        }

        let emp: any = {};
        if (index !== -1) {
          emp = employees[index];
          isNew = false;
        }

        // 1. Sum raw metrics for cumulative updates
        const rawMetrics: Record<string, any> = { ...(typeof emp.rawMetrics === "string" ? JSON.parse(emp.rawMetrics) : emp.rawMetrics || {}) };
        const prevDays = Object.keys(rawMetrics).length === 0 ? 0 : (Number(emp.attendanceDays) || 0);
        const newDays = isPresent(newRecord.attendance) ? 1 : 0;
        const totalDays = prevDays + newDays;

        if (activeProject && activeProject.kpiDetails) {
          const kpiDetailsList = typeof activeProject.kpiDetails === "string" ? JSON.parse(activeProject.kpiDetails) : activeProject.kpiDetails;
          kpiDetailsList.forEach((kpi: any) => {
            const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
            const newValue = parseNumericValue(newRecord[cleanName]);
            const prevValue = Number(rawMetrics[cleanName]) || 0;
            rawMetrics[cleanName] = prevValue + newValue;
          });
        }

        // Build accumulated targets
        const targets: Record<string, any> = { ...(typeof emp.targets === "string" ? JSON.parse(emp.targets) : emp.targets || {}) };
        if (activeProject && activeProject.kpiDetails) {
          const kpiDetailsList = typeof activeProject.kpiDetails === "string" ? JSON.parse(activeProject.kpiDetails) : activeProject.kpiDetails;
          kpiDetailsList.forEach((kpi: any) => {
            const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
            const targetVal = kpi.target || 1;
            const cumulativeTarget = shouldScaleTarget(kpi) ? targetVal * totalDays : targetVal;
            targets[cleanName] = cumulativeTarget;
          });
        }

        // 2. Calculate dynamic overall KPI score based on periodicity & custom formulas
        let calculatedKpiScore = 0;
        let warningThreshold = 75;
        let hasUnderperformingKpi = false;
        const failedKpis: string[] = [];

        if (activeProject && activeProject.kpiDetails) {
          let scoreSum = 0;
          const kpiDetailsList = typeof activeProject.kpiDetails === "string" ? JSON.parse(activeProject.kpiDetails) : activeProject.kpiDetails;
          kpiDetailsList.forEach((kpi: any) => {
            const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
            const caseCleanName = kpi.name.replace(/\s+/g, "");
            const achievedVal = rawMetrics[cleanName] !== undefined ? rawMetrics[cleanName] : 0;
            const targetVal = targets[cleanName] || kpi.target || 1;
            const weightVal = kpi.weight;

            const scope: Record<string, number> = {
              [cleanName]: achievedVal,
              [caseCleanName]: achievedVal,
              [`${cleanName}Raw`]: achievedVal,
              [`${caseCleanName}Raw`]: achievedVal,
              [`${cleanName}Target`]: targetVal,
              [`${caseCleanName}Target`]: targetVal,
              achieved: achievedVal,
              target: targetVal,
              weight: weightVal,
              attendanceDays: totalDays,
              days: totalDays
            };

            // Inject all raw metrics for references in formulas
            kpiDetailsList.forEach((otherKpi: any) => {
              const oClean = otherKpi.name.toLowerCase().replace(/\s+/g, "");
              const oCase = otherKpi.name.replace(/\s+/g, "");
              const oVal = rawMetrics[oClean] !== undefined ? rawMetrics[oClean] : 0;
              const oTarget = targets[oClean] || otherKpi.target || 1;

              scope[oClean] = oVal;
              scope[oCase] = oVal;
              scope[`${oClean}Raw`] = oVal;
              scope[`${oCase}Raw`] = oVal;
              scope[`${oClean}Target`] = oTarget;
              scope[`${oCase}Target`] = oTarget;
            });

            const formula = kpi.formula || `(${cleanName} / target) * 100`;
            const rawScore = evaluateKPI(formula, scope);
            const formulaLower = formula.toLowerCase();
            const usesWeight = formulaLower.includes("weight") || formulaLower.includes(String(weightVal));
            const activeKpiScore = usesWeight ? rawScore : rawScore * (weightVal / 100);

            scoreSum += activeKpiScore;
            warningThreshold = kpi.warningThreshold || warningThreshold;

            const kpiThreshold = kpi.warningThreshold !== undefined ? kpi.warningThreshold : 70;
            if (kpiThreshold > 0 && rawScore < kpiThreshold) {
              hasUnderperformingKpi = true;
              failedKpis.push(`${kpi.name}: Achieved ${Math.round(rawScore)}% (Warning Limit: ${kpiThreshold}%)`);
            }
          });
          calculatedKpiScore = Math.round(scoreSum * 10) / 10;
        } else {
          calculatedKpiScore = parseNumericValue(newRecord.kpiScore) || Number(emp.kpiScore) || 90.0;
        }

        // 3. Build math formulas scope and evaluate payroll salary/commission
        const baseSalaryVal = (activeProject?.baseSalary ?? parseNumericValue(newRecord.salary || emp.salary)) || 2000;
        const baseBonusVal = activeProject?.baseBonus ?? 500;

        const scope: Record<string, number> = {
          base: baseSalaryVal,
          baseSalary: baseSalaryVal,
          baseBonus: baseBonusVal,
          kpiScore: calculatedKpiScore,
          totalKPIScore: calculatedKpiScore,
          cumulatedKPIScore: calculatedKpiScore
        };

        // Bind KPI variables inside the formula scope
        if (activeProject && activeProject.kpiDetails) {
          const kpiDetailsList = typeof activeProject.kpiDetails === "string" ? JSON.parse(activeProject.kpiDetails) : activeProject.kpiDetails;
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
              attendanceDays: totalDays,
              days: totalDays
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
          });
        }

        const computedSalary = activeProject?.salaryFormula
          ? evaluateKPI(activeProject.salaryFormula, scope)
          : baseSalaryVal * (calculatedKpiScore / 100);

        const computedBonus = activeProject?.bonusFormula
          ? evaluateKPI(activeProject.bonusFormula, scope)
          : baseBonusVal * (calculatedKpiScore / 100);

        const computedCommission = activeProject?.commissionFormula
          ? evaluateKPI(activeProject.commissionFormula, scope)
          : 0;

        const deductions = parseNumericValue(newRecord.deductions) || Number(emp.deductions) || 0;
        const finalSalary = Math.round(computedSalary + computedBonus + computedCommission - deductions);

        const isUnderperforming = (calculatedKpiScore < warningThreshold) || hasUnderperformingKpi;
        const warningCount = isUnderperforming ? (Number(emp.warnings) || 0) + 1 : Number(emp.warnings) || 0;
        const finalStatus = isUnderperforming ? "warning" : (newRecord.status || emp.status || "active");

        const computedAttendance = (activeProject && rawMetrics["attendance"] !== undefined && targets["attendance"])
          ? Math.min(100, Math.round((rawMetrics["attendance"] / targets["attendance"]) * 100))
          : (isPresent(newRecord.attendance) ? 100 : Number(emp.attendance) || 95);

        const updatedEmp = {
          id: newRecord.id,
          name: newRecord.name || emp.name || "Unknown Agent",
          project: (projectName && projectName !== "All Projects") ? projectName : (newRecord.project || emp.project || "Unassigned"),
          team: newRecord.team || emp.team || "Team A",
          role: newRecord.role || emp.role || "Agent",
          kpiScore: calculatedKpiScore,
          salary: `$${finalSalary.toLocaleString()}`,
          attendance: computedAttendance,
          warnings: warningCount,
          status: finalStatus,
          rawMetrics,
          targets,
          attendanceDays: totalDays
        };

        if (isUnderperforming) {
          underperformingAgents.push({
            id: updatedEmp.id,
            name: updatedEmp.name,
            project: updatedEmp.project,
            team: updatedEmp.team,
            role: updatedEmp.role,
            kpiScore: calculatedKpiScore,
            warningThreshold: warningThreshold,
            warnings: warningCount,
            rawMetrics: rawMetrics,
            targets: targets,
            attendanceDays: totalDays,
            failedKpis: failedKpis
          });
        }

        if (isNew) {
          employees.push(updatedEmp);
          addedCount++;
        } else {
          employees[index] = updatedEmp;
          updatedCount++;
        }
      });

      // Also automatically keep payroll in sync!
      const payroll = (await prisma.payrollRecord.findMany()) as any[];

      employees.forEach((emp: any) => {
        const payIndex = payroll.findIndex((p: any) => p.name.toLowerCase() === emp.name.toLowerCase());
        if (payIndex === -1) {
          let highestId = 0;
          payroll.forEach((p: any) => {
            const match = p.id.match(/^PR(\d+)$/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > highestId) highestId = num;
            }
          });
          const newPrId = `PR${String(highestId + 1).padStart(3, "0")}`;

          payroll.push({
            id: newPrId,
            name: emp.name,
            project: emp.project,
            kpiScore: emp.kpiScore || 0,
            base: emp.salary ? parseNumericValue(emp.salary) : 2000,
            commission: 0,
            bonus: 0,
            deductions: 0,
            final: emp.salary ? parseNumericValue(emp.salary) : 2000,
            status: "pending",
            rawMetrics: emp.rawMetrics || {},
            targets: emp.targets || {},
            attendanceDays: emp.attendanceDays || 0
          });
        } else {
          const existing = payroll[payIndex];
          existing.project = emp.project;
          existing.base = emp.salary ? parseNumericValue(emp.salary) : 2000;
        }
      });

      // Bulk write employees
      for (const emp of employees) {
        await prisma.employee.upsert({
          where: { id: emp.id },
          update: {
            name: emp.name,
            project: emp.project,
            team: emp.team,
            role: emp.role,
            kpiScore: emp.kpiScore,
            salary: emp.salary,
            attendance: emp.attendance,
            warnings: emp.warnings,
            status: emp.status,
            rawMetrics: emp.rawMetrics,
            targets: emp.targets,
            attendanceDays: emp.attendanceDays,
          },
          create: {
            id: emp.id,
            name: emp.name,
            project: emp.project,
            team: emp.team,
            role: emp.role,
            kpiScore: emp.kpiScore,
            salary: emp.salary,
            attendance: emp.attendance,
            warnings: emp.warnings,
            status: emp.status,
            rawMetrics: emp.rawMetrics,
            targets: emp.targets,
            attendanceDays: emp.attendanceDays,
          }
        });
      }

      // Bulk write payroll
      for (const pay of payroll) {
        await prisma.payrollRecord.upsert({
          where: { id: pay.id },
          update: {
            name: pay.name,
            project: pay.project,
            kpiScore: pay.kpiScore,
            base: pay.base,
            commission: pay.commission,
            bonus: pay.bonus,
            deductions: pay.deductions,
            final: pay.final,
            status: pay.status,
            rawMetrics: pay.rawMetrics,
            targets: pay.targets,
            attendanceDays: pay.attendanceDays,
          },
          create: {
            id: pay.id,
            name: pay.name,
            project: pay.project,
            kpiScore: pay.kpiScore,
            base: pay.base,
            commission: pay.commission,
            bonus: pay.bonus,
            deductions: pay.deductions,
            final: pay.final,
            status: pay.status,
            rawMetrics: pay.rawMetrics,
            targets: pay.targets,
            attendanceDays: pay.attendanceDays,
          }
        });
      }

      const emailSent = await sendSmtpWarningEmail(projectName, underperformingAgents);

      return NextResponse.json({
        success: true,
        added: addedCount,
        updated: updatedCount,
        total: employees.length,
        warningsTriggered: underperformingAgents.length,
        emailSent
      });

    } else if (importType === "payroll") {
      const payroll = (await prisma.payrollRecord.findMany()) as any[];
      let addedCount = 0;
      let updatedCount = 0;
      const underperformingAgents: any[] = [];

      const employees = (await prisma.employee.findMany()) as any[];
      const activeProjectEmployees = employees.filter((e: any) => e.project === projectName);
      const activeProjectPayroll = payroll.filter((p: any) => p.project === projectName);

      data.forEach((newRecord: any, idx: number) => {
        let isNew = true;
        let index = -1;

        if (newRecord.id) {
          index = payroll.findIndex((p: any) => p.id === newRecord.id);
        } else if (newRecord.name) {
          index = payroll.findIndex((p: any) => p.name.toLowerCase() === newRecord.name.toLowerCase());
          if (index !== -1) {
            newRecord.id = payroll[index].id;
          }
        }

        if (index === -1 && projectName && projectName !== "All Projects") {
          if (activeProjectPayroll[idx]) {
            const matchedDbPay = activeProjectPayroll[idx];
            index = payroll.findIndex((p: any) => p.id === matchedDbPay.id);
            if (index !== -1) {
              newRecord.id = payroll[index].id;
              if (!newRecord.name) {
                newRecord.name = payroll[index].name;
              }
            }
          } else if (activeProjectEmployees[idx]) {
            const matchedDbEmp = activeProjectEmployees[idx];
            index = payroll.findIndex((p: any) => p.name.toLowerCase() === matchedDbEmp.name.toLowerCase());
            if (index === -1) {
              let highestId = 0;
              payroll.forEach((p: any) => {
                const match = p.id.match(/^PR(\d+)$/i);
                if (match) {
                  const num = parseInt(match[1], 10);
                  if (num > highestId) highestId = num;
                }
              });
              const newPrId = `PR${String(highestId + 1).padStart(3, "0")}`;
              const newPay = {
                id: newPrId,
                name: matchedDbEmp.name,
                project: projectName,
                kpiScore: 0,
                base: matchedDbEmp.salary ? parseNumericValue(matchedDbEmp.salary) : 2000,
                commission: 0,
                bonus: 0,
                deductions: 0,
                final: matchedDbEmp.salary ? parseNumericValue(matchedDbEmp.salary) : 2000,
                status: "pending",
                rawMetrics: {},
                targets: {},
                attendanceDays: 0
              };
              payroll.push(newPay);
              index = payroll.length - 1;
              isNew = true;
            } else {
              newRecord.id = payroll[index].id;
              if (!newRecord.name) {
                newRecord.name = payroll[index].name;
              }
            }
          }
        }

        if (!newRecord.id) {
          let highestId = 0;
          payroll.forEach((p: any) => {
            const match = p.id.match(/^PR(\d+)$/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > highestId) highestId = num;
            }
          });
          newRecord.id = `PR${String(highestId + 1).padStart(3, "0")}`;
        }

        let pay: any = {};
        if (index !== -1) {
          pay = payroll[index];
          isNew = false;
        }

        const rawMetrics: Record<string, any> = { ...(typeof pay.rawMetrics === "string" ? JSON.parse(pay.rawMetrics) : pay.rawMetrics || {}) };
        const prevDays = Object.keys(rawMetrics).length === 0 ? 0 : (Number(pay.attendanceDays) || 0);
        const newDays = isPresent(newRecord.attendance) ? 1 : 0;
        const totalDays = prevDays + newDays;

        if (activeProject && activeProject.kpiDetails) {
          const kpiDetailsList = typeof activeProject.kpiDetails === "string" ? JSON.parse(activeProject.kpiDetails) : activeProject.kpiDetails;
          kpiDetailsList.forEach((kpi: any) => {
            const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
            const newValue = parseNumericValue(newRecord[cleanName]);
            const prevValue = Number(rawMetrics[cleanName]) || 0;
            rawMetrics[cleanName] = prevValue + newValue;
          });
        }

        const targets: Record<string, any> = { ...(typeof pay.targets === "string" ? JSON.parse(pay.targets) : pay.targets || {}) };
        if (activeProject && activeProject.kpiDetails) {
          const kpiDetailsList = typeof activeProject.kpiDetails === "string" ? JSON.parse(activeProject.kpiDetails) : activeProject.kpiDetails;
          kpiDetailsList.forEach((kpi: any) => {
            const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
            const targetVal = kpi.target || 1;
            const cumulativeTarget = shouldScaleTarget(kpi) ? targetVal * totalDays : targetVal;
            targets[cleanName] = cumulativeTarget;
          });
        }

        let calculatedKpiScore = 0;
        let hasUnderperformingKpi = false;
        const failedKpis: string[] = [];
        let warningThreshold = 75;

        if (activeProject && activeProject.kpiDetails) {
          let scoreSum = 0;
          const kpiDetailsList = typeof activeProject.kpiDetails === "string" ? JSON.parse(activeProject.kpiDetails) : activeProject.kpiDetails;
          kpiDetailsList.forEach((kpi: any) => {
            const cleanName = kpi.name.toLowerCase().replace(/\s+/g, "");
            const caseCleanName = kpi.name.replace(/\s+/g, "");
            const achievedVal = rawMetrics[cleanName] !== undefined ? rawMetrics[cleanName] : 0;
            const targetVal = targets[cleanName] || kpi.target || 1;
            const weightVal = kpi.weight;

            const scope: Record<string, number> = {
              [cleanName]: achievedVal,
              [caseCleanName]: achievedVal,
              [`${cleanName}Raw`]: achievedVal,
              [`${caseCleanName}Raw`]: achievedVal,
              [`${cleanName}Target`]: targetVal,
              [`${caseCleanName}Target`]: targetVal,
              achieved: achievedVal,
              target: targetVal,
              weight: weightVal,
              attendanceDays: totalDays,
              days: totalDays
            };

            kpiDetailsList.forEach((otherKpi: any) => {
              const oClean = otherKpi.name.toLowerCase().replace(/\s+/g, "");
              const oCase = otherKpi.name.replace(/\s+/g, "");
              const oVal = rawMetrics[oClean] !== undefined ? rawMetrics[oClean] : 0;
              const oTarget = targets[oClean] || otherKpi.target || 1;

              scope[oClean] = oVal;
              scope[oCase] = oVal;
              scope[`${oClean}Raw`] = oVal;
              scope[`${oCase}Raw`] = oVal;
              scope[`${oClean}Target`] = oTarget;
              scope[`${oCase}Target`] = oTarget;
            });

            const formula = kpi.formula || `(${cleanName} / target) * 100`;
            const rawScore = evaluateKPI(formula, scope);
            const formulaLower = formula.toLowerCase();
            const usesWeight = formulaLower.includes("weight") || formulaLower.includes(String(weightVal));
            const activeKpiScore = usesWeight ? rawScore : rawScore * (weightVal / 100);

            scoreSum += activeKpiScore;
            warningThreshold = kpi.warningThreshold || warningThreshold;

            const kpiThreshold = kpi.warningThreshold !== undefined ? kpi.warningThreshold : 70;
            if (kpiThreshold > 0 && rawScore < kpiThreshold) {
              hasUnderperformingKpi = true;
              failedKpis.push(`${kpi.name}: Achieved ${Math.round(rawScore)}% (Warning Limit: ${kpiThreshold}%)`);
            }
          });
          calculatedKpiScore = Math.round(scoreSum * 10) / 10;
        } else {
          calculatedKpiScore = parseNumericValue(newRecord.kpiScore) || Number(pay.kpiScore) || 90.0;
        }

        const baseSalaryVal = (activeProject?.baseSalary ?? parseNumericValue(newRecord.base ?? pay.base)) || 2000;
        const baseBonusVal = activeProject?.baseBonus ?? 500;

        const scope: Record<string, number> = {
          base: baseSalaryVal,
          baseSalary: baseSalaryVal,
          baseBonus: baseBonusVal,
          kpiScore: calculatedKpiScore,
          totalKPIScore: calculatedKpiScore,
          cumulatedKPIScore: calculatedKpiScore
        };

        if (activeProject && activeProject.kpiDetails) {
          const kpiDetailsList = typeof activeProject.kpiDetails === "string" ? JSON.parse(activeProject.kpiDetails) : activeProject.kpiDetails;
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
              weight: kpi.weight,
              attendanceDays: totalDays,
              days: totalDays
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
          });
        }

        const computedSalary = activeProject?.salaryFormula
          ? evaluateKPI(activeProject.salaryFormula, scope)
          : baseSalaryVal * (calculatedKpiScore / 100);

        const computedBonus = activeProject?.bonusFormula
          ? evaluateKPI(activeProject.bonusFormula, scope)
          : baseBonusVal * (calculatedKpiScore / 100);

        const computedCommission = activeProject?.commissionFormula
          ? evaluateKPI(activeProject.commissionFormula, scope)
          : 0;

        const deductions = parseNumericValue(newRecord.deductions) || Number(pay.deductions) || 0;
        const finalSalary = Math.round(computedSalary + computedBonus + computedCommission - deductions);

        const updatedPay = {
          id: newRecord.id,
          name: newRecord.name || pay.name || "Unknown Agent",
          project: (projectName && projectName !== "All Projects") ? projectName : (newRecord.project || pay.project || "Unassigned"),
          kpiScore: calculatedKpiScore,
          base: Math.round(computedSalary),
          commission: Math.round(computedCommission),
          bonus: Math.round(computedBonus),
          deductions: deductions,
          final: finalSalary,
          status: newRecord.status || pay.status || "pending",
          rawMetrics,
          targets,
          attendanceDays: totalDays
        };

        const isUnderperforming = (calculatedKpiScore < warningThreshold) || hasUnderperformingKpi;
        if (isUnderperforming) {
          const empMatch = employees.find((e: any) => e.name.toLowerCase() === updatedPay.name.toLowerCase());
          const teamName = empMatch?.team || "Team A";
          const roleName = empMatch?.role || "Agent";
          const empWarnings = isUnderperforming ? (empMatch?.warnings || 0) + 1 : (empMatch?.warnings || 0);

          underperformingAgents.push({
            id: updatedPay.id,
            name: updatedPay.name,
            project: updatedPay.project,
            team: teamName,
            role: roleName,
            kpiScore: calculatedKpiScore,
            warningThreshold: warningThreshold,
            warnings: empWarnings,
            rawMetrics: rawMetrics,
            targets: targets,
            attendanceDays: totalDays,
            failedKpis: failedKpis
          });

          if (empMatch) {
            empMatch.warnings = empWarnings;
            empMatch.status = "warning";
          }
        }

        if (isNew) {
          payroll.push(updatedPay);
          addedCount++;
        } else {
          payroll[index] = updatedPay;
          updatedCount++;
        }
      });

      // Save updated employees
      for (const emp of employees) {
        await prisma.employee.upsert({
          where: { id: emp.id },
          update: {
            name: emp.name,
            project: emp.project,
            team: emp.team,
            role: emp.role,
            kpiScore: emp.kpiScore,
            salary: emp.salary,
            attendance: emp.attendance,
            warnings: emp.warnings,
            status: emp.status,
            rawMetrics: emp.rawMetrics,
            targets: emp.targets,
            attendanceDays: emp.attendanceDays,
          },
          create: {
            id: emp.id,
            name: emp.name,
            project: emp.project,
            team: emp.team,
            role: emp.role,
            kpiScore: emp.kpiScore,
            salary: emp.salary,
            attendance: emp.attendance,
            warnings: emp.warnings,
            status: emp.status,
            rawMetrics: emp.rawMetrics,
            targets: emp.targets,
            attendanceDays: emp.attendanceDays,
          }
        });
      }

      // Save updated payroll records
      for (const pay of payroll) {
        await prisma.payrollRecord.upsert({
          where: { id: pay.id },
          update: {
            name: pay.name,
            project: pay.project,
            kpiScore: pay.kpiScore,
            base: pay.base,
            commission: pay.commission,
            bonus: pay.bonus,
            deductions: pay.deductions,
            final: pay.final,
            status: pay.status,
            rawMetrics: pay.rawMetrics,
            targets: pay.targets,
            attendanceDays: pay.attendanceDays,
          },
          create: {
            id: pay.id,
            name: pay.name,
            project: pay.project,
            kpiScore: pay.kpiScore,
            base: pay.base,
            commission: pay.commission,
            bonus: pay.bonus,
            deductions: pay.deductions,
            final: pay.final,
            status: pay.status,
            rawMetrics: pay.rawMetrics,
            targets: pay.targets,
            attendanceDays: pay.attendanceDays,
          }
        });
      }

      const emailSent = await sendSmtpWarningEmail(projectName, underperformingAgents);

      return NextResponse.json({
        success: true,
        added: addedCount,
        updated: updatedCount,
        total: payroll.length,
        warningsTriggered: underperformingAgents.length,
        emailSent
      });

    } else {
      return NextResponse.json({ error: `Unsupported import type: ${importType}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error("POST excel-import error:", error);
    return NextResponse.json({ error: "Failed to process import." }, { status: 500 });
  }
}
