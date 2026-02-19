import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

type Mode = "login" | "signup";

export default function AuthPage() {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!loading && session) return <Navigate to="/dashboard" replace />;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setResetSent(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({
          title: "Check your inbox",
          description: "We sent a confirmation link to your email.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      toast({
        title: "Authentication error",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: "hsl(179 100% 6%)",
    border: "1.5px solid hsl(149 28% 79% / 0.20)",
    color: "hsl(149 28% 79%)",
    caretColor: "hsl(149 28% 79%)",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "hsl(179 100% 8%)" }}
    >
      <Toaster />

      {/* Background glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "60vw",
          height: "60vw",
          maxWidth: "600px",
          maxHeight: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at 60% 60%, hsl(149 28% 79% / 0.08) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="font-serif text-2xl font-medium" style={{ color: "hsl(149 28% 79%)" }}>
            SafeHands
          </a>
          <p className="font-sans text-sm mt-2" style={{ color: "hsl(149 28% 79% / 0.45)" }}>
            {mode === "signup" ? "Start curating your legacy." : "Welcome back."}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "hsl(179 100% 6%)",
            border: "1px solid hsl(149 28% 79% / 0.12)",
          }}
        >
          {/* Mode toggle — hidden in forgot-password state */}
          {!forgotPassword && (
            <div
              className="flex rounded-full p-1 mb-8 gap-1"
              style={{ backgroundColor: "hsl(179 100% 8%)" }}
            >
              {(["signup", "login"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-2 rounded-full font-sans text-sm font-medium transition-all duration-200"
                  style={
                    mode === m
                      ? { backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }
                      : { color: "hsl(149 28% 79% / 0.45)" }
                  }
                >
                  {m === "signup" ? "Create account" : "Sign in"}
                </button>
              ))}
            </div>
          )}

          {/* Forgot Password form */}
          {forgotPassword ? (
            resetSent ? (
              <div className="text-center py-4">
                <p className="font-sans text-sm mb-2" style={{ color: "hsl(149 28% 79%)" }}>
                  Reset link sent!
                </p>
                <p className="font-sans text-xs mb-6" style={{ color: "hsl(149 28% 79% / 0.50)" }}>
                  Check your inbox for a link to set a new password.
                </p>
                <button
                  onClick={() => { setForgotPassword(false); setResetSent(false); }}
                  className="font-sans text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ color: "hsl(149 28% 79% / 0.55)" }}
                >
                  ← Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <p className="font-sans text-sm mb-1" style={{ color: "hsl(149 28% 79% / 0.60)" }}>
                  Enter your email and we'll send you a reset link.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="px-4 py-3 rounded-xl font-sans text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.55)")}
                    onBlur={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.20)")}
                    disabled={submitting}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 py-3 rounded-full font-sans text-sm font-semibold transition-all duration-300 disabled:opacity-60"
                  style={{ backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }}
                >
                  {submitting ? "Sending…" : "Send Reset Link"}
                </button>
                <button
                  type="button"
                  onClick={() => setForgotPassword(false)}
                  className="font-sans text-xs text-center transition-opacity hover:opacity-70"
                  style={{ color: "hsl(149 28% 79% / 0.45)" }}
                >
                  ← Back to sign in
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="px-4 py-3 rounded-xl font-sans text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.55)")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.20)")}
                  disabled={submitting}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>
                    Password
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setForgotPassword(true)}
                      className="font-sans text-xs transition-opacity hover:opacity-70"
                      style={{ color: "hsl(149 28% 79% / 0.40)" }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="px-4 py-3 rounded-xl font-sans text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.55)")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.20)")}
                  disabled={submitting}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 py-3 rounded-full font-sans text-sm font-semibold transition-all duration-300 disabled:opacity-60"
                style={{ backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }}
              >
                {submitting
                  ? "Please wait…"
                  : mode === "signup"
                  ? "Create My Account"
                  : "Sign In"}
              </button>
            </form>
          )}

        </div>

        <p className="text-center font-sans text-xs mt-6" style={{ color: "hsl(149 28% 79% / 0.30)" }}>
          No spam. No selling. Privacy by intent.
        </p>
      </div>
    </div>
  );
}
