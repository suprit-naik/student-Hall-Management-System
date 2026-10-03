"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Lanyard from "@/components/ui/lanyard";
import { Button } from "@/components/ui/button";
import CardTemplate, { type CardData, type CardTemplateRef, type CardVariant } from "@/components/card-template";
import { Download } from "lucide-react";

const EMPTY: CardData = { name: "" };
interface Props { position?: [number, number, number]; containerClassName?: string; initial?: CardData; editable?: boolean }

export default function LanyardWithControls({ position = [0, 0, 20], containerClassName, initial = EMPTY, editable = true }: Props) {
  const [draft, setDraft] = useState<CardData>(initial);
  const [applied, setApplied] = useState<CardData>(initial);
  const [variant, setVariant] = useState<CardVariant>("dark");
  const [texture, setTexture] = useState<string>();
  const [key, setKey] = useState(0);
  const ref = useRef<CardTemplateRef>(null);

  const onTexture = useCallback((url: string) => { setTexture(url); setKey(k => k + 1); }, []);
  useEffect(() => { setDraft(initial); setApplied(initial); }, [initial]);
  useEffect(() => { ref.current?.captureTexture(); }, [applied, variant]);

  const changed = draft.name !== applied.name || draft.roll !== applied.roll;
  const apply = () => setApplied(draft);
  const input = "h-10 rounded-md border border-border bg-background px-3 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex flex-col">
      <CardTemplate ref={ref} data={applied} variant={variant} onTextureReady={onTexture} />
      {texture
        ? <Lanyard key={key} position={position} containerClassName={containerClassName} cardTextureUrl={texture} />
        : <div className={containerClassName}><div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></div>}
      <div className="px-6 pb-8 lg:absolute lg:bottom-8 lg:right-6 lg:w-[30rem] lg:px-0">
        <div className="mx-auto max-w-md lg:ml-auto">
          <div className="mb-3 flex items-center justify-between">
            <span className="bg-background p-1 text-sm font-medium text-muted-foreground">{editable ? "Preview your hall ID card" : "Your hall ID card"}</span>
            <div className="flex gap-3">
              {(["dark", "light"] as const).map(v => (
                <button key={v} aria-label={v} onClick={() => setVariant(v)}
                  className={`h-6 w-6 rounded-full border-2 ${v === "dark" ? "bg-black" : "bg-white"} ${variant === v ? "border-primary ring-2 ring-primary/30" : "border-border"}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {editable && <>
              <input className={`${input} w-0 flex-[3]`} placeholder="Your name" maxLength={20} value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })} onKeyDown={e => e.key === "Enter" && changed && apply()} />
              <input className={`${input} w-0 flex-[2]`} placeholder="Roll no." maxLength={10} value={draft.roll || ""}
                onChange={e => setDraft({ ...draft, roll: e.target.value.replace(/\D/g, "") })} onKeyDown={e => e.key === "Enter" && changed && apply()} />
              <Button onClick={apply} disabled={!changed}>Apply</Button>
            </>}
            <Button variant="outline" size={editable ? "icon" : "default"} onClick={() => ref.current?.exportCard()} title="Export as PNG">
              <Download className="h-4 w-4" />{!editable && <span className="ml-2">Download PNG</span>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
