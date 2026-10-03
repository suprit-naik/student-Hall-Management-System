import { Card } from '@/components/ui/card'
import { BedDoubleIcon, UsersIcon, CreditCardIcon, TimerIcon, QrCodeIcon, BarChart3Icon } from 'lucide-react'
import React, { ReactNode } from 'react'
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { transitionVariants } from "@/lib/utils";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";

const features: [ReactNode, string, string][] = [
  [<BedDoubleIcon key="a" className="size-6" />, 'Score-based allotment', 'Seniority, distance from home, CGPA, special need and early application, weighted 30/25/20/15/10.'],
  [<UsersIcon key="b" className="size-6" />, 'Roommate matching', 'A five-question lifestyle survey. Nobody is placed with a roommate scoring below 0.6 compatibility.'],
  [<CreditCardIcon key="c" className="size-6" />, 'Fees and receipts', 'Invoices raised on allotment. Payment is marked paid only from the gateway\'s signed webhook.'],
  [<TimerIcon key="d" className="size-6" />, 'Complaints with SLA', 'Every complaint gets a deadline by category. Miss it and it escalates to the chief warden.'],
  [<QrCodeIcon key="e" className="size-6" />, 'Signed QR gate pass', 'Approved leave becomes an HMAC-signed QR. Edited or reused passes are rejected at the gate.'],
  [<BarChart3Icon key="f" className="size-6" />, 'Warden dashboard', 'Live occupancy by room type, pending dues, open complaints and who is out on leave.'],
]

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-16 md:py-32">
      <div className="@container mx-auto max-w-5xl px-6">
        <div className="text-center">
          <TextEffect triggerOnView preset="fade-in-blur" speedSegment={0.3} as="h2" className="text-balance text-4xl font-semibold lg:text-5xl">
            Everything the hall office does, in one place
          </TextEffect>
        </div>
        <AnimatedGroup triggerOnView variants={{ container: { visible: { transition: { staggerChildren: 0.05, delayChildren: 0.75 } } }, ...transitionVariants }}>
          <Card className="mx-auto mt-8 grid max-w-sm overflow-hidden *:text-center md:mt-16 @min-2xl:max-w-full @min-2xl:grid-cols-2 @min-4xl:grid-cols-3 [&>*]:border-b [&>*]:border-r">
            {features.map(([icon, title, text]) => (
              <div key={title} className="group p-6">
                <Decorator>{icon}</Decorator>
                <h3 className="mt-4 text-xl font-medium">{title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </Card>
        </AnimatedGroup>
      </div>
    </section>
  )
}

const Decorator = ({ children }: { children: ReactNode }) => (
  <div className="mask-radial-from-40% mask-radial-to-60% relative mx-auto size-32 [--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)]">
    <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[24px_24px] opacity-50" />
    <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">{children}</div>
  </div>
)
