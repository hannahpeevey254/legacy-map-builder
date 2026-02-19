import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts recovery params in the hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
      // No recovery token — redirect away
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error updating password", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated!", description: "You're now signed in." });
      navigate("/dashboard", { replace: true });
    }
  };

  if (!ready) return null;

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
          background: "radial-gradient(ellipse at 60% 60%, hsl(149 28% 79% / 0.08) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <a href="/" className="font-serif text-2xl font-medium" style={{ color: "hsl(149 28% 79%)" }}>
            SafeHands
          </a>
          <p className="font-sans text-sm mt-2" style={{ color: "hsl(149 28% 79% / 0.45)" }}>
            Set a new password.
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "hsl(179 100% 6%)",
            border: "1px solid hsl(149 28% 79% / 0.12)",
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {submitting ? "Updating…" : "Set New Password"}
            </button>
          </form>
        </div>

        <p className="text-center font-sans text-xs mt-6" style={{ color: "hsl(149 28% 79% / 0.30)" }}>
          No spam. No selling. Privacy by intent.
        </p>
      </div>
    </div>
  );
}
