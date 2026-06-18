import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Link2, FileText, Check, AlertCircle, Download } from "lucide-react";
import SendButton from "./SendButton";

type Row = { id: number; value: string };
type Status = "idle" | "loading" | "done" | "error";

let nextId = 2;
const isSceneUrl = (v: string) => /wearescene\.com\/.*\/lieu\//i.test(v.trim());

export default function UrlListInput() {
  const [rows, setRows] = useState<Row[]>([
    { id: 0, value: "" },
    { id: 1, value: "" },
  ]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);

  const addRow = () => setRows((r) => [...r, { id: nextId++, value: "" }]);
  const removeRow = (id: number) =>
    setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));
  const updateRow = (id: number, value: string) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, value } : x)));

  const onPaste = (id: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    const links = text
      .split(/[\s\n,]+/)
      .map((s) => s.trim())
      .filter((s) => /^https?:\/\//i.test(s));
    if (links.length > 1) {
      e.preventDefault();
      setRows((r) => {
        const others = r.filter((x) => x.id !== id || x.value.trim() !== "");
        const base = r.find((x) => x.id === id && x.value.trim() === "") ? [] : others;
        const merged = [...base];
        links.forEach((l) => merged.push({ id: nextId++, value: l }));
        return merged.length ? merged : [{ id: nextId++, value: "" }];
      });
    }
  };

  const urls = rows.map((r) => r.value.trim()).filter(Boolean);
  const canGenerate = urls.length > 0 && status !== "loading";

  const generate = async () => {
    if (!canGenerate) return;
    setStatus("loading");
    setPdfUrl(null);
    setFailedUrls([]);
    setMessage(`Extraction de ${urls.length} lieu${urls.length > 1 ? "x" : ""} sur wearescene…`);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (Array.isArray(err.failed)) setFailedUrls(err.failed);
        throw new Error(err.error || `Erreur serveur (${res.status})`);
      }
      // Some links may have failed while others succeeded — the server lists
      // them so we can flag the offending rows without blocking the deck.
      const header = res.headers.get("X-Failed-Urls");
      let failed: string[] = [];
      if (header) {
        try {
          failed = JSON.parse(decodeURIComponent(header));
        } catch {
          failed = [];
        }
      }
      setFailedUrls(failed);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setStatus("done");
      const ok = urls.length - failed.length;
      setMessage(
        failed.length
          ? `Présentation générée avec ${ok} lieu${ok > 1 ? "x" : ""} — ${failed.length} lien${failed.length > 1 ? "s" : ""} ignoré${failed.length > 1 ? "s" : ""}.`
          : "Présentation générée à la charte Jaws.",
      );
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Échec de la génération.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, delay: 0.55, ease: "easeOut" }}
      style={{ width: 702, maxWidth: "100%", margin: "0 auto", padding: 4, borderRadius: 34 }}
    >
      <div
        style={{
          width: "100%",
          background:
            "linear-gradient(180.9deg, rgb(118 100 50 / 23%) -0.58%, rgba(53, 53, 56, 0.7) 66.34%, rgba(38, 38, 39, 0.7) 101.25%), rgb(43 38 38 / 67%)",
          boxShadow:
            "rgba(0, 0, 0, 0.5) 0px 118px 112px, rgba(0, 0, 0, 0.36) 0px 69.4784px 58.4192px, rgba(0, 0, 0, 0.282) 0px 35.6832px 27.4176px, rgba(255, 255, 255, 0.32) 0.5px 0.5px 0.5px inset, rgba(255, 255, 255, 0.05) 0.5px -0.5px 0.5px inset",
          borderRadius: 30,
          padding: "16px 16px 12px 16px",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 4,
          }}
        >
          <span
            style={{
              fontFamily: '"Inter Tight"',
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.01em",
            }}
          >
            Liens des lieux à présenter
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            {urls.length} lieu{urls.length > 1 ? "x" : ""}
          </span>
        </div>

        {/* Rows — table-style, one link per line */}
        <div
          className="scrollbar-thin"
          style={{ display: "flex", flexDirection: "column", maxHeight: 230, overflowY: "auto" }}
        >
          <AnimatePresence initial={false}>
            {rows.map((row, idx) => {
              const valid = row.value.trim() === "" || isSceneUrl(row.value);
              const corrupted = row.value.trim() !== "" && failedUrls.includes(row.value.trim());
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 44 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    height: 44,
                    borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      textAlign: "center",
                      fontSize: 12,
                      fontVariantNumeric: "tabular-nums",
                      color: corrupted ? "#ff5a5a" : "rgba(255,255,255,0.35)",
                      flexShrink: 0,
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {corrupted ? (
                    <AlertCircle size={14} color="#ff5a5a" style={{ flexShrink: 0 }} />
                  ) : (
                    <Link2
                      size={14}
                      color={valid ? "rgba(255,255,255,0.4)" : "var(--jaws-orange)"}
                      style={{ flexShrink: 0 }}
                    />
                  )}
                  <input
                    value={row.value}
                    onChange={(e) => updateRow(row.id, e.target.value)}
                    onPaste={(e) => onPaste(row.id, e)}
                    placeholder="https://www.wearescene.com/fr/lieu/…"
                    spellCheck={false}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: corrupted ? "#ff5a5a" : "#fff",
                      textDecoration: corrupted ? "line-through" : "none",
                      fontFamily: '"Inter Tight"',
                      fontSize: 14,
                      minWidth: 0,
                    }}
                    title={corrupted ? "Lien corrompu — non inclus dans le PDF" : undefined}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        generate();
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        addRow();
                      }
                    }}
                  />
                  <button
                    onClick={() => removeRow(row.id)}
                    aria-label="Supprimer la ligne"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: "none",
                      background: "transparent",
                      color: "rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer: + add row  |  status  |  generate */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 2,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            paddingTop: 10,
          }}
        >
          <button
            onClick={addRow}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 32,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "hsl(0deg 0% 43.53% / 14.9%)",
              color: "rgba(255,255,255,0.85)",
              fontFamily: '"Inter Tight"',
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Plus size={14} />
            Ajouter un lien
          </button>

          <div style={{ flex: 1, minWidth: 0, textAlign: "right", paddingRight: 6 }}>
            {status !== "idle" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color:
                    status === "error"
                      ? "var(--jaws-orange)"
                      : status === "done"
                        ? "#7ee787"
                        : "rgba(255,255,255,0.6)",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {status === "done" && <Check size={13} />}
                {status === "error" && <AlertCircle size={13} />}
                {message}
              </span>
            )}
          </div>

          <SendButton onClick={generate} loading={status === "loading"} disabled={!canGenerate} />
        </div>
      </div>

      {pdfUrl && status === "done" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginTop: 18 }}
        >
          {failedUrls.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                marginBottom: 14,
                padding: "11px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,90,90,0.4)",
                background: "rgba(255,90,90,0.10)",
                color: "#ffb4b4",
                fontFamily: '"Inter Tight"',
                fontSize: 13,
                lineHeight: 1.45,
                textAlign: "left",
              }}
            >
              <AlertCircle size={16} color="#ff5a5a" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                {failedUrls.length} lien{failedUrls.length > 1 ? "s" : ""} corrompu
                {failedUrls.length > 1 ? "s" : ""} (non inclus dans le PDF)&nbsp;:
                <ul style={{ margin: "5px 0 0", paddingLeft: 18 }}>
                  {failedUrls.map((u) => (
                    <li
                      key={u}
                      style={{
                        color: "#ff8a8a",
                        textDecoration: "line-through",
                        wordBreak: "break-all",
                      }}
                    >
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 14 }}>
            <a href={pdfUrl} target="_blank" rel="noreferrer" style={ctaStyle}>
              <FileText size={15} /> Ouvrir en plein écran
            </a>
            <a
              href={pdfUrl}
              download="reperage-jaws.pdf"
              style={{ ...ctaStyle, background: "var(--jaws-orange)", color: "#fff", borderColor: "transparent" }}
            >
              <Download size={15} /> Télécharger le PDF
            </a>
          </div>
          <iframe
            title="Aperçu de la présentation"
            src={`${pdfUrl}#toolbar=1&view=FitH`}
            style={{
              width: "100%",
              aspectRatio: "16 / 10",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 14,
              background: "#0b0b0c",
              boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

const ctaStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  height: 40,
  padding: "0 18px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontFamily: '"Inter Tight"',
  fontSize: 14,
  fontWeight: 500,
  textDecoration: "none",
  backdropFilter: "blur(8px)",
};
