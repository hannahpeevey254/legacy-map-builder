import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ArrowRight, ArrowLeft, Check, Shield, Users, Heart, Lock } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

const inputStyle = {
  backgroundColor: "hsl(179 100% 8%)",
  border: "1.5px solid hsl(149 28% 79% / 0.18)",
  color: "hsl(149 28% 79%)",
  caretColor: "hsl(149 28% 79%)",
};

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: Step; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-12">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div key={n} className="rounded-full transition-all duration-300"
          style={{
            width: n === current ? "24px" : "8px",
            height: "8px",
            backgroundColor: n <= current ? "hsl(149 28% 79%)" : "hsl(149 28% 79% / 0.15)",
          }} />
      ))}
    </div>
  );
}

// ─── Individual Steps ─────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center max-w-lg mx-auto">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
        style={{ backgroundColor: "hsl(149 28% 79% / 0.10)" }}>
        <Lock size={32} style={{ color: "hsl(149 28% 79% / 0.70)" }} />
      </div>
      <h1 className="font-serif text-4xl md:text-5xl font-medium mb-4" style={{ color: "hsl(149 28% 79%)" }}>
        Let's set up your Safe Vault
      </h1>
      <p className="font-sans text-lg mb-4" style={{ color: "hsl(149 28% 79% / 0.65)", lineHeight: "1.65" }}>
        Your Safe Vault is a private, secure place where you decide what happens to your digital life — your photos, messages, accounts, and memories.
      </p>
      <p className="font-sans text-base mb-10" style={{ color: "hsl(149 28% 79% / 0.45)", lineHeight: "1.65" }}>
        Only takes 5 minutes. No technical knowledge needed.
      </p>
      <button onClick={onNext}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-sans text-base font-semibold transition-all duration-300 hover:opacity-90"
        style={{ backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }}>
        Let's begin <ArrowRight size={18} />
      </button>
    </div>
  );
}

function Step2({
  onNext, onBack, executorName, setExecutorName, executorEmail, setExecutorEmail,
}: {
  onNext: () => void; onBack: () => void;
  executorName: string; setExecutorName: (v: string) => void;
  executorEmail: string; setExecutorEmail: (v: string) => void;
}) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-8"
        style={{ backgroundColor: "hsl(149 28% 79% / 0.10)" }}>
        <Users size={26} style={{ color: "hsl(149 28% 79% / 0.70)" }} />
      </div>
      <h2 className="font-serif text-3xl md:text-4xl font-medium mb-3" style={{ color: "hsl(149 28% 79%)" }}>
        Who do you trust most?
      </h2>
      <p className="font-sans text-base mb-8" style={{ color: "hsl(149 28% 79% / 0.55)", lineHeight: "1.65" }}>
        This person becomes your <strong style={{ color: "hsl(149 28% 79% / 0.80)" }}>Trusted Keeper</strong> — the one who'll be able to access your vault when the time comes. Think of a family member, close friend, or solicitor you'd trust completely.
      </p>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <label className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.55)" }}>Their full name</label>
          <input type="text" value={executorName} onChange={(e) => setExecutorName(e.target.value)}
            placeholder="e.g. Sarah Chen"
            className="px-5 py-4 rounded-2xl font-sans text-base outline-none transition-all" style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.55)")}
            onBlur={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.18)")} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.55)" }}>Their email address</label>
          <input type="email" value={executorEmail} onChange={(e) => setExecutorEmail(e.target.value)}
            placeholder="e.g. sarah@email.com"
            className="px-5 py-4 rounded-2xl font-sans text-base outline-none transition-all" style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.55)")}
            onBlur={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.18)")} />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-sans text-sm font-semibold transition-all duration-200"
          style={{ backgroundColor: "hsl(149 28% 79% / 0.08)", color: "hsl(149 28% 79% / 0.60)", border: "1px solid hsl(149 28% 79% / 0.15)" }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={onNext} disabled={!executorName.trim() || !executorEmail.trim()}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-sans text-sm font-semibold transition-all duration-200 disabled:opacity-40"
          style={{ backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }}>
          Continue <ArrowRight size={16} />
        </button>
      </div>
      <button onClick={onNext}
        className="mt-4 w-full font-sans text-sm text-center transition-opacity hover:opacity-70"
        style={{ color: "hsl(149 28% 79% / 0.35)" }}>
        Skip for now
      </button>
    </div>
  );
}

