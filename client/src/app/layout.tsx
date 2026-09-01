import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AetherCloud - Cloud File Storage',
  description: 'Secure cloud file storage and sharing platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
        {children}
      </body>
    </html>
  );
}
