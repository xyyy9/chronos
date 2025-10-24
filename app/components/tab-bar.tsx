'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/app/components/ui/button';
import { useLocale } from '@/app/hooks/use-locale';

type TabConfig = {
  href: string;
  label: string;
};

type MinimalUser = {
  id: string;
  email: string;
  username: string;
};

type TabBarProps = {
  currentUser: MinimalUser | null;
};

const tabs: TabConfig[] = [
  { href: '/', label: 'Log' },
  { href: '/news', label: 'News' },
  { href: '/dashboard', label: 'Dashboard' },
];

const cn = (...inputs: Array<string | undefined | null | false>) =>
  inputs.filter(Boolean).join(' ');

export function TabBar({ currentUser }: TabBarProps) {
  const pathname = usePathname();
  const [locale] = useLocale();

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
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-[var(--selected-bg)] text-[var(--selected-foreground)] shadow-sm'
                    : 'text-[var(--interactive)] hover:bg-[var(--interactive)]/10',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <UserMenu currentUser={currentUser} locale={locale} />
      </div>
    </nav>
  );
}

function UserMenu({ currentUser, locale }: { currentUser: MinimalUser | null; locale: 'zh' | 'en' }) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const dropdownRef = React.useRef<HTMLDivElement | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const avatarLabel = React.useMemo(() => {
    if (currentUser?.username) {
      const trimmed = currentUser.username.trim();
      if (trimmed) {
        return trimmed[0]?.toUpperCase();
      }
    }
    if (currentUser?.email) {
      return currentUser.email[0]?.toUpperCase() ?? 'U';
    }
    return '?';
  }, [currentUser]);

  React.useEffect(() => {
    if (!dropdownOpen) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  React.useEffect(() => {
    if (!authOpen) {
      setLoading(false);
      setError(null);
      formRef.current?.reset();
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAuthOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authOpen]);

  const handleAvatarClick = () => {
    if (currentUser) {
      setDropdownOpen((prev) => !prev);
    } else {
      setAuthMode('signin');
      setAuthOpen(true);
    }
  };

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await fetch('/api/auth/sign-out', { method: 'POST' });
    window.location.reload();
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) {
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const endpoint = authMode === 'signin' ? '/api/auth/sign-in' : '/api/auth/sign-up';

    const payload = authMode === 'signin'
      ? {
          email: String(formData.get('email') ?? '').trim(),
          password: String(formData.get('password') ?? ''),
        }
      : {
          username: String(formData.get('username') ?? '').trim(),
          email: String(formData.get('email') ?? '').trim(),
          password: String(formData.get('password') ?? ''),
          confirmPassword: String(formData.get('confirmPassword') ?? ''),
        };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? '请求失败，请稍后再试。');
        setLoading(false);
        return;
      }

      window.location.reload();
    } catch (requestError) {
      console.error('auth-submit-error', requestError);
      setError('网络异常，请稍后重试。');
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setAuthMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setError(null);
    formRef.current?.reset();
  };

  const closeAuth = () => {
    setAuthOpen(false);
  };

  const modal = (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={closeAuth}
    >
      <div
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {authMode === 'signin' ? '登录 / Sign in' : '注册 / Sign up'}
          </h2>
          <button
            type="button"
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            onClick={closeAuth}
          >
            ✕
          </button>
        </div>

        <form ref={formRef} className="flex flex-col gap-4" onSubmit={handleAuthSubmit}>
          {authMode === 'signup' && (
            <div className="flex flex-col gap-1">
              <label htmlFor="auth-username" className="text-xs font-medium text-[var(--muted-foreground)]">
                用户名 / Username
              </label>
              <input
                id="auth-username"
                name="username"
                type="text"
                required
                minLength={2}
                className="rounded-md border border-[color:var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--interactive)]"
                placeholder="Chronos user"
                disabled={loading}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="auth-email" className="text-xs font-medium text-[var(--muted-foreground)]">
              邮箱 / Email
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              required
              className="rounded-md border border-[color:var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--interactive)]"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="auth-password" className="text-xs font-medium text-[var(--muted-foreground)]">
              密码 / Password
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              required
              minLength={6}
              className="rounded-md border border-[color:var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--interactive)]"
              placeholder="******"
              disabled={loading}
            />
          </div>

          {authMode === 'signup' && (
            <div className="flex flex-col gap-1">
              <label htmlFor="auth-confirm" className="text-xs font-medium text-[var(--muted-foreground)]">
                确认密码 / Confirm Password
              </label>
              <input
                id="auth-confirm"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className="rounded-md border border-[color:var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--interactive)]"
                placeholder="******"
                disabled={loading}
              />
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? authMode === 'signin'
                ? '正在登录…'
                : '正在注册…'
              : authMode === 'signin'
              ? '登录 / Sign in'
              : '注册 / Sign up'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
          {authMode === 'signin'
            ? locale === 'zh'
              ? '还没有账号？'
              : "Don't have an account?"
            : locale === 'zh'
            ? '已经有账号？'
            : 'Already have an account?'}{' '}
          <button
            type="button"
            className="font-semibold text-[var(--interactive)] hover:underline"
            onClick={toggleAuthMode}
            disabled={loading}
          >
            {authMode === 'signin'
              ? locale === 'zh'
                ? '立即注册'
                : 'Sign up now'
              : locale === 'zh'
              ? '去登录'
              : 'Go to sign in'}
          </button>
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleAvatarClick}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[var(--surface-raised)] text-xs font-semibold text[var(--muted-foreground)] transition hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--interactive)]"
        aria-haspopup="dialog"
        aria-expanded={authOpen || dropdownOpen}
      >
        <span className="sr-only">{currentUser ? 'Open account menu' : 'Open authentication dialog'}</span>
        <span aria-hidden="true">{avatarLabel}</span>
      </button>

      {currentUser && dropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-56 rounded-xl border border[color:var(--border)] bg-[var(--surface)] p-4 text-sm shadow-xl"
        >
          <p className="mb-2 font-semibold text-[var(--foreground)]">{currentUser.username}</p>
          <p className="mb-4 break-words text-xs text[var(--muted-foreground)]">{currentUser.email}</p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </div>
      )}

      {isMounted && !currentUser && authOpen ? createPortal(modal, document.body) : null}
    </div>
  );
}
