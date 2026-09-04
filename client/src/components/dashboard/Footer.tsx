'use client';

import { ExternalLink, Mail, Phone } from 'lucide-react';

const contactLinks = [
  { href: 'mailto:developersaurabh001@gmail.com', label: 'Email', value: 'developersaurabh001@gmail.com', icon: Mail },
  { href: 'tel:+918720026790', label: 'Contact', value: '+91 87200 26790', icon: Phone },
  { href: 'https://github.com/SaurabhPandey016', label: 'GitHub', value: 'SaurabhPandey016', icon: ExternalLink },
  { href: 'https://www.linkedin.com/in/saurabhpandey-/', label: 'LinkedIn', value: 'Saurabh Pandey', icon: ExternalLink },
];

export default function Footer() {
  return (
    <footer className="border-t border-cyan-500/15 bg-[#050c18]/90 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 xl:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.6fr)] xl:items-end">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Aether Cloud</p>
            <h2 className="mt-2 text-xl font-black text-white">Your files, beautifully in sync.</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">A secure cloud workspace for uploading, organizing, discovering, and sharing important files with confidence.</p>
            <p className="mt-3 text-xs text-slate-500">Fast uploads · Protected sharing · Simple file control</p>
          </div>
          <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {contactLinks.map(({ href, label, value, icon: Icon }) => (
              <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="flex min-w-0 items-start gap-3 text-sm text-slate-400 transition hover:text-cyan-200">
                <Icon className="h-4 w-4 shrink-0 text-cyan-400" />
                <span className="min-w-0"><span className="block text-[10px] uppercase tracking-wider text-slate-500">{label}</span><span className="block wrap-break-word leading-5">{value}</span></span>
              </a>
            ))}
          </div>
        </div>
        <div className="mt-7 border-t border-cyan-500/10 pt-5 text-center text-sm text-slate-500">
          Made with <span className="text-rose-400">&#10084;</span> by <span className="font-semibold text-slate-300">Saurabh Pandey</span>
        </div>
      </div>
    </footer>
  );
}