function Step3({
  onNext, onBack, waitDays, setWaitDays,
}: {
  onNext: () => void; onBack: () => void;
  waitDays: number; setWaitDays: (v: number) => void;
}) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-8"
        style={{ backgroundColor: "hsl(149 28% 79% / 0.10)" }}>
        <Shield size={26} style={{ color: "hsl(149 28% 79% / 0.70)" }} />
      </div>
      <h2 className="font-serif text-3xl md:text-4xl font-medium mb-3" style={{ color: "hsl(149 28% 79%)" }}>
        How long before they can open it?
      </h2>
      <p className="font-sans text-base mb-8" style={{ color: "hsl(149 28% 79% / 0.55)", lineHeight: "1.65" }}>
        This is your safety lock. After you're gone, your Trusted Keeper has to wait this many days before they can access your vault. It protects you — just in case someone tries to claim access while you're still here.
      </p>

      <div className="rounded-2xl p-6 mb-8"
        style={{ backgroundColor: "hsl(179 100% 6%)", border: "1px solid hsl(149 28% 79% / 0.10)" }}>
        <div className="flex items-center justify-between mb-6">
          <p className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.55)" }}>Waiting period</p>
          <p className="font-serif text-4xl font-medium" style={{ color: "hsl(149 28% 79%)" }}>
            {waitDays} <span className="font-sans text-xl font-normal" style={{ color: "hsl(149 28% 79% / 0.50)" }}>days</span>
          </p>
        </div>
        <input type="range" min={7} max={30} step={1} value={waitDays}
          onChange={(e) => setWaitDays(Number(e.target.value))}
          className="w-full mb-3"
          style={{ accentColor: "hsl(149 28% 79%)" }} />
        <div className="flex justify-between">
          <span className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.30)" }}>7 days · recommended</span>
          <span className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.30)" }}>30 days · maximum</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-sans text-sm font-semibold transition-all duration-200"
          style={{ backgroundColor: "hsl(149 28% 79% / 0.08)", color: "hsl(149 28% 79% / 0.60)", border: "1px solid hsl(149 28% 79% / 0.15)" }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={onNext}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-sans text-sm font-semibold transition-all duration-200"
          style={{ backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }}>
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function Step4({
  onNext, onBack, assetName, setAssetName,
}: {
  onNext: () => void; onBack: () => void;
  assetName: string; setAssetName: (v: string) => void;
}) {
  const EXAMPLES = ["My iPhone photos", "Facebook account", "Voice messages to my children", "Personal diary on my laptop", "Email accounts"];

  return (
    <div className="max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-8"
        style={{ backgroundColor: "hsl(149 28% 79% / 0.10)" }}>
        <Heart size={26} style={{ color: "hsl(149 28% 79% / 0.70)" }} />
      </div>
      <h2 className="font-serif text-3xl md:text-4xl font-medium mb-3" style={{ color: "hsl(149 28% 79%)" }}>
        What's one thing you'd want to pass on?
      </h2>
      <p className="font-sans text-base mb-6" style={{ color: "hsl(149 28% 79% / 0.55)", lineHeight: "1.65" }}>
        It can be anything — photos, a journal, an account, voice messages. Don't worry about getting it perfect. You can always add more later.
      </p>

      {/* Example chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" onClick={() => setAssetName(ex)}
            className="px-3 py-1.5 rounded-full font-sans text-sm transition-all duration-150"
            style={{ backgroundColor: "hsl(149 28% 79% / 0.08)", color: "hsl(149 28% 79% / 0.60)", border: "1px solid hsl(149 28% 79% / 0.15)" }}>
            {ex}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 mb-8">
        <input type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)}
          placeholder="Describe the thing you'd like to pass on…"
          className="px-5 py-4 rounded-2xl font-sans text-base outline-none transition-all" style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.55)")}
          onBlur={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.18)")} />
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-sans text-sm font-semibold transition-all duration-200"
          style={{ backgroundColor: "hsl(149 28% 79% / 0.08)", color: "hsl(149 28% 79% / 0.60)", border: "1px solid hsl(149 28% 79% / 0.15)" }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={onNext} disabled={!assetName.trim()}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-sans text-sm font-semibold transition-all duration-200 disabled:opacity-40"
          style={{ backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }}>
          Continue <ArrowRight size={16} />
        </button>
      </div>
      <button onClick={onNext}
        className="mt-4 w-full font-sans text-sm text-center transition-opacity hover:opacity-70"
        style={{ color: "hsl(149 28% 79% / 0.35)" }}>
        Skip for now
      </button>
    </div>
  );
}

function Step5({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  return (
    <div className="flex flex-col items-center text-center max-w-lg mx-auto">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
        style={{ backgroundColor: "hsl(149 28% 79% / 0.12)" }}>
        <Check size={36} style={{ color: "hsl(149 28% 79%)" }} />
      </div>
      <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4" style={{ color: "hsl(149 28% 79%)" }}>
        Your vault is ready.
      </h2>
      <p className="font-sans text-lg mb-4" style={{ color: "hsl(149 28% 79% / 0.65)", lineHeight: "1.65" }}>
        You've taken the most important step. Your wishes are now recorded and protected.
      </p>
      <p className="font-sans text-base mb-12" style={{ color: "hsl(149 28% 79% / 0.40)", lineHeight: "1.65" }}>
        You can always come back to add more, change things, or review what you've shared. Safe Hands keeps everything exactly as you've arranged it.
      </p>
      <button onClick={onGoToDashboard}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-sans text-base font-semibold transition-all duration-300 hover:opacity-90"
        style={{ backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }}>
        Open my vault <ArrowRight size={18} />
      </button>
    </div>
  );
}

// ─── Main Onboarding Page ─────────────────────────────────────────────────────

export default function SeniorOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  // Step 2 state
  const [executorName, setExecutorName] = useState("");
  const [executorEmail, setExecutorEmail] = useState("");

  // Step 3 state
  const [waitDays, setWaitDays] = useState(14);

  // Step 4 state
  const [assetName, setAssetName] = useState("");

  const next = () => setStep((s) => Math.min(5, s + 1) as Step);
  const back = () => setStep((s) => Math.max(1, s - 1) as Step);

  const handleFinish = async () => {
    if (!supabase || !user) { navigate("/dashboard"); return; }
    setSaving(true);

    try {
      let executorContactId: string | null = null;

      // Save executor as trusted contact if filled in
      if (executorName.trim() && executorEmail.trim()) {
        const { data: contactData } = await supabase
          .from("trusted_contacts")
          .insert([{ name: executorName.trim(), email: executorEmail.trim().toLowerCase(), relationship: "Digital Executor", user_id: user.id }])
          .select("id")
          .single();
        executorContactId = contactData?.id ?? null;
      }

      // Save profile
      const profilePayload = {
        user_id: user.id,
        wait_period_days: waitDays,
        executor_contact_id: executorContactId,
      };
      await supabase.from("profiles").upsert([profilePayload], { onConflict: "user_id" });

      // Save first asset if filled in
      if (assetName.trim()) {
        await supabase.from("digital_assets").insert([{
          name: assetName.trim(),
          type: "photo",
          user_id: user.id,
        }]);
      }

      toast({ title: "Your vault is set up!", description: "Welcome to Safe Hands." });
    } catch {
      toast({ title: "Something went wrong", description: "Some settings may not have saved.", variant: "destructive" });
    }

    setSaving(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(179 100% 8%)" }}>
      <Toaster />

      {/* Minimal nav */}
      <header className="px-6 py-5 flex items-center justify-between">
        <a href="/" className="font-serif text-xl font-medium" style={{ color: "hsl(149 28% 79%)" }}>SafeHands</a>
        {step > 1 && step < 5 && (
          <button onClick={() => navigate("/dashboard")}
            className="font-sans text-sm transition-opacity hover:opacity-70"
            style={{ color: "hsl(149 28% 79% / 0.40)" }}>
            Save & exit
          </button>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-lg mx-auto w-full">
          {step > 1 && <StepDots current={step} total={5} />}

          {step === 1 && <Step1 onNext={next} />}
          {step === 2 && (
            <Step2 onNext={next} onBack={back}
              executorName={executorName} setExecutorName={setExecutorName}
              executorEmail={executorEmail} setExecutorEmail={setExecutorEmail} />
          )}
          {step === 3 && (
            <Step3 onNext={next} onBack={back} waitDays={waitDays} setWaitDays={setWaitDays} />
          )}
          {step === 4 && (
            <Step4 onNext={next} onBack={back} assetName={assetName} setAssetName={setAssetName} />
          )}
          {step === 5 && (
            <Step5 onGoToDashboard={handleFinish} />
          )}
        </div>
      </main>

      {/* Subtle footer */}
      <footer className="px-6 py-4 text-center">
        <p className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.20)" }}>
          Your information is private and encrypted. We never share it with anyone.
        </p>
      </footer>
    </div>
  );
}
