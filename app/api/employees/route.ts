import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany();
    const formatted = employees.map(e => ({
      ...e,
      rawMetrics: typeof e.rawMetrics === "string" ? JSON.parse(e.rawMetrics) : e.rawMetrics,
      targets: typeof e.targets === "string" ? JSON.parse(e.targets) : e.targets
    }));
    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET employees error:", error);
    return NextResponse.json({ error: "Failed to load employees." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      // Batch insert / import
      let addedCount = 0;
      let updatedCount = 0;

      for (const newEmp of body) {
        if (!newEmp.id) continue;

        const existing = await prisma.employee.findUnique({
          where: { id: newEmp.id },
        });

        if (existing) {
          await prisma.employee.update({
            where: { id: newEmp.id },
            data: {
              name: newEmp.name,
              project: newEmp.project,
              team: newEmp.team,
              role: newEmp.role,
              kpiScore: newEmp.kpiScore !== undefined ? Number(newEmp.kpiScore) : undefined,
              salary: newEmp.salary,
              attendance: newEmp.attendance !== undefined ? Number(newEmp.attendance) : undefined,
              warnings: newEmp.warnings !== undefined ? Number(newEmp.warnings) : undefined,
              status: newEmp.status,
              rawMetrics: newEmp.rawMetrics !== undefined ? JSON.stringify(newEmp.rawMetrics) : undefined,
              targets: newEmp.targets !== undefined ? JSON.stringify(newEmp.targets) : undefined,
              attendanceDays: newEmp.attendanceDays !== undefined ? Number(newEmp.attendanceDays) : undefined,
            },
          });
          updatedCount++;
        } else {
          await prisma.employee.create({
            data: {
              id: newEmp.id,
              name: newEmp.name || "Unknown Agent",
              project: newEmp.project || "Unassigned",
              team: newEmp.team || "Team A",
              role: newEmp.role || "Agent",
              kpiScore: Number(newEmp.kpiScore) || 90.0,
              salary: newEmp.salary || "$3,000",
              attendance: Number(newEmp.attendance) || 100,
              warnings: Number(newEmp.warnings) || 0,
              status: newEmp.status || "active",
              rawMetrics: newEmp.rawMetrics ? JSON.stringify(newEmp.rawMetrics) : null,
              targets: newEmp.targets ? JSON.stringify(newEmp.targets) : null,
              attendanceDays: newEmp.attendanceDays !== undefined ? Number(newEmp.attendanceDays) : 0,
            },
          });
          addedCount++;
        }
      }

      return NextResponse.json({ success: true, added: addedCount, updated: updatedCount });
    } else {
      // Single add
      const { id, name, project, team, role, kpiScore, salary, attendance, warnings, status, rawMetrics, targets, attendanceDays } = body;
      if (!id || !name) {
        return NextResponse.json({ error: "Employee ID and Name are required." }, { status: 400 });
      }

      const existing = await prisma.employee.findUnique({
        where: { id },
      });

      if (existing) {
        return NextResponse.json({ error: `Employee with ID ${id} already exists.` }, { status: 400 });
      }

      const newEmp = await prisma.employee.create({
        data: {
          id,
          name,
          project: project || "Unassigned",
          team: team || "Team A",
          role: role || "Agent",
          kpiScore: Number(kpiScore) || 90.0,
          salary: salary.startsWith("$") ? salary : `$${salary}`,
          attendance: Number(attendance) || 100,
          warnings: Number(warnings) || 0,
          status: status || "active",
          rawMetrics: rawMetrics ? JSON.stringify(rawMetrics) : null,
          targets: targets ? JSON.stringify(targets) : null,
          attendanceDays: attendanceDays !== undefined ? Number(attendanceDays) : 0,
        },
      });

      // Keep payroll in sync!
      const existingPayroll = await prisma.payrollRecord.findFirst({
        where: { name: { equals: name } },
      });

      if (!existingPayroll) {
        // Find highest payroll ID prefix
        const payrolls = await prisma.payrollRecord.findMany();
        let highestId = 0;
        payrolls.forEach((p) => {
          const match = p.id.match(/^PR(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > highestId) highestId = num;
          }
        });
        const newPrId = `PR${String(highestId + 1).padStart(3, "0")}`;
        const rawSalary = Number(salary.replace(/[^0-9]/g, "")) || 2000;

        await prisma.payrollRecord.create({
          data: {
            id: newPrId,
            name: name,
            project: project || "Unassigned",
            kpiScore: Number(kpiScore) || 90.0,
            base: rawSalary,
            commission: 0,
            bonus: 0,
            deductions: 0,
            final: rawSalary,
            status: "pending",
            rawMetrics: rawMetrics ? JSON.stringify(rawMetrics) : JSON.stringify({}),
            targets: targets ? JSON.stringify(targets) : JSON.stringify({}),
            attendanceDays: attendanceDays !== undefined ? Number(attendanceDays) : 1,
          },
        });
      }

      const formatted = {
        ...newEmp,
        rawMetrics: typeof newEmp.rawMetrics === "string" ? JSON.parse(newEmp.rawMetrics) : newEmp.rawMetrics,
        targets: typeof newEmp.targets === "string" ? JSON.parse(newEmp.targets) : newEmp.targets
      };

      return NextResponse.json({ success: true, employee: formatted });
    }
  } catch (error: any) {
    console.error("POST employees error:", error);
    return NextResponse.json({ error: "Failed to save employee(s)." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required." }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    const empName = employee.name;

    // Delete from employees
    await prisma.employee.delete({
      where: { id },
    });

    // Delete matching payroll record
    const payRecord = await prisma.payrollRecord.findFirst({
      where: { name: empName },
    });

    if (payRecord) {
      await prisma.payrollRecord.delete({
        where: { id: payRecord.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE employees error:", error);
    return NextResponse.json({ error: "Failed to delete employee." }, { status: 500 });
  }
}
