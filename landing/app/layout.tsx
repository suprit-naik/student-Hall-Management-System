import React from "react"
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import Dither from "@/components/Dither";
import FooterSection from "@/components/footer";
import { HeroHeader } from "@/components/header";

export const metadata: Metadata = {
  title: 'SHMC · Students Hall Management Center | C. V. Raman Global University',
  description: 'Room allotment, hostel fees, complaints and QR gate passes for the halls of residence at C. V. Raman Global University, Bhubaneswar.',
  icons: { icon: [{ url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' }, { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' }], apple: '/apple-icon.png' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <div className='absolute h-dvh max-h-155 w-full sm:max-h-115 md:max-h-125 lg:max-h-190 xl:max-h-195'>
          <Dither waveColor={[0.31, 0.31, 0.31]} disableAnimation={false} enableMouseInteraction mouseRadius={0.3}
            colorNum={4} pixelSize={2} waveAmplitude={0.3} waveFrequency={3} waveSpeed={0.05} />
        </div>
        <HeroHeader />
        {children}
        <FooterSection />
      </body>
    </html>
  )
}
