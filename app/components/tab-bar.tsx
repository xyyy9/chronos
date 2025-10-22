'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type TabConfig = {
  href: string;
  label: string;
};

const tabs: TabConfig[] = [
  { href: '/', label: 'Log' },
  { href: '/news', label: 'News' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== '/' && pathname.startsWith(tab.href));

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[var(--selected-bg)] text-[var(--selected-foreground)] shadow-sm'
                    : 'text-[var(--interactive)] hover:bg-[var(--interactive)]/10'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[var(--surface-raised)] text-xs font-semibold text-[var(--muted-foreground)]">
          <span className="sr-only">Profile placeholder</span>
          <span aria-hidden="true">U</span>
        </div>
      </div>
    </nav>
  );
}
