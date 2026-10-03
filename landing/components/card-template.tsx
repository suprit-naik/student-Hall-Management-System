"use client";
// Draws the SHMC hall-resident ID card onto a 1376x1376 canvas that is mapped onto card.glb.
// Front of the card = left half of the canvas, back = right half (same UV layout as the template).
import { forwardRef, useImperativeHandle } from "react";
import QRCode from "qrcode";

export type CardVariant = "dark" | "light";
export interface CardData { name: string; roll?: string; room?: string; hall?: string; qr?: string }
export interface CardTemplateRef { captureTexture: () => Promise<void>; exportCard: () => void }
interface Props { data: CardData; variant: CardVariant; onTextureReady: (url: string) => void }

const S = 1376, CROP = 334;
let logo: Promise<HTMLImageElement> | null = null;   // loaded once and reused for every redraw
const getLogo = () => logo ??= new Promise(r => { const i = new Image(); i.onload = i.onerror = () => r(i); i.src = "/cgu.png"; });

async function draw(data: CardData, variant: CardVariant) {
  await document.fonts.ready;
  const css = getComputedStyle(document.body);
  const mono = css.getPropertyValue("--font-geist-mono") || "monospace", sans = css.getPropertyValue("--font-geist-sans") || "sans-serif";
  const dark = variant === "dark", fg = dark ? "#fff" : "#000", mute = dark ? "#8a8a8a" : "#6b6b6b", bg = dark ? "#000" : "#fff";
  const c = document.createElement("canvas"); c.width = c.height = S;
  const x = c.getContext("2d")!;
  x.fillStyle = bg; x.fillRect(0, 0, S, S);

  // ---- front (left half) ----
  x.drawImage(await getLogo(), 56, 70, 150, 150);
  x.fillStyle = fg; x.font = `600 58px ${sans}`; x.textAlign = "left"; x.textBaseline = "alphabetic";
  x.fillText("Students Hall", 56, 310); x.fillText("Management Center", 56, 378);
  x.fillStyle = mute; x.font = `400 26px ${mono}`; x.fillText("C. V. RAMAN GLOBAL UNIVERSITY", 58, 425);
  // chevron pattern, like the template
  x.save(); x.beginPath(); x.rect(0, 470, 688, 300); x.clip();
  x.strokeStyle = dark ? "#2e2e2e" : "#d6d6d6"; x.lineWidth = 3;
  for (let i = -20; i < 40; i++) { x.beginPath(); x.moveTo(i * 34, 470); x.lineTo(i * 34 + 344, 770); x.moveTo(i * 34 + 344, 470); x.lineTo(i * 34, 770); x.stroke(); }
  x.restore();
  x.textAlign = "right"; x.fillStyle = mute; x.font = `400 34px ${mono}`;
  x.fillText(`HALL RESIDENT ${data.hall ? "· " + data.hall.toUpperCase() : "· 2026-27"}`.slice(0, 26), 633, 850);
  x.fillStyle = fg; x.font = `400 48px ${mono}`; x.fillText((data.name || "YOUR NAME").toUpperCase().slice(0, 20), 633, 925);
  x.fillStyle = mute; x.font = `400 34px ${mono}`;
  x.fillText([data.roll, data.room].filter(Boolean).join(" · ") || "ROLL NO. · ROOM", 633, 985);

  // ---- back (right half): QR panel ----
  x.fillStyle = dark ? "#121212" : "#f1f1f1"; x.beginPath(); x.roundRect(742, 250, 584, 650, 24); x.fill();
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, data.qr || `${location.origin}/portal/`, { width: 480, margin: 1, color: { dark: dark ? "#ffffff" : "#000000", light: dark ? "#121212" : "#f1f1f1" } });
  x.drawImage(qr, 794, 290, 480, 480);
  x.fillStyle = mute; x.font = `400 24px ${mono}`; x.textAlign = "center";
  x.fillText(data.qr && !data.qr.startsWith("http") ? "SCAN AT HALL GATE" : "SCAN TO OPEN THE SHMC PORTAL", 1034, 830);
  return c;
}

const CardTemplate = forwardRef<CardTemplateRef, Props>(({ data, variant, onTextureReady }, ref) => {
  useImperativeHandle(ref, () => ({
    captureTexture: async () => onTextureReady((await draw(data, variant)).toDataURL("image/png")),
    exportCard: async () => {
      const full = await draw(data, variant), out = document.createElement("canvas");
      out.width = S; out.height = S - CROP; out.getContext("2d")!.drawImage(full, 0, 0);
      const a = document.createElement("a");
      a.download = `shmc-id-${(data.roll || data.name || "card").replace(/\s+/g, "-")}.png`; a.href = out.toDataURL("image/png"); a.click();
    },
  }));
  return null;
});
CardTemplate.displayName = "CardTemplate";
export default CardTemplate;
