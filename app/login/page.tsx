"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, Lock, Mail, AlertCircle, Loader2, User, MailOpen, CheckCircle, Inbox, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── Verification States ──
  const [showVerificationPending, setShowVerificationPending] = useState(false);
  const [generatedVerificationUrl, setGeneratedVerificationUrl] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredName, setRegisteredName] = useState("");

  // ── Forgot & Reset Password States ──
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showResetPending, setShowResetPending] = useState(false);
  const [generatedResetUrl, setGeneratedResetUrl] = useState("");

  // ── Handle URL Search Parameters on Client Side Safely (Exceeds Next.js Suspense limitations) ──
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("verified") === "true") {
        setSuccessMsg("Email successfully verified! You can now sign in.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      const authError = params.get("error");
      if (authError === "EmailNotVerified") {
        setError("Your email address is not verified yet. Please check your inbox.");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (authError === "TokenExpiredOrInvalid") {
        setError("Your verification link is invalid or has expired.");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (authError === "InvalidToken") {
        setError("Verification token is missing or corrupted.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // resetToken is handled on dedicated page /reset-password
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    if (isRegister) {
      // ─── Registration Flow (Requires Verification) ─────────────────────────
      try {
        const regRes = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const regData = await regRes.json();
        
        if (!regRes.ok) {
          setError(regData.error || "Failed to create account.");
          setLoading(false);
          return;
        }

        // On successful registration, show the dynamic pending screen with sandbox email inbox!
        setRegisteredName(name);
        setRegisteredEmail(email);
        setGeneratedVerificationUrl(regData.verificationUrl || "");
        setShowVerificationPending(true);
        setLoading(false);
      } catch (err) {
        setError("Something went wrong. Please try again later.");
        setLoading(false);
      }
    } else {
      // ─── Login Flow ─────────────────────────────────────────────────────────
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (res?.error) {
        // NextAuth failed
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/dashboard");
      }
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to process password recovery.");
        return;
      }

      setGeneratedResetUrl(data.resetUrl || "");
      setShowResetPending(true);
      setShowForgot(false);
    } catch (err) {
      setError("Something went wrong. Please try again later.");
      setLoading(false);
    }
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

        {/* ─── CASE A: Verification Email Pending Screen (Simulated Inbox) ─── */}
        {showVerificationPending ? (
          <div
            className="rounded-2xl p-8 border space-y-6"
            style={{
              background: "rgba(15,23,42,0.85)",
              backdropFilter: "blur(20px)",
              borderColor: "#1E293B",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header Notification */}
            <div className="flex flex-col items-center text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
                <MailOpen className="text-green-500 animate-bounce" size={20} />
              </div>
              <h1 className="text-xl font-bold text-white">Check Your Inbox!</h1>
              <p className="text-sm max-w-sm" style={{ color: "#94A3B8" }}>
                We sent an activation link to <strong className="text-white">{registeredEmail}</strong>. Please confirm your email address.
              </p>
            </div>

            {/* Simulated Inbox Sandbox */}
            <div className="rounded-xl border p-4 space-y-3 relative overflow-hidden" style={{ background: "#090E1A", borderColor: "#1D283A" }}>
              <div className="absolute top-0 right-0 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-[#06B6D4] bg-cyan-950/40 rounded-bl border-l border-b border-cyan-800/40 uppercase">
                Developer Preview Sandbox
              </div>
              
              {/* Email Envelope Header */}
              <div className="text-[11px] space-y-1 pb-2.5 border-b border-slate-800" style={{ color: "#64748B" }}>
                <div><strong style={{ color: "#94A3B8" }}>From:</strong> Top Sales Webnova Security &lt;security@webnova.com&gt;</div>
                <div><strong style={{ color: "#94A3B8" }}>To:</strong> {registeredName} &lt;{registeredEmail}&gt;</div>
                <div><strong style={{ color: "#94A3B8" }}>Subject:</strong> Action Required: Verify your Webnova Account</div>
              </div>

              {/* Email Body */}
              <div className="bg-slate-950/60 rounded-lg p-5 flex flex-col items-center space-y-4 border border-slate-900/50">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs bg-gradient-to-br from-blue-600 to-cyan-500">
                  TS
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="text-sm font-bold text-white">Confirm Your Account Registration</h3>
                  <p className="text-xs leading-relaxed max-w-xs" style={{ color: "#64748B" }}>
                    Hi <span className="text-slate-300 font-semibold">{registeredName}</span>,<br />
                    Welcome to Webnova! Click the button below to confirm your account and gain access to the telecommunications dashboard.
                  </p>
                </div>
                
                {/* Simulated Verification Button */}
                <a
                  href={generatedVerificationUrl}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold text-white text-center transition-all bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-95 flex items-center justify-center gap-1.5"
                  style={{ boxShadow: "0 4px 15px rgba(37,99,235,0.3)" }}
                >
                  <CheckCircle size={13} /> Verify Account
                </a>

                <p className="text-[10px] text-center max-w-xs pt-2" style={{ color: "#475569" }}>
                  This sandbox simulates email delivery. In production, this link is delivered to the user's secure inbox.
                </p>
              </div>
            </div>

            {/* Back to sign in */}
            <button
              onClick={() => {
                setShowVerificationPending(false);
                setIsRegister(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-xs transition-all hover:bg-slate-800/40"
              style={{ color: "#94A3B8", border: "1px solid #1E293B" }}
            >
              <ArrowLeft size={13} /> Back to Sign In page
            </button>
          </div>
        ) : showResetPending ? (
          /* ─── CASE C: Password Reset Link Pending Screen ─── */
          <div
            className="rounded-2xl p-8 border space-y-6"
            style={{
              background: "rgba(15,23,42,0.85)",
              backdropFilter: "blur(20px)",
              borderColor: "#1E293B",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
                <MailOpen className="text-green-500 animate-bounce" size={20} />
              </div>
              <h1 className="text-xl font-bold text-white">Reset Link Sent!</h1>
              <p className="text-sm max-w-sm" style={{ color: "#94A3B8" }}>
                We sent a secure password recovery link to <strong className="text-white">{forgotEmail}</strong>.
              </p>
              <p className="text-xs max-w-xs pt-2 leading-relaxed" style={{ color: "#64748B" }}>
                Please check your email inbox (including your spam folder) and click the link to reset your Webnova password. You can safely close this page.
              </p>
            </div>
            {/* Back to sign in */}
            <button
              onClick={() => {
                setShowResetPending(false);
                setShowForgot(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-xs transition-all hover:bg-slate-800/40"
              style={{ color: "#94A3B8", border: "1px solid #1E293B" }}
            >
              <ArrowLeft size={13} /> Back to Sign In page
            </button>
          </div>
        ) : showForgot ? (
          /* ─── CASE E: Recover Password Form ─── */
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
              Recover Password
            </h1>
            <p className="text-sm mb-7" style={{ color: "#64748B" }}>
              Enter your administrator email to reset your password
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

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "#94A3B8" }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@webnova.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
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
                  <><Loader2 size={15} className="animate-spin" /> Working...</>
                ) : (
                  <><Zap size={15} /> Send Reset Link</>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: "#1E293B" }}>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setError("");
                  setSuccessMsg("");
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-xs transition-all hover:bg-slate-800/40"
                style={{ color: "#94A3B8", border: "1px solid #1E293B" }}
              >
                <ArrowLeft size={13} /> Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* ─── CASE B: Standard Sign In / Sign Up Form ─── */
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
              {isRegister ? "Create an account" : "Welcome back"}
            </h1>
            <p className="text-sm mb-7" style={{ color: "#64748B" }}>
              {isRegister
                ? "Sign up for a new administrator account"
                : "Sign in to your administrator account"}
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

            {successMsg && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm animate-fade-in"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ADE80" }}
              >
                <CheckCircle size={15} className="shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name (Only when Registering) */}
              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "#94A3B8" }}>
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                      style={{
                        background: "#0F172A",
                        border: "1px solid #1E293B",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                      onBlur={(e) => (e.target.style.borderColor = "#1E293B")}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "#94A3B8" }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@webnova.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                    style={{
                      background: "#0F172A",
                      border: "1px solid #1E293B",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                    onBlur={(e) => (e.target.style.borderColor = "#1E293B")}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold" style={{ color: "#94A3B8" }}>Password</label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgot(true);
                        setError("");
                        setSuccessMsg("");
                        setForgotEmail(email);
                      }}
                      className="text-xs hover:underline"
                      style={{ color: "#2563EB" }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
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
                    autoComplete={isRegister ? "new-password" : "current-password"}
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

              {/* Remember me (Only when Logging In) */}
              {!isRegister && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="accent-blue-600 w-4 h-4" />
                  <label htmlFor="remember" className="text-xs cursor-pointer" style={{ color: "#64748B" }}>
                    Keep me signed in for 30 days
                  </label>
                </div>
              )}

              {/* Submit */}
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
                  <><Loader2 size={15} className="animate-spin" /> Working...</>
                ) : isRegister ? (
                  <><Zap size={15} /> Create Account</>
                ) : (
                  <><Zap size={15} /> Sign In</>
                )}
              </button>
            </form>

            {/* Toggle between Register and Sign In */}
            <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: "#1E293B" }}>
              <p className="text-xs" style={{ color: "#94A3B8" }}>
                {isRegister ? "Already have an account?" : "Don't have an account yet?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="font-semibold hover:underline"
                  style={{ color: "#06B6D4" }}
                >
                  {isRegister ? "Sign In" : "Create one now"}
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "#334155" }}>
          © 2025 Top Sales Webnova · Enterprise Platform v1.0
        </p>
      </div>
    </div>
  );
}
