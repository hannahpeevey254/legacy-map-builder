import { useEffect, useRef } from "react";

const stats = [
  { value: "2,400+", label: "people have started mapping their digital identity" },
  { value: "18,000+", label: "digital artifacts categorized" },
  { value: "94%", label: "say they feel more prepared after one session" },
];

export function SocialProofBar() {
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
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-16 px-6 border-y"
      style={{
        backgroundColor: "hsl(179 100% 8%)",
        borderColor: "hsl(149 28% 79% / 0.12)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 text-center md:text-left">
          {stats.map((stat, i) => (
            <div
              key={stat.value}
              className={`reveal reveal-delay-${i + 1} flex flex-col items-center md:items-start gap-2`}
            >
              <span
                className="font-serif text-4xl md:text-5xl font-medium"
                style={{ color: "hsl(149 28% 79%)" }}
              >
                {stat.value}
              </span>
              <p
                className="font-sans text-sm leading-relaxed max-w-[200px]"
                style={{ color: "hsl(149 28% 79% / 0.55)" }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
