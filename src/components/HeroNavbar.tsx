import { useState } from "react";

const ARROW_SRC = "/vendor/arrow-right.svg";

const navLinks = [
  { label: "Comment ça marche", href: "#how" },
  { label: "Lieux", href: "#" },
  { label: "Charte Jaws", href: "#" },
  { label: "Tarifs", href: "#" },
];

const ArrowButton = ({ children }: { children: React.ReactNode }) => (
  <button
    className="group relative inline-flex items-center justify-center overflow-hidden"
    style={{
      height: 38,
      padding: "12px 16px",
      gap: 10,
      borderRadius: 9,
      border: "1px solid rgba(250,250,250,0.20)",
      background: "#FFF",
      color: "#111111",
      fontFamily: '"Inter Tight", sans-serif',
      fontSize: 14,
      fontWeight: 500,
      cursor: "pointer",
    }}
  >
    <span>{children}</span>
    <span
      style={{
        position: "relative",
        width: 14,
        height: 14,
        overflow: "hidden",
        display: "inline-block",
      }}
    >
      <img
        src={ARROW_SRC}
        width={14}
        height={14}
        alt=""
        className="absolute inset-0 translate-x-0 group-hover:translate-x-[150%]"
        style={{ transition: "transform 500ms cubic-bezier(0.65,0,0.35,1)" }}
      />
      <img
        src={ARROW_SRC}
        width={14}
        height={14}
        alt=""
        className="absolute inset-0 -translate-x-[150%] group-hover:translate-x-0"
        style={{ transition: "transform 500ms cubic-bezier(0.65,0,0.35,1)" }}
      />
    </span>
  </button>
);

const HeroNavbar = () => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 grid items-center hero-nav"
      style={{
        gridTemplateColumns: "1fr auto 1fr",
        background: "color-mix(in oklab, #141416 72%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 clamp(1rem, 3vw, 2rem)",
        height: 70,
        fontFamily: '"Inter Tight", sans-serif',
      }}
    >
      <style>{`
        @media (max-width: 1024px) {
          .hero-nav-links { display: none !important; }
          .hero-nav { grid-template-columns: 1fr 1fr !important; }
        }
        .jaws-logo-link { position: relative; display: inline-block; line-height: 0; cursor: pointer; }
        .jaws-logo-img { height: 1.45rem; width: auto; display: block; transition: filter .4s ease; }
        .jaws-logo-link:hover .jaws-logo-img { filter: drop-shadow(0 0 18px rgba(255,89,44,0.55)); }
      `}</style>

      <div className="flex items-center">
        <a href="/" className="jaws-logo-link" aria-label="JAWS">
          <img src="/logo-jaws.svg" alt="JAWS" className="jaws-logo-img" />
        </a>
      </div>

      <div
        className="flex items-center justify-center hero-nav-links"
        style={{ gap: 4 }}
      >
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="flex items-center transition-colors duration-200"
            style={{
              gap: 4,
              fontFamily: '"Inter Tight", sans-serif',
              fontSize: "0.8rem",
              fontWeight: 500,
              padding: "6px 14px",
              cursor: "pointer",
              textDecoration: "none",
              color:
                hovered === link.label
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.65)",
            }}
            onMouseEnter={() => setHovered(link.label)}
            onMouseLeave={() => setHovered(null)}
          >
            {link.label}
          </a>
        ))}
      </div>

      <div className="flex items-center justify-end" style={{ gap: "1rem" }}>
        <ArrowButton>Ouvrir l'outil</ArrowButton>
      </div>
    </nav>
  );
};

export default HeroNavbar;
