'use client'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'

const nav = [['Features', '/#features'], ['How it works', '/#how'], ['My ID card', '/id/']]

export const HeroHeader = () => {
  const [open, setOpen] = React.useState(false)
  return (
    <header>
      <nav data-state={open && 'active'} className="bg-background/50 fixed z-20 w-full border-b backdrop-blur-3xl">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full items-center justify-between lg:w-auto">
              <Link href="/" aria-label="home" className="flex items-center gap-2">
                <img src="/cgu.png" alt="" width={30} height={30} />
                <span className="font-mono">SHMC · CGU</span>
              </Link>
              <button onClick={() => setOpen(!open)} aria-label={open ? 'Close Menu' : 'Open Menu'} className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>
            <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-col gap-6 rounded-3xl border p-6 lg:m-0 lg:flex lg:w-fit lg:flex-row lg:items-center lg:border-transparent lg:bg-transparent lg:p-0">
              {nav.map(([t, h]) => <Link key={h} href={h} className="text-sm text-muted-foreground hover:text-foreground">{t}</Link>)}
              <Button asChild size="sm"><a href="/portal/">Sign in to portal</a></Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
