import { ArrowRight, Link2, ScanSearch, FileText } from "lucide-react";
import HeroShader from "./components/HeroShader";
import HeroNavbar from "./components/HeroNavbar";
import UrlListInput from "./components/UrlListInput";

const steps = [
  {
    icon: Link2,
    title: "Collez vos liens",
    body: "Une ligne par lieu wearescene.com. Cliquez sur « + » pour en ajouter autant que nécessaire.",
  },
  {
    icon: ScanSearch,
    title: "Extraction précise",
    body: "On lit photos, surface, capacité, étage, accès, équipements et ambiances directement depuis la fiche — sans IA. Les infos sensibles (prix, caution, hôte) sont retirées.",
  },
  {
    icon: FileText,
    title: "PDF à la charte Jaws",
    body: "Une présentation prête pour le client : couverture + une page par lieu, au pixel près de la charte Jaws Group.",
  },
];

export default function App() {
  return (
    <div className="relative w-full bg-black text-white">
      <HeroNavbar />

      <div className="relative w-full overflow-hidden" style={{ height: "100vh" }}>
        <HeroShader />
        <div className="absolute inset-0 flex items-center justify-center px-4 pointer-events-none">
          <div
            className="pointer-events-auto w-full flex flex-col items-center"
            style={{ fontFamily: '"Inter Tight", sans-serif', maxWidth: 860 }}
          >
            <a
              href="#how"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "6px 16px 6px 6px",
                borderRadius: 999,
                background: "rgba(15,15,15,0.6)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                color: "#fff",
                fontSize: 14,
                textDecoration: "none",
                marginBottom: 28,
              }}
            >
              <span
                style={{
                  background: "var(--jaws-orange)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "4px 10px",
                  borderRadius: 999,
                }}
              >
                Nouveau
              </span>
              <span style={{ color: "rgba(255,255,255,0.92)" }}>
                Repérage & production audiovisuelle
              </span>
              <ArrowRight size={16} color="rgba(255,255,255,0.85)" />
            </a>

            <h1
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                paddingBottom: "0.15em",
                margin: 0,
                textAlign: "center",
              }}
              className="gradient-text-animate"
            >
              Des lieux de tournage,
              <br />
              prêts à présenter
            </h1>
            <p
              style={{
                fontSize: "clamp(1rem, 1.6vw, 1.35rem)",
                color: "rgba(255,255,255,0.65)",
                marginTop: 6,
                marginBottom: 36,
                textAlign: "center",
              }}
            >
              Collez vos liens wearescene — recevez une présentation à la charte Jaws.
            </p>

            <UrlListInput />
          </div>
        </div>
      </div>

      {/* How it works */}
      <section id="how" style={{ background: "#1c1c1c", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: '"Inter Tight"',
              fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: 0,
              marginBottom: 12,
            }}
          >
            De la fiche au deck, en trois étapes
          </h2>
          <p style={{ color: "rgba(255,255,255,0.55)", maxWidth: 620, margin: "0 0 56px", fontSize: 16 }}>
            L'outil s'appuie sur les données exactes de la fiche, pas sur une génération IA. Ce que
            le site affiche, le PDF le reprend — proprement et sans rien d'embarrassant.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
            }}
          >
            {steps.map((s, i) => (
              <div
                key={s.title}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: 28,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, var(--jaws-orange), var(--jaws-amber))",
                    marginBottom: 18,
                  }}
                >
                  <s.icon size={20} color="#fff" />
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                  0{i + 1}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>{s.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.55, margin: 0 }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
