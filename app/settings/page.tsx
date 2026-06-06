"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { User, Bell, Shield, Database, Globe, Palette, Save, Eye, EyeOff } from "lucide-react";

const settingsTabs = [
  { key: "profile", label: "Profile", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Shield },
  { key: "integrations", label: "Integrations", icon: Database },
  { key: "appearance", label: "Appearance", icon: Palette },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppLayout title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="wn-card p-3 h-fit">
          {settingsTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 ${
                activeTab === tab.key
                  ? "bg-wn-blue text-white"
                  : "text-wn-text-secondary hover:bg-wn-surface hover:text-wn-text-primary"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <div className="wn-card p-6">
              <h2 className="text-base font-semibold text-wn-text-primary mb-6">Profile Information</h2>
              <div className="flex items-center gap-5 mb-8">
                <div className="w-20 h-20 rounded-2xl bg-wn-blue/20 flex items-center justify-center text-2xl font-bold text-wn-blue">
                  AD
                </div>
                <div>
                  <div className="text-base font-semibold text-wn-text-primary">Admin User</div>
                  <div className="text-sm text-wn-text-muted">admin@webnova.com</div>
                  <button className="mt-2 text-xs text-wn-blue hover:underline">Change avatar</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "First Name", val: "Admin" },
                  { label: "Last Name", val: "User" },
                  { label: "Email", val: "admin@webnova.com" },
                  { label: "Phone", val: "+1 555 000 1234" },
                  { label: "Role", val: "Administrator" },
                  { label: "Department", val: "IT Operations" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-xs text-wn-text-muted mb-1 block">{f.label}</label>
                    <input defaultValue={f.val} className="wn-input w-full" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={handleSave} className="wn-btn-primary flex items-center gap-2">
                  <Save size={14} /> {saved ? "Saved!" : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="wn-card p-6">
              <h2 className="text-base font-semibold text-wn-text-primary mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: "KPI Alerts", desc: "When an agent drops below KPI threshold", email: true, push: true, sms: false },
                  { label: "Payroll Approvals", desc: "When payroll batch is ready for review", email: true, push: true, sms: true },
                  { label: "Commission Payouts", desc: "Monthly payout confirmations", email: true, push: false, sms: false },
                  { label: "Workflow Failures", desc: "When an automated workflow fails", email: true, push: true, sms: false },
                  { label: "Import Completions", desc: "Excel import success/failure", email: false, push: true, sms: false },
                  { label: "Audit Events", desc: "High-priority audit log entries", email: true, push: false, sms: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-wn-surface border border-wn-border">
                    <div>
                      <div className="text-sm font-medium text-wn-text-primary">{item.label}</div>
                      <div className="text-xs text-wn-text-muted mt-0.5">{item.desc}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      {(["email", "push", "sms"] as const).map((channel) => (
                        <label key={channel} className="flex flex-col items-center gap-1 cursor-pointer">
                          <input type="checkbox" defaultChecked={item[channel]} className="accent-wn-blue w-4 h-4" />
                          <span className="text-xs text-wn-text-muted capitalize">{channel}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={handleSave} className="wn-btn-primary flex items-center gap-2">
                  <Save size={14} /> {saved ? "Saved!" : "Save Preferences"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="wn-card p-6">
              <h2 className="text-base font-semibold text-wn-text-primary mb-6">Security Settings</h2>
              <div className="space-y-5 max-w-md">
                <div>
                  <label className="text-xs text-wn-text-muted mb-1 block">Current Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} defaultValue="••••••••" className="wn-input w-full pr-10" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-wn-text-muted">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-wn-text-muted mb-1 block">New Password</label>
                  <input type="password" placeholder="Min 8 characters..." className="wn-input w-full" />
                </div>
                <div>
                  <label className="text-xs text-wn-text-muted mb-1 block">Confirm New Password</label>
                  <input type="password" placeholder="Repeat password..." className="wn-input w-full" />
                </div>
              </div>
              <div className="mt-6 p-4 rounded-xl bg-wn-surface border border-wn-border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-wn-text-primary">Two-Factor Authentication</div>
                    <div className="text-xs text-wn-text-muted mt-0.5">Add extra security with TOTP authenticator</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:bg-wn-blue after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={handleSave} className="wn-btn-primary flex items-center gap-2">
                  <Save size={14} /> {saved ? "Saved!" : "Update Password"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="wn-card p-6">
              <h2 className="text-base font-semibold text-wn-text-primary mb-2">Integrations</h2>
              <p className="text-xs text-wn-text-muted mb-5">
                Connect external services to unlock automation. Status will update to <span className="text-emerald-400 font-medium">connected</span> once each integration is configured and verified.
              </p>
              {/* Info banner */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-5 text-xs text-amber-400">
                <span className="text-lg leading-none">⚠️</span>
                <div>
                  <div className="font-semibold mb-0.5">No integrations connected yet</div>
                  <div className="text-amber-400/80">n8n workflows, PostgreSQL database, and SMTP must be configured before they become active. Use MCP or your deployment settings to connect them.</div>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { name: "n8n Workflow Engine", desc: "Automate payroll and KPI events", status: "disconnected", url: "Not configured — add your n8n URL in .env", icon: "⚡" },
                  { name: "PostgreSQL Database", desc: "Primary data storage via Prisma ORM", status: "disconnected", url: "Not configured — set DATABASE_URL in .env", icon: "🗄️" },
                  { name: "SMTP Email Server", desc: "Send notification and payslip emails", status: "disconnected", url: "Not configured — set SMTP credentials in .env", icon: "📧" },
                  { name: "ExcelJS / XLSX Export", desc: "Generate payroll and KPI Excel reports", status: "active", url: "Built-in", icon: "📊" },
                  { name: "SSO / OAuth Provider", desc: "Single sign-on integration", status: "disconnected", url: "Not configured", icon: "🔐" },
                ].map((int) => (
                  <div key={int.name} className="flex items-center gap-4 p-4 rounded-xl border border-wn-border bg-wn-surface/50 hover:border-wn-blue/30 transition-colors">
                    <div className="text-2xl">{int.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-wn-text-primary">{int.name}</div>
                      <div className="text-xs text-wn-text-muted">{int.desc}</div>
                      <div className="text-xs text-wn-text-muted mt-0.5 font-mono">{int.url}</div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      int.status === "connected" ? "bg-emerald-500/20 text-emerald-400" :
                      int.status === "active" ? "bg-blue-500/20 text-blue-400" :
                      "bg-slate-500/20 text-slate-400"
                    }`}>
                      {int.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="wn-card p-6">
              <h2 className="text-base font-semibold text-wn-text-primary mb-6">Appearance</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-wn-text-muted mb-3 block font-medium uppercase tracking-wider">Color Theme</label>
                  <div className="flex gap-4">
                    {[
                      { name: "Webnova Dark", bg: "#0F172A", accent: "#2563EB", active: true },
                      { name: "Slate Dark", bg: "#1a1a2e", accent: "#7C3AED", active: false },
                      { name: "Deep Ocean", bg: "#0a1628", accent: "#0EA5E9", active: false },
                    ].map((theme) => (
                      <button key={theme.name} className={`flex flex-col items-center gap-2 group`}>
                        <div className={`w-16 h-10 rounded-xl border-2 transition-all ${theme.active ? "border-wn-blue" : "border-wn-border group-hover:border-wn-blue/50"}`}
                          style={{ backgroundColor: theme.bg, position: "relative", overflow: "hidden" }}>
                          <div className="absolute bottom-0 left-0 right-0 h-3" style={{ backgroundColor: theme.accent + "80" }} />
                        </div>
                        <span className="text-xs text-wn-text-muted">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-wn-text-muted mb-3 block font-medium uppercase tracking-wider">Sidebar Style</label>
                  <div className="flex gap-3">
                    {["Collapsed", "Expanded", "Auto"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="sidebar" defaultChecked={opt === "Expanded"} className="accent-wn-blue" />
                        <span className="text-sm text-wn-text-secondary">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-wn-text-muted mb-3 block font-medium uppercase tracking-wider">Date Format</label>
                  <select className="wn-input w-48 text-sm">
                    {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-wn-text-muted mb-3 block font-medium uppercase tracking-wider">Currency</label>
                  <select className="wn-input w-48 text-sm">
                    {["USD ($)", "EUR (€)", "GBP (£)", "MAD (د.م.)", "DZD (دج)"].map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={handleSave} className="wn-btn-primary flex items-center gap-2">
                  <Save size={14} /> {saved ? "Saved!" : "Save Appearance"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
