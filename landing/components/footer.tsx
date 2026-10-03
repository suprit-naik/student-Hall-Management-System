import React from "react";

const team = ['Sk Mustakim Ali · 2301020456', 'Suprit Kumar Naik · 2301020457', 'Sweta Samantaray · 2301020459']

export default function FooterSection() {
  return (
    <footer className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <img src="/cgu.png" alt="C. V. Raman Global University" width={48} height={48} className="mx-auto" />
        <p className="mt-6 font-medium">Students Hall Management Center</p>
        <p className="text-sm text-muted-foreground">Software Engineering case study · Department of CSE, C. V. Raman Global University, Bhubaneswar</p>
        <div className="my-8 flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-sm text-muted-foreground">
          {team.map(t => <span key={t}>{t}</span>)}
        </div>
        <p className="font-mono text-sm text-muted-foreground">Guide: Sibun Nath · <a className="text-foreground underline" href="https://github.com/suprit-naik/student-Hall-Management-System">Source on GitHub</a></p>
      </div>
    </footer>
  )
}
