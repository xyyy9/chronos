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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[color:var(--border)] bg-[var(--surface)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch gap-2 px-6 py-3">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition ${
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
    </nav>
  );
}
