"use client";

import { signOut } from "next-auth/react";
import { Hourglass, Mail, LogOut, ShieldAlert } from "lucide-react";

export default function TrialExpiredPage() {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0F172A 0%, #0a1628 50%, #0F172A 100%)" }}
    >
      {/* Background grid effect */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#1E293B 1px, transparent 1px), linear-gradient(90deg, #1E293B 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.3,
        }}
      />

      {/* Glowing orb */}
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative w-full max-w-md transition-all duration-300">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-lg mb-4"
            style={{ background: "linear-gradient(135deg, #EF4444, #F59E0B)", boxShadow: "0 0 40px rgba(239,68,68,0.4)" }}
          >
            TS
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-xl leading-tight">Top Sales</div>
            <div className="font-bold text-xl leading-tight" style={{ color: "#F59E0B" }}>Webnova</div>
            <div className="text-xs mt-1" style={{ color: "#64748B" }}>Enterprise Operations Platform</div>
          </div>
        </div>

        {/* Card Content */}
        <div
          className="rounded-2xl p-8 border space-y-6 text-center"
          style={{
            background: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(20px)",
            borderColor: "#1E293B",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <Hourglass className="text-red-500 animate-spin" style={{ animationDuration: "3s" }} size={28} />
            </div>
            <h1 className="text-2xl font-bold text-white">Trial Period Expired</h1>
            <p className="text-sm" style={{ color: "#94A3B8" }}>
              Your 7-day trial of the Top Sales Webnova platform has ended.
            </p>
          </div>

          <div className="p-4 rounded-xl border text-xs leading-relaxed text-left space-y-2" style={{ background: "#090E1A", borderColor: "#1D283A", color: "#64748B" }}>
            <div className="flex gap-2 text-slate-300 font-semibold mb-1">
              <ShieldAlert size={14} className="text-amber-500 shrink-0 mt-0.5" />
              Access Suspended
            </div>
            To extend your trial, activate a license, or recover your dashboard access, please reach out to our system administrator.
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <a
              href="mailto:2lac2.yahia.meddeb@gmail.com?subject=Webnova%20Trial%20Extension%20Request"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95"
              style={{ boxShadow: "0 4px 15px rgba(239,68,68,0.3)" }}
            >
              <Mail size={15} /> Contact Administrator
            </a>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-slate-800/40"
              style={{ color: "#94A3B8", border: "1px solid #1E293B" }}
            >
              <LogOut size={15} /> Sign Out of Account
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "#334155" }}>
          © 2025 Top Sales Webnova · Enterprise Platform v1.0
        </p>
      </div>
    </div>
  );
}
