import { useState } from "react";
import { useWaitlist } from "@/hooks/useWaitlist";

const chips = [
  { label: "📷 Photos", style: { top: "18%", left: "6%", animationDelay: "0s" } },
  { label: "🎙 Voice Notes", style: { top: "28%", right: "7%", animationDelay: "1.2s" } },
  { label: "💬 Messages", style: { bottom: "28%", left: "4%", animationDelay: "2.1s" } },
  { label: "🎨 Creative Work", style: { bottom: "20%", right: "6%", animationDelay: "0.7s" } },
  { label: "📓 Journals", style: { top: "12%", right: "22%", animationDelay: "1.8s" } },
  { label: "🔗 Accounts", style: { bottom: "14%", left: "22%", animationDelay: "3s" } },
];

export function HeroSection() {
  const [email, setEmail] = useState("");
  const { joinWaitlist, status } = useWaitlist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await joinWaitlist(email);
    if (success) setEmail("");
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "hsl(179 100% 8%)" }}
    >
      {/* Giant Misty Jade anchor arc — pure CSS */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "70vw",
          height: "70vw",
          maxWidth: "760px",
          maxHeight: "760px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at 60% 60%, hsl(149 28% 79% / 0.13) 0%, hsl(149 28% 79% / 0.06) 50%, transparent 75%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -52%)",
          filter: "blur(2px)",
        }}
      />
      {/* Sharper inner arc */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "52vw",
          height: "52vw",
          maxWidth: "560px",
          maxHeight: "560px",
          borderRadius: "50%",
          border: "1.5px solid hsl(149 28% 79% / 0.15)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -52%)",
        }}
      />

      {/* Floating chips */}
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="absolute hidden md:flex items-center gap-2 text-sm font-sans font-medium px-4 py-2 rounded-full pointer-events-none"
          style={{
            ...chip.style,
            backgroundColor: "hsl(149 28% 79% / 0.10)",
            border: "1px solid hsl(149 28% 79% / 0.25)",
            color: "hsl(149 28% 79%)",
            animation: `chip-drift 7s ease-in-out infinite ${chip.style.animationDelay}`,
          }}
        >
          {chip.label}
        </div>
      ))}

      {/* Hero content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto pt-24 pb-16">
        <p
          className="font-sans text-sm font-medium tracking-widest uppercase mb-6 reveal revealed"
          style={{ color: "hsl(149 28% 79% / 0.65)" }}
        >
          Digital Identity Platform
        </p>

        <h1
          className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium leading-tight mb-6"
          style={{ color: "hsl(149 28% 79%)" }}
        >
          Start curating
          <br />
          <em>your legacy.</em>
        </h1>

        <p
          className="font-sans text-base md:text-lg leading-relaxed mb-10 max-w-xl mx-auto"
          style={{ color: "hsl(149 28% 79% / 0.70)" }}
        >
          Your photos, voice notes, messages, and creative work tell a story.
          SafeHands helps you decide who receives it — and how.
        </p>

        {/* Email form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            id="hero-form"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="flex-1 px-5 py-3 rounded-full font-sans text-sm outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: "hsl(179 100% 8%)",
              border: "1.5px solid hsl(149 28% 79% / 0.35)",
              color: "hsl(149 28% 79%)",
              caretColor: "hsl(149 28% 79%)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "hsl(149 28% 79% / 0.8)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "hsl(149 28% 79% / 0.35)";
            }}
            disabled={status === "loading"}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 py-3 rounded-full font-sans text-sm font-semibold whitespace-nowrap transition-all duration-300 disabled:opacity-60 animate-glow-pulse"
            style={{
              backgroundColor: "hsl(149 28% 79%)",
              color: "hsl(179 100% 8%)",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.boxShadow =
                "0 0 32px 6px hsl(149 28% 79% / 0.45)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.boxShadow = "";
            }}
          >
            {status === "loading" ? "Joining..." : "Start Curating Your Legacy"}
          </button>
        </form>

        <p
          className="font-sans text-xs mt-4"
          style={{ color: "hsl(149 28% 79% / 0.4)" }}
        >
          No spam. No selling. Just early access.
        </p>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: "hsl(149 28% 79% / 0.35)" }}
      >
        <div
          className="w-px h-12"
          style={{
            background:
              "linear-gradient(to bottom, hsl(149 28% 79% / 0.5), transparent)",
          }}
        />
        <span className="font-sans text-xs tracking-widest uppercase">Scroll</span>
      </div>
    </section>
  );
}
