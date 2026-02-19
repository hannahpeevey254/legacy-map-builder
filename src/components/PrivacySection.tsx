import { useEffect, useRef } from "react";

const pillars = [
  {
    icon: "🔒",
    title: "Zero-knowledge encryption",
    description:
      "Your data is encrypted client-side before it ever touches our servers. We cannot read what you store.",
  },
  {
    icon: "🚫",
    title: "No data selling. Ever.",
    description:
      "We don't sell, rent, or share your information with third parties. Your legacy is not a product.",
  },
  {
    icon: "🗑️",
    title: "Clear deletion pathways",
    description:
      "Delete your account and everything associated with it — permanently — in two taps. No dark patterns.",
  },
];

export function PrivacySection() {
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
      style={{ backgroundColor: "hsl(179 100% 8%)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 reveal">
          <span
            className="font-sans text-xs font-semibold tracking-widest uppercase mb-4 block"
            style={{ color: "hsl(149 28% 79% / 0.45)" }}
          >
            Privacy by Intent
          </span>
          <h2
            className="font-serif text-4xl md:text-5xl font-medium leading-tight"
            style={{ color: "hsl(149 28% 79%)" }}
          >
            We built this for you.
            <br />
            <em>Not about you.</em>
          </h2>
        </div>

        {/* Three pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className={`reveal reveal-delay-${i + 1}`}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-6"
                style={{ backgroundColor: "hsl(149 28% 79% / 0.10)" }}
              >
                {pillar.icon}
              </div>
              <div
                className="w-8 h-px mb-5"
                style={{ backgroundColor: "hsl(149 28% 79% / 0.25)" }}
              />
              <h3
                className="font-serif text-xl md:text-2xl font-medium mb-3"
                style={{ color: "hsl(149 28% 79%)" }}
              >
                {pillar.title}
              </h3>
              <p
                className="font-sans text-sm md:text-base leading-relaxed"
                style={{ color: "hsl(149 28% 79% / 0.55)" }}
              >
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
