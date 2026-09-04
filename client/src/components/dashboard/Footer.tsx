'use client';

import { ExternalLink, Mail, Phone, ShieldCheck, Sparkles } from 'lucide-react';

const contactLinks = [
  { href: 'mailto:developersaurabh001@gmail.com', label: 'Email', value: 'developersaurabh001@gmail.com', icon: Mail },
  { href: 'tel:+918720026790', label: 'Contact', value: '+91 87200 26790', icon: Phone },
  { href: 'https://github.com/SaurabhPandey016', label: 'GitHub', value: 'SaurabhPandey016', icon: ExternalLink },
  { href: 'https://www.linkedin.com/in/saurabhpandey-/', label: 'LinkedIn', value: 'Saurabh Pandey', icon: ExternalLink },
];

export default function Footer() {
  return (
    <footer className="border-t border-cyan-500/15 bg-linear-to-b from-[#07101f] to-[#030914] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr_1.4fr]">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Aether Cloud</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Your files, beautifully in sync.</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">A calm, secure workspace for uploading, organizing, discovering, and sharing the files that matter.</p>
            <div className="mt-5 flex flex-wrap gap-2"><span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/15 bg-cyan-500/5 px-3 py-1.5 text-xs text-cyan-200"><ShieldCheck className="h-3.5 w-3.5" /> Secure sharing</span><span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/15 bg-cyan-500/5 px-3 py-1.5 text-xs text-cyan-200"><Sparkles className="h-3.5 w-3.5" /> Simple control</span></div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
            <div className="mt-4 space-y-3 text-sm text-slate-400"><p>My Files</p><p>Shared With Me</p><p>Starred &amp; Trash</p><p>Viewer and Editor access</p></div>
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {contactLinks.map(({ href, label, value, icon: Icon }) => (
              <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="flex min-w-0 items-start gap-3 rounded-xl border border-transparent p-2 text-sm text-slate-400 transition hover:border-cyan-500/15 hover:bg-cyan-500/5 hover:text-cyan-200">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                <span className="min-w-0"><span className="block text-[10px] uppercase tracking-wider text-slate-500">{label}</span><span className="mt-1 block wrap-break-word leading-5">{value}</span></span>
              </a>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-cyan-500/10 pt-5 text-center text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span>Built for focused file work.</span>
          <span>Made with <span className="text-rose-400">&#10084;</span> by <span className="font-semibold text-slate-300">Saurabh Pandey</span></span>
        </div>
      </div>
    </footer>
  );
}
