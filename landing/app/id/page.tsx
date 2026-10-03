"use client";
import { useEffect, useState } from "react";
import LanyardWithControls from "@/components/lanyard-with-controls";
import type { CardData } from "@/components/card-template";
import { Button } from "@/components/ui/button";

type State = { status: "loading" } | { status: "out" } | { status: "staff"; name: string } | { status: "ok"; card: CardData; pass: boolean; room?: string };

export default function IdPage() {
  const [s, setS] = useState<State>({ status: "loading" });
  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("shmc") || "null")?.token;
    if (!token) return setS({ status: "out" });
    const get = (p: string) => fetch("/api" + p, { headers: { Authorization: "Bearer " + token } }).then(r => r.ok ? r.json() : Promise.reject(r.status));
    get("/me").then(async me => {
      if (me.role !== "student") return setS({ status: "staff", name: me.name });
      const pass = (await get("/leaves")).find((l: any) => l.status === "APPROVED" && !l.in_at && Date.parse(l.to_ts) > Date.now());
      setS({ status: "ok", pass: !!pass, room: me.room?.room_no,
        card: { name: me.name, roll: me.login, room: me.room?.room_no, hall: me.room?.hall.replace(" Hall", ""), qr: pass?.token } });
    }).catch(() => setS({ status: "out" }));
  }, []);

  return (
    <main className="overflow-x-hidden">
      <section className="lg:h-screen">
        <div className="pb-24 pt-28 lg:grid lg:grid-cols-2 lg:pt-44">
          <div className="relative mx-auto max-w-xl px-6 text-center lg:mt-16 lg:text-left">
            <p className="font-mono uppercase text-muted-foreground">Digital hall ID</p>
            {s.status === "loading" && <h1 className="mt-4 text-5xl font-semibold">Loading...</h1>}
            {s.status === "out" && <>
              <h1 className="mt-4 text-5xl font-semibold md:text-6xl">Sign in to see your card</h1>
              <p className="mt-6 rounded-md bg-black/70 p-1 text-lg text-muted-foreground">Your ID card is generated from your allotment record: name, roll number, hall and room.</p>
              <Button asChild size="lg" className="mt-10"><a href="/portal/?next=/id/">Sign in to the portal</a></Button>
            </>}
            {s.status === "staff" && <>
              <h1 className="mt-4 text-5xl font-semibold">Hello, {s.name}</h1>
              <p className="mt-6 text-lg text-muted-foreground">ID cards are issued to resident students. Staff accounts don't have one.</p>
              <Button asChild size="lg" className="mt-10"><a href="/portal/">Back to the portal</a></Button>
            </>}
            {s.status === "ok" && <>
              <h1 className="mt-4 text-5xl font-semibold md:text-6xl">{s.card.name}</h1>
              <p className="mt-6 font-mono text-lg text-muted-foreground">{s.card.roll}{s.room ? ` · ${s.card.hall} · ${s.room}` : " · room not allotted yet"}</p>
              <p className="mt-6 max-w-md rounded-md bg-black/70 p-1 text-muted-foreground">
                {s.pass ? "You have an approved leave, so the QR on the back of this card is your signed gate pass. Flip the card and show it at the gate."
                  : "The QR on the back opens the SHMC portal. When the warden approves a leave, it turns into your signed gate pass."}
              </p>
              <Button asChild size="lg" variant="outline" className="mt-10"><a href="/portal/">Back to the portal</a></Button>
            </>}
          </div>
          {s.status === "ok" && <LanyardWithControls initial={s.card} editable={false}
            containerClassName="lg:absolute lg:top-0 lg:right-0 lg:w-1/2 relative w-full h-screen select-none" />}
        </div>
      </section>
    </main>
  );
}
