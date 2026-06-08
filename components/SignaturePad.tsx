"use client";
import { useRef, useState, useEffect } from "react";

// Captures a signature as a PNG data-URL via onChange.
// Two modes: draw (canvas) or type (renders typed name to canvas).
export default function SignaturePad({ onChange }: { onChange: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typed, setTyped] = useState("");
  const drawing = useRef(false);

  function ctx() { return canvasRef.current?.getContext("2d") || null; }

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const g = c.getContext("2d"); if (!g) return;
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = "#1a1a1a"; g.lineWidth = 2; g.lineCap = "round";
  }, []);

  function pos(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function down(e: React.PointerEvent) {
    if (mode !== "draw") return;
    drawing.current = true; const g = ctx(); if (!g) return;
    const p = pos(e); g.beginPath(); g.moveTo(p.x, p.y);
  }
  function moveDraw(e: React.PointerEvent) {
    if (!drawing.current || mode !== "draw") return;
    const g = ctx(); if (!g) return; const p = pos(e); g.lineTo(p.x, p.y); g.stroke();
  }
  function up() {
    if (mode !== "draw") return;
    drawing.current = false;
    if (canvasRef.current) onChange(canvasRef.current.toDataURL("image/png"));
  }
  function clear() {
    const c = canvasRef.current, g = ctx(); if (!c || !g) return;
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    setTyped(""); onChange("");
  }
  function renderTyped(text: string) {
    setTyped(text);
    const c = canvasRef.current, g = ctx(); if (!c || !g) return;
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = "#1a1a1a"; g.font = "32px Georgia, serif"; g.textBaseline = "middle";
    g.fillText(text, 12, c.height / 2);
    onChange(text ? c.toDataURL("image/png") : "");
  }

  return (
    <div>
      <div style={{ position: "relative", border: "1px solid var(--line)", borderRadius: 8, width: 280 }}>
        <canvas
          ref={canvasRef} width={280} height={110}
          style={{ touchAction: "none", display: "block", borderRadius: 8 }}
          onPointerDown={down} onPointerMove={moveDraw} onPointerUp={up} onPointerLeave={up}
        />
        <button type="button" onClick={clear}
          style={{ position: "absolute", left: 8, bottom: 8, background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)" }}>✕</button>
      </div>
      {mode === "type" && (
        <input className="input" style={{ marginTop: ".4rem", width: 280 }}
          placeholder="Type your name" value={typed}
          onChange={(e) => renderTyped(e.target.value)} />
      )}
      <div className="sans" style={{ display: "flex", gap: "1rem", fontSize: ".8rem", marginTop: ".3rem", width: 280, justifyContent: "center" }}>
        <button type="button" onClick={() => setMode("draw")}
          style={{ background: "none", border: "none", cursor: "pointer", color: mode === "draw" ? "var(--accent)" : "var(--muted)", borderBottom: mode === "draw" ? "2px solid var(--accent)" : "none" }}>draw</button>
        <button type="button" onClick={() => { setMode("type"); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: mode === "type" ? "var(--accent)" : "var(--muted)", borderBottom: mode === "type" ? "2px solid var(--accent)" : "none" }}>type</button>
      </div>
    </div>
  );
}
