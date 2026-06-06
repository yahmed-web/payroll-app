"use client";

import {
  TrendingUp, TrendingDown, Users, DollarSign, BarChart3,
  Award, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subValue?: string;
  change?: number;
  icon: React.ReactNode;
  accentColor: string;
  bgGradient?: string;
  children?: React.ReactNode;
}

export default function KPICard({
  title, value, subValue, change, icon, accentColor, bgGradient, children,
}: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="kpi-card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            {title}
          </p>
          <p className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{value}</p>
          {subValue && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{subValue}</p>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: bgGradient || `${accentColor}18` }}
        >
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <ArrowUpRight size={14} className="text-green-500" />
          ) : (
            <ArrowDownRight size={14} className="text-red-500" />
          )}
          <span className={isPositive ? "stat-up" : "stat-down"}>
            {isPositive ? "+" : ""}{change}% vs last month
          </span>
        </div>
      )}

      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
