import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await prisma.project.findMany();
    const formatted = projects.map(p => ({
      ...p,
      kpis: typeof p.kpis === "string" ? JSON.parse(p.kpis) : p.kpis,
      kpiDetails: typeof p.kpiDetails === "string" ? JSON.parse(p.kpiDetails) : p.kpiDetails
    }));
    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET projects error:", error);
    return NextResponse.json({ error: "Failed to load projects." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, client, department, currency, payrollCycle, status } = body;

    if (!name) {
       return NextResponse.json({ error: "Project name is required." }, { status: 400 });
    }

    const id = Date.now().toString();
    const createdDateString = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const newProject = await prisma.project.create({
      data: {
        id,
        name,
        client: client || "",
        department: department || "",
        agents: 0,
        status: status || "draft",
        currency: currency || "USD",
        payrollCycle: payrollCycle || "Monthly",
        created: createdDateString,
        kpis: JSON.stringify([]),
        kpiDetails: JSON.stringify([]),
        baseSalary: 3000,
        baseBonus: 500,
        salaryFormula: "baseSalary * (kpiScore / 100)",
        bonusFormula: "baseBonus * (kpiScore / 100)",
        commissionFormula: "0",
        commissionSystem: "None"
      }
    });

    const formatted = {
      ...newProject,
      kpis: typeof newProject.kpis === "string" ? JSON.parse(newProject.kpis) : newProject.kpis,
      kpiDetails: typeof newProject.kpiDetails === "string" ? JSON.parse(newProject.kpiDetails) : newProject.kpiDetails
    };

    return NextResponse.json({ success: true, project: formatted });
  } catch (error: any) {
    console.error("POST projects error:", error);
    return NextResponse.json({ error: "Failed to create project." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, client, department, currency, payrollCycle, status, kpis, kpiDetails, salaryFormula, baseSalary, baseBonus, bonusFormula, commissionFormula, commissionSystem } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID is required." }, { status: 400 });
    }

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        client: client !== undefined ? client : undefined,
        department: department !== undefined ? department : undefined,
        currency: currency !== undefined ? currency : undefined,
        payrollCycle: payrollCycle !== undefined ? payrollCycle : undefined,
        status: status !== undefined ? status : undefined,
        kpis: kpis !== undefined ? JSON.stringify(kpis) : undefined,
        kpiDetails: kpiDetails !== undefined ? JSON.stringify(kpiDetails) : undefined,
        salaryFormula: salaryFormula !== undefined ? salaryFormula : undefined,
        baseSalary: baseSalary !== undefined ? Number(baseSalary) : undefined,
        baseBonus: baseBonus !== undefined ? Number(baseBonus) : undefined,
        bonusFormula: bonusFormula !== undefined ? bonusFormula : undefined,
        commissionFormula: commissionFormula !== undefined ? commissionFormula : undefined,
        commissionSystem: commissionSystem !== undefined ? commissionSystem : undefined,
      }
    });

    const formatted = {
      ...updatedProject,
      kpis: typeof updatedProject.kpis === "string" ? JSON.parse(updatedProject.kpis) : updatedProject.kpis,
      kpiDetails: typeof updatedProject.kpiDetails === "string" ? JSON.parse(updatedProject.kpiDetails) : updatedProject.kpiDetails
    };

    return NextResponse.json({ success: true, project: formatted });
  } catch (error: any) {
    console.error("PUT projects error:", error);
    return NextResponse.json({ error: "Failed to update project." }, { status: 500 });
  }
}
