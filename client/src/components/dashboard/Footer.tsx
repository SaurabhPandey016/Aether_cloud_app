'use client';

import { ArrowUpRight, ExternalLink, Heart, Mail, Phone, ShieldCheck, Sparkles } from 'lucide-react';

const contactLinks = [
  { href: 'mailto:developersaurabh001@gmail.com', label: 'Email', value: 'developersaurabh001@gmail.com', icon: Mail },
  { href: 'tel:+918720026790', label: 'Contact', value: '+91 87200 26790', icon: Phone },
  { href: 'https://github.com/SaurabhPandey016', label: 'GitHub', value: 'View source and projects', icon: ExternalLink },
  { href: 'https://www.linkedin.com/in/saurabhpandey-/', label: 'LinkedIn', value: 'Connect professionally', icon: ExternalLink },
];

export default function Footer() {
  return (
    <footer className="border-t border-cyan-500/15 bg-linear-to-b from-[#07101f] to-[#030914] px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_1.35fr]">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Aether Cloud</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-white">Your files, in sync.</h2>
              </div>
            </div>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">A calm, secure workspace for uploading, organizing, discovering, and sharing the files that matter.</p>
            <div className="mt-5 flex flex-wrap gap-2"><span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/15 bg-cyan-500/5 px-3 py-1.5 text-xs text-cyan-200"><ShieldCheck className="h-3.5 w-3.5" /> Secure sharing</span><span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/15 bg-cyan-500/5 px-3 py-1.5 text-xs text-cyan-200"><Sparkles className="h-3.5 w-3.5" /> Simple control</span></div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
            <div className="mt-4 space-y-3 text-sm text-slate-400"><p>My Files</p><p>Shared With Me</p><p>Starred &amp; Trash</p><p>Viewer and Editor access</p></div>
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {contactLinks.map(({ href, label, value, icon: Icon }) => (
              <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} aria-label={`${label}: ${value}`} className="group flex min-w-0 items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/20 p-3 text-sm text-slate-400 transition hover:border-cyan-500/25 hover:bg-cyan-500/5 hover:text-cyan-200">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400 transition group-hover:scale-110" />
                <span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span><span className="mt-1 block wrap-break-word leading-5">{value}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-300" />
              </a>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-cyan-500/10 pt-5 text-center text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span>Built for focused file work.</span>
          <span className="inline-flex items-center gap-1.5">Made with <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" /> by <span className="font-semibold text-slate-300">Saurabh Pandey</span></span>
        </div>
      </div>
    </footer>
  );
}
