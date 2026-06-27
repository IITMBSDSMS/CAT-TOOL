import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Healix Campus Insights Platform',
  description: 'Research Intelligence Dashboard for Campus Ambassadors — Healix Technologies Pvt. Ltd.',
  keywords: 'research, campus, analytics, healix, survey, students',
  authors: [{ name: 'Healix Technologies Pvt. Ltd.' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
