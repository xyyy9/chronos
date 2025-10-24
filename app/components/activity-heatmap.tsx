'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

import { formatDateKey } from '@/app/lib/date-utils';

export type HeatmapCategory = {
  value: string;
  label: string;
  color: string;
};

export type HeatmapOccurrence = {
  logicalDate: string;
  categories: Array<{
    value: string;
    detail?: string;
  }>;
};

type ActivityHeatmapProps = {
  title: string;
  description: string;
  categories: HeatmapCategory[];
  occurrences: HeatmapOccurrence[];
  timelineDateKeys?: string[];
  enableDetailPanel?: boolean;
  detailLocale?: string;
  locale?: 'zh' | 'en';
};

type SelectedCell = {
  dateKey: string;
  categories: HeatmapOccurrence['categories'];
};

const TAG_PALETTE = ['#D88C9A', '#f1dc7e', '#a7d699', '#7cc6b7', '#7ebac9', '#7583d1', '#846dc4'] as const;

const cn = (...inputs: Array<string | undefined | null | false>) =>
  inputs.filter(Boolean).join(' ');

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const buildGradient = (colors: string[]) => {
  if (colors.length === 1) {
    return colors[0];
  }

  const step = 100 / colors.length;
  const stops = colors.map((color, index) => {
    const start = (index * step).toFixed(2);
    const end = ((index + 1) * step).toFixed(2);
    return `${color} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(', ')})`;
};

export function ActivityHeatmap({
  title,
  description,
  categories,
  occurrences,
  timelineDateKeys,
  enableDetailPanel = false,
  detailLocale,
  locale = 'zh',
}: ActivityHeatmapProps) {
  const isZh = locale === 'zh';
  const weekdayLabels = isZh
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const normalizedCategories = React.useMemo(
    () =>
      categories.map((category, index) => ({
        ...category,
        color: TAG_PALETTE[index % TAG_PALETTE.length],
      })),
    [categories],
  );

  const categoryMap = React.useMemo(
    () => new Map(normalizedCategories.map((category) => [category.value, category])),
    [normalizedCategories],
  );

  const dateMap = React.useMemo(() => {
    const map = new Map<string, HeatmapOccurrence['categories']>();
    occurrences.forEach((occurrence) => {
      const key = occurrence.logicalDate;
      const filtered = occurrence.categories.filter((entry) => categoryMap.has(entry.value));
      map.set(key, filtered);
    });
    return map;
  }, [occurrences, categoryMap]);

  const allDateKeys = React.useMemo(() => {
    const keys = new Set<string>();
    timelineDateKeys?.forEach((key) => keys.add(key));
    dateMap.forEach((_, key) => keys.add(key));
    return Array.from(keys).sort();
  }, [dateMap, timelineDateKeys]);

  const [activeFilters, setActiveFilters] = React.useState<Set<string>>(() => new Set());
  const [selectedCell, setSelectedCell] = React.useState<SelectedCell | null>(() => null);
  const [overlayPosition, setOverlayPosition] = React.useState<{ top: number; left: number } | null>(null);
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const selectedCellElementRef = React.useRef<HTMLButtonElement | null>(null);

  const detailFormatter = React.useMemo(() => {
    try {
      return new Intl.DateTimeFormat(detailLocale ?? 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      });
    } catch {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      });
    }
  }, [detailLocale]);

  React.useEffect(() => {
    if (!enableDetailPanel) {
      setSelectedCell(null);
      setOverlayPosition(null);
      return;
    }
    if (selectedCell && !allDateKeys.includes(selectedCell.dateKey)) {
      setSelectedCell(null);
      setOverlayPosition(null);
    }
  }, [enableDetailPanel, selectedCell, allDateKeys]);

  React.useEffect(() => {
    if (!selectedCell) {
      selectedCellElementRef.current = null;
    }
  }, [selectedCell]);

  React.useEffect(() => {
    if (!enableDetailPanel || !selectedCell) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedCell(null);
        setOverlayPosition(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableDetailPanel, selectedCell]);

  React.useEffect(() => {
    if (!enableDetailPanel || !selectedCell) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!overlayRef.current) {
        return;
      }
      if (target && (overlayRef.current.contains(target) || target.dataset?.heatmapCell)) {
        return;
      }
      setSelectedCell(null);
      setOverlayPosition(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [enableDetailPanel, selectedCell]);

  const updateOverlayPosition = React.useCallback(() => {
    if (!enableDetailPanel || !selectedCell || !overlayRef.current || !selectedCellElementRef.current) {
      return;
    }

    const anchorRect = selectedCellElementRef.current.getBoundingClientRect();
    const overlay = overlayRef.current;
    const overlayHeight = overlay.offsetHeight;
    const overlayWidth = overlay.offsetWidth;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top = anchorRect.top - overlayHeight - 12;
    if (top < 12) {
      top = anchorRect.bottom + 12;
    }
    if (top + overlayHeight > viewportHeight - 12) {
      top = Math.max(12, viewportHeight - overlayHeight - 12);
    }

    let left = anchorRect.right + 12;
    if (left + overlayWidth > viewportWidth - 12) {
      left = anchorRect.left - overlayWidth - 12;
    }
    if (left < 12) {
      left = Math.max(
        12,
        Math.min(anchorRect.left + anchorRect.width / 2 - overlayWidth / 2, viewportWidth - overlayWidth - 12),
      );
    }

    setOverlayPosition({ top, left });
  }, [enableDetailPanel, selectedCell]);

  React.useLayoutEffect(() => {
    updateOverlayPosition();
  }, [updateOverlayPosition]);

  React.useEffect(() => {
    if (!enableDetailPanel || !selectedCell) {
      return;
    }

    const handleReposition = () => {
      if (!selectedCellElementRef.current || !selectedCellElementRef.current.isConnected) {
        setSelectedCell(null);
        setOverlayPosition(null);
        return;
      }
      updateOverlayPosition();
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [enableDetailPanel, selectedCell, updateOverlayPosition]);
  const toggleFilter = (value: string) => {
    setActiveFilters((prev) => {
      if (prev.size === 1 && prev.has(value)) {
        return new Set();
      }
      return new Set([value]);
    });
  };

  if (!allDateKeys.length) {
    return (
      <section className="rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <header className="mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
        </header>
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-[color:var(--border)] bg-[var(--surface-raised)] text-sm text-[var(--muted-foreground)]">
          暂无记录
        </div>
      </section>
    );
  }

  const startDate = getWeekStart(new Date(allDateKeys[0]));
  const lastDate = new Date(allDateKeys[allDateKeys.length - 1]);
  lastDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const finalDate = today > lastDate ? today : lastDate;
  const endDate = new Date(finalDate);
  const offset = 6 - endDate.getDay();
  endDate.setDate(endDate.getDate() + offset);

  const days: { key: string; date: Date }[] = [];
  for (const date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    days.push({ key: formatDateKey(date), date: new Date(date) });
  }

  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const filteredLegend = normalizedCategories.map((category) => ({
    ...category,
    active: activeFilters.size === 0 || activeFilters.has(category.value),
  }));

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
        </div>
      </header>

      <div className="overflow-x-auto overflow-y-visible">
        <div className="flex gap-2">
          <div className="flex flex-col items-end gap-1 pr-2 text-[10px] text-[var(--muted-foreground)]">
            {weekdayLabels.map((day, index) => (
              <span key={`${day}-${index}`} className="h-4 leading-4">
                {day}
              </span>
            ))}
          </div>

          <div className="relative">
            <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="grid grid-rows-7 gap-1">
                {week.map(({ key }) => {
                    const activities = dateMap.get(key) ?? [];
                    const filtered = activities.filter((item) =>
                      activeFilters.size === 0 ? true : activeFilters.has(item.value),
                    );
                    const categoriesToDisplay = filtered.length
                      ? filtered
                      : activeFilters.size === 0
                      ? activities
                      : [];
                    const colors = categoriesToDisplay
                      .map((item) => categoryMap.get(item.value)?.color)
                      .filter(Boolean) as string[];
                    const intensity = Math.min(1, 0.35 + categoriesToDisplay.length * 0.18);
                    const background = colors.length ? buildGradient(colors) : 'transparent';
                    const detail = categoriesToDisplay
                      .map((item) => {
                        const category = categoryMap.get(item.value);
                        const label = category?.label ?? item.value;
                        return item.detail ? `${label}: ${item.detail}` : label;
                      })
                      .join('\n');
                    const displayCategories = categoriesToDisplay.length
                      ? categoriesToDisplay
                      : activeFilters.size === 0
                      ? activities
                      : [];
                    const isSelected = selectedCell?.dateKey === key;

                    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
                      if (!enableDetailPanel) {
                        return;
                      }
                      if (!displayCategories.length) {
                        setSelectedCell(null);
                        setOverlayPosition(null);
                        return;
                      }
                      const rect = event.currentTarget.getBoundingClientRect();
                      selectedCellElementRef.current = event.currentTarget;
                      setSelectedCell({
                        dateKey: key,
                        categories: displayCategories,
                      });
                      setOverlayPosition({
                        top: rect.bottom + 12,
                        left: rect.left,
                      });
                    };

                    return (
                      <button
                        key={key}
                        data-heatmap-cell
                        className={cn(
                          'h-4 w-4 rounded-sm border transition disabled:opacity-60',
                          colors.length
                            ? 'border-[rgba(15,23,42,0.2)] shadow-sm'
                            : 'border-[color:var(--border)] opacity-60',
                          enableDetailPanel && isSelected ? 'ring-2 ring-[var(--accent)] ring-offset-1' : null,
                          enableDetailPanel && displayCategories.length ? 'cursor-pointer hover:brightness-110' : null,
                          !enableDetailPanel || !displayCategories.length ? 'cursor-default' : null,
                        )}
                        style={{
                          background,
                          opacity: colors.length ? intensity : 1,
                        }}
                        title={colors.length ? `${key}\n${detail}` : `${key}\n无记录`}
                        type="button"
                        onClick={handleClick}
                        disabled={!enableDetailPanel || !displayCategories.length}
                      />
                    );
                  })}
                  {Array.from({ length: 7 - week.length }).map((_, fillerIndex) => (
                    <div key={`filler-${fillerIndex}`} className="h-4 w-4" />
                  ))}
                </div>
              ))}
            </div>
            {enableDetailPanel &&
              selectedCell &&
              selectedCell.categories.length > 0 &&
              overlayPosition &&
              typeof document !== 'undefined' &&
              createPortal(
                <div
                  ref={overlayRef}
                  className="fixed z-50 w-[200px] rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-3 shadow-xl"
                  style={{
                    top: overlayPosition.top,
                    left: overlayPosition.left,
                  }}
                >
                  <header className="mb-2 text-[11px] text-[var(--muted-foreground)]">
                    {detailFormatter.format(new Date(`${selectedCell.dateKey}T12:00:00`))}
                  </header>
                  <div className="flex flex-wrap gap-x-3 gap-y-2 text-[11px] text-[var(--foreground)]">
                    {selectedCell.categories.map((entry, index) => {
                      const category = categoryMap.get(entry.value);
                      const label = category?.label ?? entry.value;

                      return (
                        <div
                          key={`${selectedCell.dateKey}-${entry.value}-${index}`}
                          className="flex flex-col text-[11px]"
                        >
                          <span className="font-medium">
                            <span
                              className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                              style={{ backgroundColor: category?.color ?? '#2563eb' }}
                            />
                            {label}
                          </span>
                          {entry.detail && <span className="text-[var(--muted-foreground)]">{entry.detail}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>,
                document.body,
              )}
          </div>
        </div>
      </div>

      <footer className="mt-4 flex flex-wrap gap-2">
        {filteredLegend.map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => toggleFilter(category.value)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition',
              category.active
                ? 'border-[var(--selected-bg)] bg-[var(--selected-bg)] text-[var(--selected-foreground)] shadow-sm'
                : 'border-[color:var(--border)] bg-[var(--surface-raised)] text-[var(--muted-foreground)]',
            )}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {category.label}
          </button>
        ))}
      </footer>
    </section>
  );
}
