import { useState, useEffect, useRef } from "react";

const questions = [
  {
    q: "Where is all the data on my phone and computer going to go?",
    a: "We help you Map it.",
    bg: "hsl(149 28% 79%)",
    fg: "hsl(179 100% 8%)",
    verb: "Map",
  },
  {
    q: "Who do I want to have it and how do I decide?",
    a: "You Assign it.",
    bg: "hsl(48 74% 86%)",
    fg: "hsl(179 100% 8%)",
    verb: "Assign",
  },
  {
    q: "Is my creative work just... files? Or is it part of who I am?",
    a: "You Categorize it.",
    bg: "hsl(315 35% 14%)",
    fg: "hsl(149 28% 79%)",
    verb: "Categorize",
  },
  {
    q: "What happens to my voice notes, my journals, my unsent drafts?",
    a: "You Decide.",
    bg: "hsl(179 100% 8%)",
    fg: "hsl(149 28% 79%)",
    verb: "Decide",
  },
];

function QuestionCard({ q, a, bg, fg, verb, index }: typeof questions[0] & { index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-3xl p-8 md:p-10 cursor-default flex flex-col justify-between min-h-[320px] transition-all duration-500 reveal"
      style={{
        backgroundColor: bg,
        transform: hovered ? "translateY(-8px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 24px 48px rgba(0,0,0,0.25)"
          : "0 4px 16px rgba(0,0,0,0.08)",
        transitionDelay: `${index * 0.1}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p
        className="font-serif text-xl md:text-2xl italic font-medium leading-snug"
        style={{ color: fg }}
      >
        "{q}"
      </p>

      <div
        className="mt-8 overflow-hidden transition-all duration-500"
        style={{
          maxHeight: hovered ? "80px" : "0",
          opacity: hovered ? 1 : 0,
        }}
      >
        <div
          className="w-8 h-px mb-4"
          style={{ backgroundColor: fg, opacity: 0.4 }}
        />
        <p
          className="font-sans text-base font-medium"
          style={{ color: fg, opacity: 0.85 }}
        >
          → {a}
        </p>
      </div>
    </div>
  );
}

export function QuietQuestionsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".reveal").forEach((el, i) => {
              setTimeout(() => el.classList.add("revealed"), i * 120);
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
      style={{ backgroundColor: "hsl(48 30% 97%)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Label */}
        <div className="mb-14 reveal">
          <span
            className="font-sans text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full"
            style={{
              backgroundColor: "hsl(179 100% 8% / 0.06)",
              color: "hsl(179 100% 8% / 0.5)",
            }}
          >
            Questions worth asking.
          </span>
          <h2
            className="font-serif text-4xl md:text-5xl font-medium mt-6"
            style={{ color: "hsl(179 100% 8%)" }}
          >
            Quiet questions
            <br />
            with <em>heavy</em> answers.
          </h2>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {questions.map((item, i) => (
            <QuestionCard key={item.verb} {...item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
