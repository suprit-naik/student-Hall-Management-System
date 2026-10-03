import { TextEffect } from "@/components/motion-primitives/text-effect";
import React from "react";
import { transitionVariants } from "@/lib/utils";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";

const steps = [
  ['01', 'Apply', 'Rank three room types and answer the lifestyle survey. Takes under five minutes.'],
  ['02', 'Get scored', 'S = 0.30 seniority + 0.25 distance + 0.20 CGPA + 0.15 need + 0.10 early application.'],
  ['03', 'Allotment run', 'The warden runs the engine. Highest score first, each gets the most compatible free bed in their preferences.'],
  ['04', 'Pay and move in', 'Hostel and mess invoices appear instantly. Pay online and download the receipt.'],
  ['05', 'Live in the hall', 'Raise complaints with an SLA clock, apply for leave, and walk out with a QR pass.'],
]

export default function Agenda() {
  return (
    <section id="how" className="scroll-mt-20 py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-y-12 px-2 lg:grid-cols-[1fr_auto]">
          <div className="text-center lg:text-left">
            <TextEffect triggerOnView preset="fade-in-blur" speedSegment={0.3} as="h2" className="mb-4 text-3xl font-semibold md:text-4xl">How it works</TextEffect>
            <p className="max-w-sm text-muted-foreground max-lg:mx-auto">From application to gate pass. The same rules apply to every student, and the warden can override only with a written reason.</p>
          </div>
          <AnimatedGroup triggerOnView variants={{ container: { visible: { transition: { staggerChildren: 0.05, delayChildren: 0.75 } } }, ...transitionVariants }}
            className="divide-y divide-dashed sm:mx-auto sm:max-w-lg lg:mx-0">
            {steps.map(([n, t, d]) => (
              <div key={n} className="py-6 first:pt-0">
                <div className="space-x-2 font-medium"><span className="font-mono text-muted-foreground">{n}</span><span>{t}</span></div>
                <p className="mt-4 text-muted-foreground">{d}</p>
              </div>
            ))}
          </AnimatedGroup>
        </div>
      </div>
    </section>
  )
}
