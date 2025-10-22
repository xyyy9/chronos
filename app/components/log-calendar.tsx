'use client';

import * as React from 'react';

import { formatDateKey } from '@/app/lib/date-utils';

type LogCalendarProps = {
  currentMonth: Date;
  selectedDate: string;
  loggedDates: Set<string>;
  onMonthChange: (offset: number) => void;
  onSelectDate: (dateKey: string) => void;
  locale?: 'zh' | 'en';
  legendText?: string;
};

const cn = (...inputs: Array<string | undefined | null | false>) =>
  inputs.filter(Boolean).join(' ');

export function LogCalendar({
  currentMonth,
  selectedDate,
  loggedDates,
  onMonthChange,
  onSelectDate,
  locale = 'zh',
  legendText,
}: LogCalendarProps) {
  const year = currentMonth.getFullYear();
  const monthIndex = currentMonth.getMonth();

  const isZh = locale === 'zh';
  const weekdayLabels = isZh
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabel = new Intl.DateTimeFormat(isZh ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(year, monthIndex));
  const legend = legendText
    ? legendText
    : isZh
    ? '绿色代表已填写，空白表示待补充。'
    : 'Green squares are logged days; empty ones still need entries.';
  const prevMonthLabel = isZh ? '上一月' : 'Previous month';
  const nextMonthLabel = isZh ? '下一月' : 'Next month';

  const startOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlankDays = startOfMonth.getDay();
  const todayKey = React.useMemo(() => formatDateKey(new Date()), []);

  const handleDayClick = (day: number) => {
    const date = new Date(year, monthIndex, day);
    const dateKey = formatDateKey(date);
    onSelectDate(dateKey);
  };

  return (
    <section className="rounded-xl border border-[color:var(--border)]/80 bg-[var(--surface)]/80 p-3 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">{monthLabel}</h2>
          <p className="text-[11px] text-[var(--muted-foreground)]">{legend}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(-1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--interactive)] text-xs text-[var(--interactive)] transition hover:bg-[var(--interactive)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--interactive)]"
            aria-label={prevMonthLabel}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--interactive)] text-xs text-[var(--interactive)] transition hover:bg-[var(--interactive)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--interactive)]"
            aria-label={nextMonthLabel}
          >
            ›
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[var(--muted-foreground)]">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-1.5">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {Array.from({ length: leadingBlankDays }).map((_, index) => (
          <div key={`blank-${index}`} className="h-9" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(year, monthIndex, day);
          const dateKey = formatDateKey(date);
          const isSelected = selectedDate === dateKey;
          const hasLog = loggedDates.has(dateKey);
          const isToday = todayKey === dateKey;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => handleDayClick(day)}
              className={cn(
                'flex h-9 w-full items-center justify-center rounded-md border text-xs transition',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--selected-bg)]',
                isSelected
                  ? 'border-[var(--selected-bg)] bg-[var(--selected-bg)] text-[var(--selected-foreground)] shadow-sm'
                  : hasLog
                  ? 'border-[color:var(--success-border)] bg-[var(--success-bg)] text-[var(--foreground)]'
                  : 'border-[color:var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]',
                isToday &&
                  !isSelected &&
                  'ring-1 ring-[var(--interactive)] ring-offset-2 ring-offset-[var(--surface)]',
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </section>
  );
}
