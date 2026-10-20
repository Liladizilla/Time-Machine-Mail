import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Time Machine Mail',
  description: 'A chronological email workspace for messages anchored to chosen dates.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><Script src="/runtime-config.js" strategy="beforeInteractive" /></head><body>{children}</body></html>;
}
