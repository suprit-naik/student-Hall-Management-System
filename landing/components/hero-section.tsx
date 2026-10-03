import React from 'react'
import { Button } from '@/components/ui/button'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";
import DecryptedText from "@/components/DecryptedText";
import { transitionVariants } from "@/lib/utils";
import LanyardWithControls from "@/components/lanyard-with-controls";

const group = { container: { visible: { transition: { staggerChildren: 0.05, delayChildren: 0.75 } } }, ...transitionVariants }
const stack = ['Node.js 22', 'Express', 'SQLite', 'HMAC-SHA256', 'QR gate pass', 'Rule-based allotment', 'SLA escalation']

export default function HeroSection() {
  return (
    <main className="overflow-x-hidden">
      <section className='lg:h-screen'>
        <div className="pb-24 pt-12 md:pb-32 lg:grid lg:grid-cols-2 lg:pb-56 lg:pt-44">
          <div className="relative mx-auto flex max-w-xl flex-col px-6 lg:block">
            <div className="mx-auto max-w-2xl text-center lg:ml-0 lg:text-left">
              <div className='mt-8 lg:mt-16'>
                <DecryptedText text="Session 2026-27 · CGU, Bhubaneswar" animateOn="view" revealDirection="start"
                  sequential useOriginalCharsOnly={false} speed={60} className='rounded-md bg-black font-mono uppercase text-muted-foreground' />
              </div>
              <TextEffect preset="fade-in-blur" speedSegment={0.3} as="h1" className="max-w-2xl text-balance text-6xl font-semibold md:text-7xl xl:text-8xl">Your hall,</TextEffect>
              <TextEffect preset="fade-in-blur" speedSegment={0.3} as="h1" className="max-w-2xl text-balance text-6xl font-semibold md:text-7xl xl:text-8xl">no queues.</TextEffect>
              <TextEffect per="line" preset="fade-in-blur" speedSegment={0.3} delay={0.5} as="p"
                className="mt-8 max-w-2xl rounded-md bg-black p-1 text-pretty text-lg text-muted-foreground">
                Apply for a room, pay hostel fees, raise complaints and get a signed QR gate pass from one portal. Rooms are allotted by a published score, not by who reached the office first.
              </TextEffect>
              <AnimatedGroup variants={group} className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                <Button asChild size="lg" className="px-5 text-base"><a href="/portal/">Open the portal</a></Button>
                <Button asChild size="lg" variant="ghost" className="bg-black/30 px-5 text-base backdrop-blur-sm hover:bg-black/40"><a href="#how">How allotment works</a></Button>
              </AnimatedGroup>
            </div>
          </div>
          <LanyardWithControls position={[0, 0, 20]}
            containerClassName='lg:absolute lg:top-0 lg:right-0 lg:w-1/2 relative w-full h-screen bg-radial lg:from-transparent lg:to-transparent from-muted to-background select-none' />
        </div>
      </section>
      <section className="bg-background pb-16 md:pb-32">
        <AnimatedGroup variants={group} className="group relative m-auto max-w-6xl px-6">
          <div className="flex flex-col items-center md:flex-row">
            <div className="md:max-w-44 md:border-r md:pr-6"><p className="text-end font-mono text-sm uppercase">Built with</p></div>
            <div className="relative py-6 md:w-[calc(100%-11rem)]">
              <InfiniteSlider speedOnHover={20} speed={40} gap={80}>
                {stack.map(s => <span key={s} className="font-mono text-sm text-foreground">{s}</span>)}
              </InfiniteSlider>
              <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-20" />
              <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-20" />
              <ProgressiveBlur className="pointer-events-none absolute left-0 top-0 h-full w-20" direction="left" blurIntensity={1} />
              <ProgressiveBlur className="pointer-events-none absolute right-0 top-0 h-full w-20" direction="right" blurIntensity={1} />
            </div>
          </div>
        </AnimatedGroup>
      </section>
    </main>
  )
}
