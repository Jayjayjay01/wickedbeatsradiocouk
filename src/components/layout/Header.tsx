import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { CONFIG } from "@/config";
import { useFx } from "@/lib/fx";
import { cn } from "@/lib/utils";

export const NAV = [
  { to: "/", label: "Home" },
  { to: "/schedule", label: "Schedule" },
  { to: "/djs", label: "DJs" },
  { to: "/genres", label: "Genres" },
  { to: "/about", label: "About" },
  { to: "/community", label: "Community" },
  { to: "/requests", label: "Requests" },
  { to: "/support", label: "Support" },
  { to: "/contact", label: "Contact" },
] as const;

export function CalmToggle({ className }: { className?: string }) {
  const { calm, toggleCalm } = useFx();
  return (
    <button
      onClick={toggleCalm}
      aria-pressed={calm}
      className={cn("label-mono flex items-center gap-1.5 rounded border border-graphite px-2 py-1.5 text-[10px] transition-colors hover:border-pink", calm ? "bg-pink text-primary-foreground" : "text-muted-foreground", className)}
    >
      <Sparkles className="h-3 w-3" /> {calm ? "Effects reduced" : "Reduce effects"}
    </button>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  return (
    <>
      <a href="#player" className="sr-only z-[100] rounded bg-pink px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to player
      </a>
      <header id="site-header" className={cn("fixed inset-x-0 top-0 z-40 transition-colors", scrolled ? "glass border-x-0 border-t-0" : "border-b border-transparent")}>
        <div className="mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-3" aria-label="Wicked Beats Radio home">
            <Logo size={42} eager className="max-md:!h-9 max-md:!w-9" />
            <span className="font-slant hidden text-xl sm:inline">
              Wicked <span className="text-pink">Beats</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "!text-pink" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <CalmToggle className="hidden md:flex" />
            <Button asChild variant="hero" size="sm" className="hidden sm:inline-flex">
              <a href={CONFIG.RADIO_NET_URL} target="_blank" rel="noopener noreferrer">Tune In</a>
            </Button>
            <button className="rounded p-2 xl:hidden" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-xl"
            initial={{ clipPath: "polygon(0 0, 0 0, -20% 100%, -20% 100%)" }}
            animate={{ clipPath: "polygon(0 0, 120% 0, 100% 100%, -20% 100%)" }}
            exit={{ clipPath: "polygon(120% 0, 120% 0, 100% 100%, 100% 100%)" }}
            transition={{ duration: 0.45, ease: [0.7, 0, 0.2, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex h-14 items-center justify-between px-4 md:h-16">
              <Logo size={42} />
              <button className="rounded p-2" onClick={() => setOpen(false)} aria-label="Close menu" autoFocus>
                <X className="h-7 w-7" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col justify-center gap-0.5 overflow-y-auto px-6 md:gap-1 md:px-8" aria-label="Mobile">
              {NAV.map((n, i) => (
                <motion.div key={n.to} initial={{ x: -80, opacity: 0, skewX: -20 }} animate={{ x: 0, opacity: 1, skewX: 0 }} transition={{ delay: 0.12 + i * 0.05, type: "spring", stiffness: 300, damping: 22 }}>
                  <Link to={n.to} className="font-slant block py-1 text-[30px] md:text-5xl text-foreground transition-colors hover:text-pink" activeProps={{ className: "!text-pink" }} activeOptions={{ exact: n.to === "/" }}>
                    {n.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="flex items-center justify-between gap-3 p-4 pb-24 md:p-6 md:pb-28">
              <CalmToggle />
              <Button asChild variant="hero">
                <a href={CONFIG.RADIO_NET_URL} target="_blank" rel="noopener noreferrer">Tune In</a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
