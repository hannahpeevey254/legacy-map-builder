import { useEffect, useRef } from "react";

const notifications = [
  {
    icon: "🔍",
    text: "I've found 42 unlabelled voice notes from 2019–2022.",
    sub: "Would you like to start categorising?",
    delay: "0s",
    animClass: "animate-float-up",
  },
  {
    icon: "📸",
    text: "You have 1,847 photos with no assigned recipient.",
    sub: "Let's decide together.",
    delay: "0.6s",
    animClass: "animate-float-down",
  },
  {
    icon: "✍️",
    text: "3 unsent drafts found. Are they memories or messages?",
    sub: "Tap to reflect.",
    delay: "1.2s",
    animClass: "animate-float-up-delayed",
  },
];

export function ReflectionEngineSection() {
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
      style={{ backgroundColor: "hsl(315 35% 14%)" }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Text */}
        <div>
          <span
            className="font-sans text-xs font-semibold tracking-widest uppercase mb-6 block reveal"
            style={{ color: "hsl(149 28% 79% / 0.5)" }}
          >
            The Reflection Engine
          </span>
          <h2
            className="font-serif text-4xl md:text-5xl font-medium leading-tight mb-6 reveal reveal-delay-1"
            style={{ color: "hsl(149 28% 79%)" }}
          >
            An AI partner that
            <br />
            <em>listens before it acts.</em>
          </h2>
          <p
            className="font-sans text-base md:text-lg leading-relaxed mb-8 reveal reveal-delay-2"
            style={{ color: "hsl(149 28% 79% / 0.60)" }}
          >
            The Reflection Engine doesn't organise your digital life for you —
            it asks the right questions. Through gentle prompts, it helps you
            surface what matters, separate memories from assets, and make
            intentional decisions about each piece of your story.
          </p>
          <ul className="space-y-3 reveal reveal-delay-3">
            {[
              "Identifies uncategorised files across your accounts",
              "Suggests emotional context — not just metadata",
              "Never reads content without your explicit consent",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 font-sans text-sm"
                style={{ color: "hsl(149 28% 79% / 0.65)" }}
              >
                <span
                  className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "hsl(149 28% 79%)" }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Phone mockup */}
        <div className="flex justify-center reveal reveal-delay-2">
          <div className="relative">
            {/* Phone frame */}
            <div
              className="relative w-64 h-[520px] rounded-[2.5rem] flex flex-col items-stretch overflow-hidden"
              style={{
                background: "hsl(179 100% 8%)",
                border: "2px solid hsl(149 28% 79% / 0.2)",
                boxShadow: "0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 hsl(149 28% 79% / 0.1)",
              }}
            >
              {/* Notch */}
              <div className="flex justify-center pt-4 pb-2">
                <div
                  className="w-20 h-5 rounded-full"
                  style={{ backgroundColor: "hsl(179 60% 12%)" }}
                />
              </div>

              {/* Screen content */}
              <div className="flex-1 flex flex-col justify-center gap-4 px-4 pb-8">
                {/* App header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <span
                    className="font-serif text-sm font-medium"
                    style={{ color: "hsl(149 28% 79%)" }}
                  >
                    SafeHands
                  </span>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: "hsl(149 28% 79% / 0.15)" }}
                  >
                    ✦
                  </div>
                </div>

                {/* Floating notification cards */}
                {notifications.map((n, i) => (
                  <div
                    key={i}
                    className="glass-card rounded-2xl p-3.5"
                    style={{
                      animation: `${n.animClass.replace("animate-", "")} ${i === 0 ? "4s" : i === 1 ? "4.5s" : "5s"} ease-in-out infinite`,
                      animationDelay: n.delay,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{n.icon}</span>
                      <div>
                        <p
                          className="font-sans text-xs font-medium leading-snug"
                          style={{ color: "hsl(149 28% 79%)" }}
                        >
                          {n.text}
                        </p>
                        <p
                          className="font-sans text-xs mt-1"
                          style={{ color: "hsl(149 28% 79% / 0.5)" }}
                        >
                          {n.sub}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ambient glow */}
            <div
              className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
              style={{
                boxShadow: "0 0 80px 20px hsl(149 28% 79% / 0.06)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
