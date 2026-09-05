'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

const LandingPage = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Redirect authenticated users to dashboard (after loading complete)
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const features = [
    { icon: '📁', title: 'Smart organization', description: 'Create folders, keep your files clean, and build a workspace that feels effortless.' },
    { icon: '🔗', title: 'Instant sharing', description: 'Share documents with teammates or generate secure public links without friction.' },
    { icon: '🔍', title: 'Fast search', description: 'Find any file instantly with a reliable full-text search experience across your library.' },
    { icon: '⭐', title: 'Favorites', description: 'Pin the files you rely on most and keep them at your fingertips.' },
    { icon: '🗑️', title: 'Trash recovery', description: 'Restore or permanently remove files with a clear, safe retention flow.' },
    { icon: '🔐', title: 'Secure by design', description: 'A clean, privacy-focused storage experience built for trust and everyday use.' },
  ];

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <header className={`fixed inset-x-0 top-0 z-50 border-b transition-colors ${isScrolled ? 'border-cyan-500/20 bg-[#020817]/85 backdrop-blur-xl' : 'border-transparent bg-transparent'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 to-purple-600 shadow-[0_0_25px_rgba(45,212,191,0.45)]">
              <span className="text-lg font-black text-white">A</span>
            </div>
            <div className="text-lg font-semibold tracking-tight text-white">Aether Cloud</div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-cyan-300">Features</a>
            <a href="#security" className="transition hover:text-cyan-300">Security</a>
            <a href="#pricing" className="transition hover:text-cyan-300">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300">Sign in</Link>
            <Link href="/signup" className="rounded-full bg-linear-to-r from-cyan-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_30px_rgba(34,211,238,0.3)] transition hover:brightness-110">Get started</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-5 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-36">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-6 inline-flex rounded-full border border-cyan-500/25 bg-cyan-500/8 px-3 py-1.5 text-xs font-medium text-cyan-300">
                Secure cloud storage for modern teams
              </div>

              <h1 className="max-w-xl text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl lg:text-7xl">
                Store your files with a premium cloud experience.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                Organize, upload, share, and access everything from one clean and secure workspace designed to feel professional from the first click.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="rounded-xl bg-linear-to-r from-cyan-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(34,211,238,0.3)] transition hover:brightness-110">Create account</Link>
                <Link href="/login" className="rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300">View dashboard</Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-8 text-sm text-slate-300">
                <div>
                  <div className="text-2xl font-black text-white">10K+</div>
                  <div>Files synced</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">99.9%</div>
                  <div>Uptime</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">4.9/5</div>
                  <div>User rating</div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-cyan-500/20 bg-[#0b1220]/80 p-4 shadow-[0_20px_70px_rgba(8,145,178,0.15)]">
              <div className="rounded-[22px] border border-slate-800 bg-[#0f172a] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-cyan-400" />
                    <div className="h-3 w-3 rounded-full bg-violet-500" />
                    <div className="h-3 w-3 rounded-full bg-slate-500" />
                  </div>
                  <div className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">AetherCloud</div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-cyan-500/25 bg-[#111827] p-4">
                    <div className="mb-3 text-xs uppercase tracking-[0.24em] text-slate-400">Storage</div>
                    <div className="text-3xl font-black text-white">2.4 GB</div>
                    <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full w-[68%] rounded-full bg-linear-to-r from-cyan-500 to-purple-600" />
                    </div>
                    <div className="mt-3 text-xs text-slate-400">68% of 4 GB used</div>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-[#111827] p-4">
                    <div className="mb-3 text-xs uppercase tracking-[0.24em] text-slate-400">Shared</div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-slate-900 p-2 text-sm text-slate-200">
                        <span>Team brief</span>
                        <span className="text-cyan-300">PDF</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-slate-900 p-2 text-sm text-slate-200">
                        <span>Design deck</span>
                        <span className="text-violet-300">PPT</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {['Photos', 'Documents', 'Projects'].map((label, index) => (
                    <div key={label} className="rounded-2xl border border-slate-700 bg-[#121b2d] p-3 text-center">
                      <div className="mb-2 text-2xl">{['🖼️', '📄', '📁'][index]}</div>
                      <div className="text-sm text-slate-200">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Features</div>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Everything you need to manage your files.</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-cyan-500/18 bg-[#0b1220]/90 p-6 shadow-[0_18px_42px_rgba(15,23,42,0.6)]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500/20 to-purple-600/20 text-2xl">{feature.icon}</div>
                <h3 className="mb-3 text-xl font-bold text-white">{feature.title}</h3>
                <p className="leading-7 text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="security" className="mx-auto max-w-7xl px-5 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-[30px] border border-cyan-500/20 bg-linear-to-r from-cyan-500/8 via-slate-900 to-violet-500/8 p-8 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Security first</div>
                <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Built to keep your content protected and easy to manage.</h2>
                <p className="mt-5 max-w-xl leading-7 text-slate-300">
                  Aether Cloud keeps your dashboard clean, secure, and dependable with a streamlined experience for uploads, backups, folders, sharing, and recovery.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ['256-bit', 'encryption'],
                  ['24/7', 'access'],
                  ['30-day', 'restore window'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-slate-700 bg-[#0b1220]/80 p-5 text-center">
                    <div className="text-2xl font-black text-cyan-300">{value}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-cyan-500/15 bg-[#030b16]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 lg:grid-cols-5 lg:px-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 to-purple-600 shadow-[0_0_25px_rgba(45,212,191,0.45)]">
                <span className="text-lg font-black text-white">A</span>
              </div>
              <div className="text-lg font-semibold tracking-tight text-white">Aether Cloud</div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              Premium file storage and collaboration product designed for portfolio projects, business demos, and real-world cloud workflows.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Product</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#features" className="transition hover:text-cyan-300">Features</a></li>
              <li><a href="#security" className="transition hover:text-cyan-300">Security</a></li>
              <li><a href="#pricing" className="transition hover:text-cyan-300">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Company</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="/login" className="transition hover:text-cyan-300">Login</a></li>
              <li><a href="/signup" className="transition hover:text-cyan-300">Register</a></li>
              <li><a href="/dashboard" className="transition hover:text-cyan-300">Dashboard</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Contact</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>hello@aethercloud.app</li>
              <li>Portfolio-ready product</li>
              <li>Built for showcase</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-5 text-sm text-slate-400 sm:px-6 lg:flex-row lg:px-8">
            <div>© 2026 Aether Cloud. All rights reserved.</div>
            <span>Made with <span className="text-rose-400">&#10084;</span> by <span className="font-semibold text-slate-300">Saurabh Pandey</span></span>
            <div className="flex gap-5">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
