import { useEffect, useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Inventory",
    description:
      "Securely scan your photos, voice notes, messages, and accounts. Nothing is read without your permission.",
    icon: "◎",
  },
  {
    number: "02",
    title: "Reflect",
    description:
      "AI-guided prompts help you categorise Memories vs. Assets. You set the intention behind every file.",
    icon: "◈",
  },
  {
    number: "03",
    title: "Entrust",
    description:
      "Set inactivity triggers and assign trusted contacts, intentionally. Your legacy, on your terms.",
    icon: "◇",
  },
];

export function HowItWorksSection() {
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

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-32 px-6"
      style={{ backgroundColor: "hsl(48 74% 86%)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 reveal">
          <span
            className="font-sans text-xs font-semibold tracking-widest uppercase mb-4 block"
            style={{ color: "hsl(179 100% 8% / 0.45)" }}
          >
            How It Works
          </span>
          <h2
            className="font-serif text-4xl md:text-5xl font-medium leading-tight"
            style={{ color: "hsl(179 100% 8%)" }}
          >
            Three steps to
            <br />
            <em>intentional legacy.</em>
          </h2>
        </div>

        {/* Steps */}
        <div className="flex flex-col md:flex-row gap-5">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`reveal reveal-delay-${i + 1} flex-1 rounded-3xl p-8 md:p-10 relative overflow-hidden group transition-all duration-500`}
              style={{
                backgroundColor: "hsl(179 100% 8%)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(179 100% 10%)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(179 100% 8%)";
              }}
            >
              {/* Number watermark */}
              <span
                className="absolute top-6 right-8 font-serif text-6xl font-bold pointer-events-none select-none"
                style={{ color: "hsl(149 28% 79% / 0.07)" }}
              >
                {step.number}
              </span>

              <div
                className="text-3xl mb-6"
                style={{ color: "hsl(149 28% 79% / 0.6)" }}
              >
                {step.icon}
              </div>

              <h3
                className="font-serif text-2xl md:text-3xl font-medium mb-4"
                style={{ color: "hsl(149 28% 79%)" }}
              >
                {step.title}
              </h3>

              <p
                className="font-sans text-sm md:text-base leading-relaxed"
                style={{ color: "hsl(149 28% 79% / 0.60)" }}
              >
                {step.description}
              </p>

              {/* Connector line (between cards) */}
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-px z-10"
                  style={{ backgroundColor: "hsl(149 28% 79% / 0.2)" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
