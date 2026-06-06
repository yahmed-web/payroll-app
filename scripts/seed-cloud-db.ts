import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding/migration...");

  // 1. Migrate Users
  const usersPath = path.join(process.cwd(), "lib", "users.json");
  if (fs.existsSync(usersPath)) {
    const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
    console.log(`Found ${users.length} users in users.json. Migrating...`);
    for (const u of users) {
      // Set trial started/expiry dates if they do not exist
      const trialStartedAt = new Date();
      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);

      await prisma.user.upsert({
        where: { email: u.email.toLowerCase() },
        update: {
          name: u.name,
          passwordHash: u.passwordHash,
          role: u.role || "ADMIN",
          verified: u.verified !== undefined ? u.verified : true,
          verificationToken: u.verificationToken || null,
          resetToken: u.resetToken || null,
          resetTokenExpiry: u.resetTokenExpiry || null,
        },
        create: {
          email: u.email.toLowerCase(),
          name: u.name,
          passwordHash: u.passwordHash,
          role: u.role || "ADMIN",
          verified: u.verified !== undefined ? u.verified : true,
          verificationToken: u.verificationToken || null,
          resetToken: u.resetToken || null,
          resetTokenExpiry: u.resetTokenExpiry || null,
          trialStartedAt,
          trialExpiresAt,
        },
      });
    }
    console.log("Users migrated successfully.");
  } else {
    console.log("No users.json found.");
  }

  // 2. Migrate Projects
  const projectsPath = path.join(process.cwd(), "lib", "projects.json");
  if (fs.existsSync(projectsPath)) {
    const projects = JSON.parse(fs.readFileSync(projectsPath, "utf8"));
    console.log(`Found ${projects.length} projects in projects.json. Migrating...`);
    for (const p of projects) {
      await prisma.project.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          client: p.client || "",
          department: p.department || "",
          agents: p.agents !== undefined ? Number(p.agents) : 0,
          status: p.status || "draft",
          currency: p.currency || "USD",
          payrollCycle: p.payrollCycle || "Monthly",
          created: p.created,
          kpis: JSON.stringify(p.kpis), 
          kpiDetails: JSON.stringify(p.kpiDetails), 
          baseSalary: p.baseSalary !== undefined ? Number(p.baseSalary) : 3000,
          baseBonus: p.baseBonus !== undefined ? Number(p.baseBonus) : 500,
          salaryFormula: p.salaryFormula || "baseSalary * (kpiScore / 100)",
          bonusFormula: p.bonusFormula || "baseBonus * (kpiScore / 100)",
          commissionFormula: p.commissionFormula || "0",
          commissionSystem: p.commissionSystem || "None",
        },
        create: {
          id: p.id,
          name: p.name,
          client: p.client || "",
          department: p.department || "",
          agents: p.agents !== undefined ? Number(p.agents) : 0,
          status: p.status || "draft",
          currency: p.currency || "USD",
          payrollCycle: p.payrollCycle || "Monthly",
          created: p.created,
          kpis: JSON.stringify(p.kpis),
          kpiDetails: JSON.stringify(p.kpiDetails),
          baseSalary: p.baseSalary !== undefined ? Number(p.baseSalary) : 3000,
          baseBonus: p.baseBonus !== undefined ? Number(p.baseBonus) : 500,
          salaryFormula: p.salaryFormula || "baseSalary * (kpiScore / 100)",
          bonusFormula: p.bonusFormula || "baseBonus * (kpiScore / 100)",
          commissionFormula: p.commissionFormula || "0",
          commissionSystem: p.commissionSystem || "None",
        },
      });
    }
    console.log("Projects migrated successfully.");
  } else {
    console.log("No projects.json found.");
  }

  // 3. Migrate Employees
  const employeesPath = path.join(process.cwd(), "lib", "employees.json");
  if (fs.existsSync(employeesPath)) {
    const employees = JSON.parse(fs.readFileSync(employeesPath, "utf8"));
    console.log(`Found ${employees.length} employees in employees.json. Migrating...`);
    for (const e of employees) {
      await prisma.employee.upsert({
        where: { id: e.id },
        update: {
          name: e.name,
          project: e.project,
          team: e.team || "",
          role: e.role || "Agent",
          kpiScore: e.kpiScore !== undefined ? Number(e.kpiScore) : 0,
          salary: e.salary || "$0",
          attendance: e.attendance !== undefined ? Number(e.attendance) : 0,
          warnings: e.warnings !== undefined ? Number(e.warnings) : 0,
          status: e.status || "active",
          rawMetrics: e.rawMetrics ? JSON.stringify(e.rawMetrics) : null,
          targets: e.targets ? JSON.stringify(e.targets) : null,
          attendanceDays: e.attendanceDays !== undefined ? Number(e.attendanceDays) : 0,
        },
        create: {
          id: e.id,
          name: e.name,
          project: e.project,
          team: e.team || "",
          role: e.role || "Agent",
          kpiScore: e.kpiScore !== undefined ? Number(e.kpiScore) : 0,
          salary: e.salary || "$0",
          attendance: e.attendance !== undefined ? Number(e.attendance) : 0,
          warnings: e.warnings !== undefined ? Number(e.warnings) : 0,
          status: e.status || "active",
          rawMetrics: e.rawMetrics ? JSON.stringify(e.rawMetrics) : null,
          targets: e.targets ? JSON.stringify(e.targets) : null,
          attendanceDays: e.attendanceDays !== undefined ? Number(e.attendanceDays) : 0,
        },
      });
    }
    console.log("Employees migrated successfully.");
  } else {
    console.log("No employees.json found.");
  }

  // 4. Migrate Payroll Records
  const payrollPath = path.join(process.cwd(), "lib", "payroll.json");
  if (fs.existsSync(payrollPath)) {
    const payrolls = JSON.parse(fs.readFileSync(payrollPath, "utf8"));
    console.log(`Found ${payrolls.length} payroll records in payroll.json. Migrating...`);
    for (const pr of payrolls) {
      await prisma.payrollRecord.upsert({
        where: { id: pr.id },
        update: {
          name: pr.name,
          project: pr.project,
          kpiScore: pr.kpiScore !== undefined ? Number(pr.kpiScore) : 0,
          base: pr.base !== undefined ? Number(pr.base) : 0,
          commission: pr.commission !== undefined ? Number(pr.commission) : 0,
          bonus: pr.bonus !== undefined ? Number(pr.bonus) : 0,
          deductions: pr.deductions !== undefined ? Number(pr.deductions) : 0,
          final: pr.final !== undefined ? Number(pr.final) : 0,
          status: pr.status || "pending",
          rawMetrics: pr.rawMetrics ? JSON.stringify(pr.rawMetrics) : null,
          targets: pr.targets ? JSON.stringify(pr.targets) : null,
          attendanceDays: pr.attendanceDays !== undefined ? Number(pr.attendanceDays) : 0,
        },
        create: {
          id: pr.id,
          name: pr.name,
          project: pr.project,
          kpiScore: pr.kpiScore !== undefined ? Number(pr.kpiScore) : 0,
          base: pr.base !== undefined ? Number(pr.base) : 0,
          commission: pr.commission !== undefined ? Number(pr.commission) : 0,
          bonus: pr.bonus !== undefined ? Number(pr.bonus) : 0,
          deductions: pr.deductions !== undefined ? Number(pr.deductions) : 0,
          final: pr.final !== undefined ? Number(pr.final) : 0,
          status: pr.status || "pending",
          rawMetrics: pr.rawMetrics ? JSON.stringify(pr.rawMetrics) : null,
          targets: pr.targets ? JSON.stringify(pr.targets) : null,
          attendanceDays: pr.attendanceDays !== undefined ? Number(pr.attendanceDays) : 0,
        },
      });
    }
    console.log("Payroll records migrated successfully.");
  } else {
    console.log("No payroll.json found.");
  }

  console.log("Seeding and migration completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during migration:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
