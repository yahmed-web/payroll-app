"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, Lock, AlertCircle, Loader2, CheckCircle, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!token) {
    return (
      <div
        className="rounded-2xl p-8 border space-y-6 text-center"
        style={{
          background: "rgba(15,23,42,0.85)",
          backdropFilter: "blur(20px)",
          borderColor: "#1E293B",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)" }}>
          <AlertCircle className="text-red-500" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white mb-2">Invalid Reset Link</h1>
          <p className="text-sm max-w-xs mx-auto" style={{ color: "#94A3B8" }}>
            The password reset link is invalid, corrupted, or has expired. Please request a new link.
          </p>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-xs transition-all hover:bg-slate-800/40"
          style={{ color: "#94A3B8", border: "1px solid #1E293B" }}
        >
          <ArrowLeft size={13} /> Back to Sign In
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        return;
      }

      setSuccess("Your password has been successfully reset! You can now sign in with your new credentials.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="rounded-2xl p-8 border space-y-6 text-center"
        style={{
          background: "rgba(15,23,42,0.85)",
          backdropFilter: "blur(20px)",
          borderColor: "#1E293B",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
          <CheckCircle className="text-green-500 animate-bounce" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white mb-2">Password Reset Successful!</h1>
          <p className="text-sm max-w-xs mx-auto" style={{ color: "#94A3B8" }}>
            {success}
          </p>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-xs text-white transition-all"
          style={{
            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            boxShadow: "0 4px 20px rgba(37,99,235,0.4)",
          }}
        >
          <ArrowLeft size={13} /> Return to Sign In
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-8 border"
      style={{
        background: "rgba(15,23,42,0.85)",
        backdropFilter: "blur(20px)",
        borderColor: "#1E293B",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      }}
    >
      <h1 className="text-xl font-bold text-white mb-1">
        Create New Password
      </h1>
      <p className="text-sm mb-7" style={{ color: "#64748B" }}>
        Please enter your new secure password.
      </p>

      {error && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm"
          style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#F87171" }}
        >
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: "#94A3B8" }}>
            New Password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
            <input
              type={showPwd ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
              style={{
                background: "#0F172A",
                border: "1px solid #1E293B",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#1E293B")}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "#475569" }}
            >
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: "#94A3B8" }}>
            Confirm New Password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
            <input
              type={showPwd ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
              style={{
                background: "#0F172A",
                border: "1px solid #1E293B",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#1E293B")}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all mt-2"
          style={{
            background: loading ? "#1E40AF" : "linear-gradient(135deg, #2563EB, #1D4ED8)",
            boxShadow: loading ? "none" : "0 4px 20px rgba(37,99,235,0.4)",
            opacity: loading ? 0.8 : 1,
          }}
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Saving...</>
          ) : (
            <><Zap size={15} /> Update Password</>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
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
          background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative w-full max-w-lg transition-all duration-300">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-lg mb-4"
            style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)", boxShadow: "0 0 40px rgba(37,99,235,0.4)" }}
          >
            TS
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-xl leading-tight">Top Sales</div>
            <div className="font-bold text-xl leading-tight" style={{ color: "#06B6D4" }}>Webnova</div>
            <div className="text-xs mt-1" style={{ color: "#64748B" }}>Enterprise Operations Platform</div>
          </div>
        </div>

        <Suspense
          fallback={
            <div
              className="rounded-2xl p-8 border text-center flex flex-col items-center justify-center space-y-4"
              style={{
                background: "rgba(15,23,42,0.85)",
                backdropFilter: "blur(20px)",
                borderColor: "#1E293B",
                minHeight: "200px",
              }}
            >
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-sm" style={{ color: "#94A3B8" }}>Loading secure reset environment...</p>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "#334155" }}>
          © 2025 Top Sales Webnova · Enterprise Platform v1.0
        </p>
      </div>
    </div>
  );
}
