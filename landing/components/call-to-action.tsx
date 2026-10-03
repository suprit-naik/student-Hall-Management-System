import { Button } from '@/components/ui/button'
import { TextEffect } from "./motion-primitives/text-effect"
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";
import { transitionVariants } from "@/lib/utils";

export default function CallToAction() {
  return (
    <section className="mx-2 py-16">
      <div className="mx-auto max-w-5xl rounded-3xl border px-6 py-12 md:py-20 lg:py-28">
        <div className="text-center">
          <TextEffect triggerOnView preset="fade-in-blur" speedSegment={0.3} as="h2" className="text-balance text-4xl font-semibold lg:text-5xl">Allotment for 2026-27 is open</TextEffect>
          <TextEffect triggerOnView preset="fade-in-blur" speedSegment={0.3} delay={0.3} as="p" className="mt-4 text-muted-foreground">
            Sign in with your roll number or staff ID to apply, pay and track everything in one place.
          </TextEffect>
          <AnimatedGroup triggerOnView variants={{ container: { visible: { transition: { staggerChildren: 0.05, delayChildren: 0.75 } } }, ...transitionVariants }}
            className="mt-12 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg"><a href="/portal/">Sign in to the portal</a></Button>
            <Button asChild size="lg" variant="outline"><a href="/id/">View my 3D ID card</a></Button>
          </AnimatedGroup>
        </div>
      </div>
    </section>
  )
}
