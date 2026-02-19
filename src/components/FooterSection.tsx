import { useState, useEffect, useRef } from "react";
import { useWaitlist } from "@/hooks/useWaitlist";

export function FooterSection() {
  const [email, setEmail] = useState("");
  const { joinWaitlist, status } = useWaitlist();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".reveal").forEach((el, i) => {
              setTimeout(() => el.classList.add("revealed"), i * 150);
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await joinWaitlist(email);
    if (success) setEmail("");
  };

  return (
    <footer
      ref={sectionRef}
      style={{ backgroundColor: "hsl(344 50% 16%)" }}
    >
      {/* Final CTA block */}
      <div className="py-24 md:py-32 px-6 text-center border-b" style={{ borderColor: "hsl(48 74% 86% / 0.10)" }}>
        <div className="max-w-2xl mx-auto">
          <span
            className="font-sans text-xs font-semibold tracking-widest uppercase mb-6 block reveal"
            style={{ color: "hsl(48 74% 86% / 0.45)" }}
          >
            Join the waitlist
          </span>
          <h2
            className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-6 reveal reveal-delay-1"
            style={{ color: "hsl(48 74% 86%)" }}
          >
            Your digital life
            <br />
            <em>deserves intention.</em>
          </h2>
          <p
            className="font-sans text-base leading-relaxed mb-10 reveal reveal-delay-2"
            style={{ color: "hsl(48 74% 86% / 0.60)" }}
          >
            Be among the first to map your digital identity with SafeHands.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto reveal reveal-delay-3"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 px-5 py-3 rounded-full font-sans text-sm outline-none transition-all"
              style={{
                backgroundColor: "hsl(344 50% 16%)",
                border: "1.5px solid hsl(48 74% 86% / 0.25)",
                color: "hsl(48 74% 86%)",
                caretColor: "hsl(48 74% 86%)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "hsl(48 74% 86% / 0.65)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "hsl(48 74% 86% / 0.25)";
              }}
              disabled={status === "loading"}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-3 rounded-full font-sans text-sm font-semibold whitespace-nowrap transition-all duration-300 disabled:opacity-60"
              style={{
                backgroundColor: "hsl(149 28% 79%)",
                color: "hsl(179 100% 8%)",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.boxShadow =
                  "0 0 24px 4px hsl(149 28% 79% / 0.35)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.boxShadow = "";
              }}
            >
              {status === "loading" ? "Joining..." : "Start Curating"}
            </button>
          </form>
        </div>
      </div>

      {/* Footer links */}
      <div className="py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span
            className="font-serif text-lg font-medium"
            style={{ color: "hsl(149 28% 79%)" }}
          >
            SafeHands
          </span>
          <nav className="flex items-center gap-6 md:gap-8">
            {["Privacy Policy", "Ethics Statement", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="font-sans text-sm transition-opacity hover:opacity-80"
                style={{ color: "hsl(48 74% 86% / 0.45)" }}
              >
                {link}
              </a>
            ))}
          </nav>
          <p
            className="font-sans text-xs"
            style={{ color: "hsl(48 74% 86% / 0.25)" }}
          >
            © {new Date().getFullYear()} SafeHands. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
