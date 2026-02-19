import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToHero = () => {
    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-racing-green shadow-lg" : "bg-transparent"
      }`}
      style={{
        backgroundColor: scrolled ? "hsl(179 100% 8%)" : "transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <button
          onClick={scrollToHero}
          className="font-serif text-xl md:text-2xl font-medium tracking-wide transition-opacity hover:opacity-80"
          style={{ color: "hsl(149 28% 79%)" }}
        >
          SafeHands
        </button>

        {/* Nav Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          {session ? (
            <>
              <Link
                to="/dashboard"
                className="font-sans text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "hsl(149 28% 79%)" }}
              >
                Dashboard
              </Link>
              <button
                onClick={() => navigate("/dashboard")}
                className="font-sans text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300 hover:brightness-110 hover:shadow-lg"
                style={{
                  backgroundColor: "hsl(149 28% 79%)",
                  color: "hsl(179 100% 8%)",
                }}
              >
                Start Curating
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="font-sans text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "hsl(149 28% 79%)" }}
              >
                Log In
              </Link>
              <button
                onClick={() => navigate("/auth")}
                className="font-sans text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300 hover:brightness-110 hover:shadow-lg"
                style={{
                  backgroundColor: "hsl(149 28% 79%)",
                  color: "hsl(179 100% 8%)",
                }}
              >
                Start Curating
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
