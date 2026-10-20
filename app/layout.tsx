import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Time Machine Mail',
  description: 'A chronological email workspace for messages anchored to chosen dates.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
