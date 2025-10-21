'use client';

import * as React from 'react';
import { useActionState } from 'react';

import type { UpsertDailyLogState } from '@/app/lib/actions';
import { upsertDailyLog } from '@/app/lib/actions';
import {
  DAILY_LIFE_OPTIONS,
  DAILY_LIFE_VALUES,
  MENTAL_WORLD_OPTIONS,
  MENTAL_WORLD_VALUES,
  PRIMARY_ACTIVITY_OPTIONS,
  type DailyLifeValue,
  type MentalWorldValue,
} from '@/app/lib/activity-options';
import { formatDateKey, getCurrentLogicalDate } from '@/app/lib/date-utils';
import { LogCalendar } from '@/app/components/log-calendar';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useLocale } from '@/app/hooks/use-locale';

type LocaleKey = 'zh' | 'en';

const TRANSLATIONS: Record<LocaleKey, {
  languageToggle: string;
  languageToggleAria: string;
  prevDay: string;
  nextDay: string;
  dateButtonAria: string;
  title: string;
  subtitle: string;
  loading: string;
  moodLabel: string;
  sleepLabel: string;
  energyLabel: string;
  primaryTitle: string;
  primaryDescription: string;
  mentalTitle: string;
  mentalDescription: string;
  mentalDetailLabel: string;
  dailyTitle: string;
  dailyDescription: string;
  notesLabel: string;
  notesPlaceholder: string;
  save: string;
  saving: string;
  calendarLegend: string;
}> = {
  zh: {
    languageToggle: 'English',
    languageToggleAria: '切换为英文',
    prevDay: '前一天',
    nextDay: '后一天',
    dateButtonAria: '展开或收起日历',
    title: '每日记录',
    subtitle: '追踪你的情绪、睡眠和精力状态，每天凌晨 4 点重置。',
    loading: '正在加载记录…',
    moodLabel: '心情（1 - 5）',
    sleepLabel: '睡眠质量（1 - 5）',
    energyLabel: '精力（1 - 5）',
    primaryTitle: '主要活动',
    primaryDescription: '今天专注的主题，可以多选。',
    mentalTitle: '精神世界',
    mentalDescription: '先选择类型，再填写具体名称。',
    mentalDetailLabel: '具体名称',
    dailyTitle: '生活日常',
    dailyDescription: '记录今天完成的日常事项。',
    notesLabel: '备注',
    notesPlaceholder: '今天还有什么想记录的吗？',
    save: '保存',
    saving: '保存中…',
    calendarLegend: '绿色代表已填写，空白表示待补充。',
  },
  en: {
    languageToggle: '中文',
    languageToggleAria: 'Switch to Chinese',
    prevDay: 'Previous',
    nextDay: 'Next',
    dateButtonAria: 'Toggle calendar',
    title: 'Daily Log',
    subtitle: 'Track your mood, sleep, and energy. The day resets at 4 AM.',
    loading: 'Loading your entry…',
    moodLabel: 'Mood (1 - 5)',
    sleepLabel: 'Sleep Quality (1 - 5)',
    energyLabel: 'Energy Level (1 - 5)',
    primaryTitle: 'Primary Focus',
    primaryDescription: 'What you focused on today — pick as many as needed.',
    mentalTitle: 'Mind Space',
    mentalDescription: 'Select a category first, then add the specific title.',
    mentalDetailLabel: 'Specific title',
    dailyTitle: 'Daily Life',
    dailyDescription: 'Everyday tasks you completed today.',
    notesLabel: 'Notes',
    notesPlaceholder: 'Anything else you want to remember?',
    save: 'Save Log',
    saving: 'Saving…',
    calendarLegend: 'Green means logged, blank means pending.',
  },
};

type FormValues = {
  mood: string;
  sleepQuality: string;
  energyLevel: string;
  notes: string;
};

type MentalWorldState = Record<MentalWorldValue, { selected: boolean; detail: string }>;
type DailyLifeState = Record<DailyLifeValue, boolean>;
type PrimaryActivityState = Record<string, boolean>;

const SCALE_OPTIONS = ['1', '2', '3', '4', '5'] as const;

const INITIAL_ACTION_STATE: UpsertDailyLogState = {
  status: 'idle',
};

const createInitialFormValues = (): FormValues => ({
  mood: '',
  sleepQuality: '',
  energyLevel: '',
  notes: '',
});

const createDefaultMentalState = (): MentalWorldState =>
  MENTAL_WORLD_VALUES.reduce<MentalWorldState>((state, key) => {
    state[key] = { selected: false, detail: '' };
    return state;
  }, {} as MentalWorldState);

const createDefaultDailyLifeState = (): DailyLifeState =>
  DAILY_LIFE_VALUES.reduce<DailyLifeState>((state, key) => {
    state[key] = false;
    return state;
  }, {} as DailyLifeState);

const createDefaultPrimaryState = (defaults: string[] = []): PrimaryActivityState =>
  PRIMARY_ACTIVITY_OPTIONS.reduce<PrimaryActivityState>((state, option) => {
    state[option.value] = defaults.includes(option.value);
    return state;
  }, {} as PrimaryActivityState);

const buildMentalPayload = (state: MentalWorldState) =>
  MENTAL_WORLD_VALUES.flatMap((value) => {
    const entry = state[value];
    if (!entry?.selected) {
      return [];
    }

    return [
      {
        value,
        detail: entry.detail.trim(),
      },
    ];
  });

const buildDailyPayload = (state: DailyLifeState) =>
  DAILY_LIFE_VALUES.filter((value) => state[value]);

const buildPrimaryPayload = (state: PrimaryActivityState) =>
  PRIMARY_ACTIVITY_OPTIONS.flatMap((option) => (state[option.value] ? [option.value] : []));

const hydrateMentalState = (entries?: Array<{ value: string; detail: string }>) => {
  const next = createDefaultMentalState();
  if (!entries) {
    return next;
  }

  for (const entry of entries) {
    if (MENTAL_WORLD_VALUES.includes(entry.value as MentalWorldValue)) {
      next[entry.value as MentalWorldValue] = {
        selected: true,
        detail: entry.detail,
      };
    }
  }

  return next;
};

const hydrateDailyLifeState = (entries?: string[]) => {
  const next = createDefaultDailyLifeState();
  if (!entries) {
    return next;
  }

  for (const entry of entries) {
    if (DAILY_LIFE_VALUES.includes(entry as DailyLifeValue)) {
      next[entry as DailyLifeValue] = true;
    }
  }

  return next;
};

const hydratePrimaryState = (entries?: string[]) =>
  createDefaultPrimaryState(entries ?? []);

const cn = (...inputs: Array<string | undefined | null | false>) =>
  inputs.filter(Boolean).join(' ');

export function LoggingTab() {
  const logicalToday = React.useMemo(() => getCurrentLogicalDate(), []);
  const [locale, setLocale] = useLocale();
  const t = TRANSLATIONS[locale];
  const isZh = locale === 'zh';
  const [selectedDate, setSelectedDate] = React.useState<string>(() =>
    formatDateKey(logicalToday),
  );
  const todayKey = React.useMemo(() => formatDateKey(logicalToday), [logicalToday]);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    const seed = new Date(logicalToday);
    seed.setDate(1);
    return seed;
  });
  const [loggedDates, setLoggedDates] = React.useState<Set<string>>(() => new Set());

  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const [formValues, setFormValues] = React.useState<FormValues>(createInitialFormValues);
  const [mentalState, setMentalState] = React.useState<MentalWorldState>(
    createDefaultMentalState,
  );
  const [dailyState, setDailyState] = React.useState<DailyLifeState>(
    createDefaultDailyLifeState,
  );
  const [primaryState, setPrimaryState] = React.useState<PrimaryActivityState>(
    createDefaultPrimaryState,
  );

  const [actionState, formAction, isPending] = useActionState(
    upsertDailyLog,
    INITIAL_ACTION_STATE,
  );

  const mentalPayload = React.useMemo(
    () => JSON.stringify(buildMentalPayload(mentalState)),
    [mentalState],
  );
  const dailyPayload = React.useMemo(
    () => JSON.stringify(buildDailyPayload(dailyState)),
    [dailyState],
  );
  const primaryPayload = React.useMemo(
    () => JSON.stringify(buildPrimaryPayload(primaryState)),
    [primaryState],
  );

  const resetForm = React.useCallback(() => {
    setFormValues(createInitialFormValues());
    setMentalState(createDefaultMentalState());
    setDailyState(createDefaultDailyLifeState());
    setPrimaryState(createDefaultPrimaryState());
  }, []);

  const monthKey = React.useMemo(
    () =>
      `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`,
    [currentMonth],
  );

  const loadCalendar = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/daily-log/calendar?month=${monthKey}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('加载日历数据失败');
      }

      const data = (await response.json()) as { dates: string[] };
      setLoggedDates(new Set(data.dates));
    } catch (error) {
      console.error(error);
      setLoggedDates(new Set());
    }
  }, [monthKey]);

  const loadDailyLog = React.useCallback(
    async (dateKey: string) => {
      try {
        setFetchError(null);
        setIsLoading(true);

        const response = await fetch(`/api/daily-log?date=${dateKey}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('加载日志失败');
        }

        const data = (await response.json()) as {
          log:
            | {
                logicalDate: string;
                mood: number;
                sleepQuality: number;
                energyLevel: number;
                primaryActivities: string[];
                mentalWorldActivities: Array<{ value: string; detail: string }>;
                dailyLifeActivities: string[];
                notes?: string;
              }
            | null;
        };

        if (data.log) {
          const localDateKey = formatDateKey(new Date(data.log.logicalDate));
          setFormValues({
            mood: data.log.mood.toString(),
            sleepQuality: data.log.sleepQuality.toString(),
            energyLevel: data.log.energyLevel.toString(),
            notes: data.log.notes ?? '',
          });
          setMentalState(hydrateMentalState(data.log.mentalWorldActivities));
          setDailyState(hydrateDailyLifeState(data.log.dailyLifeActivities));
          setPrimaryState(hydratePrimaryState(data.log.primaryActivities));
          setLoggedDates((prev) => {
            const next = new Set(prev);
            next.add(localDateKey);
            return next;
          });
          if (localDateKey !== dateKey) {
            setSelectedDate(localDateKey);
          }
        } else {
          resetForm();
          setLoggedDates((prev) => {
            const next = new Set(prev);
            next.delete(dateKey);
            return next;
          });
        }
      } catch (error) {
        setFetchError(
          error instanceof Error ? error.message : 'Unexpected error loading data.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [resetForm],
  );

  React.useEffect(() => {
    loadDailyLog(selectedDate);
  }, [loadDailyLog, selectedDate]);

  React.useEffect(() => {
    if (!actionState?.values) {
      return;
    }

    setFormValues({
      mood: actionState.values.mood?.toString() ?? '',
      sleepQuality: actionState.values.sleepQuality?.toString() ?? '',
      energyLevel: actionState.values.energyLevel?.toString() ?? '',
      notes: actionState.values.notes ?? '',
    });
    setMentalState(hydrateMentalState(actionState.values.mentalWorldActivities));
    setDailyState(hydrateDailyLifeState(actionState.values.dailyLifeActivities));
    setPrimaryState(hydratePrimaryState(actionState.values.primaryActivities));

    if (actionState.values.logicalDate) {
      const localKey = formatDateKey(new Date(actionState.values.logicalDate));
      setSelectedDate(localKey);
      const targetMonth = localKey.slice(0, 7);
      if (targetMonth === monthKey) {
        setLoggedDates((prev) => {
          const next = new Set(prev);
          next.add(localKey);
          return next;
        });
      }
    }
  }, [actionState, monthKey]);

  const handleMonthChange = (offset: number) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + offset);
      return next;
    });
  };

  React.useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  React.useEffect(() => {
    const [yearStr, monthStr] = selectedDate.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1;

    if (Number.isNaN(year) || Number.isNaN(month)) {
      return;
    }

    if (
      currentMonth.getFullYear() !== year ||
      currentMonth.getMonth() !== month
    ) {
      setCurrentMonth(new Date(year, month, 1));
    }
  }, [currentMonth, selectedDate]);

  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
  };

  const handleSelectScale = (key: keyof FormValues, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTogglePrimaryActivity = (value: string) => {
    setPrimaryState((prev) => ({
      ...prev,
      [value]: !prev[value],
    }));
  };

  const handleToggleMental = (value: MentalWorldValue) => {
    setMentalState((prev) => ({
      ...prev,
      [value]: {
        selected: !prev[value].selected,
        detail: prev[value].selected ? '' : prev[value].detail,
      },
    }));
  };

  const handleChangeMentalDetail = (value: MentalWorldValue, detail: string) => {
    setMentalState((prev) => ({
      ...prev,
      [value]: {
        ...prev[value],
        detail,
      },
    }));
  };

  const handleToggleDaily = (value: DailyLifeValue) => {
    setDailyState((prev) => ({
      ...prev,
      [value]: !prev[value],
    }));
  };

  const handleShiftDay = React.useCallback(
    (offset: number) => {
      const base = new Date(`${selectedDate}T12:00:00`);
      base.setDate(base.getDate() + offset);
      const newKey = formatDateKey(base);
      if (offset > 0 && newKey > todayKey) {
        return;
      }
      setSelectedDate(newKey);
      setIsCalendarOpen(false);
    },
    [selectedDate, todayKey],
  );

  const isNextDisabled = selectedDate >= todayKey;

  const selectedMentalEntries = React.useMemo(
    () =>
      MENTAL_WORLD_OPTIONS.flatMap((option) => {
        const entry = mentalState[option.value];
        if (!entry?.selected) {
          return [];
        }
        return [
          {
            value: option.value,
            label: isZh ? option.label : option.labelEn,
            placeholder: isZh ? option.placeholder : option.placeholderEn,
            detail: entry.detail,
          },
        ];
      }),
    [mentalState, isZh],
  );

  const selectedDateLabel = React.useMemo(() => {
    const date = new Date(`${selectedDate}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      return selectedDate;
    }
    return new Intl.DateTimeFormat(isZh ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    }).format(date);
  }, [selectedDate, isZh]);

  return (
    <div className="pb-32 text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
        <section className="rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleShiftDay(-1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] text-lg font-semibold transition hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              aria-label={t.prevDay}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setIsCalendarOpen((prev) => !prev)}
              className="flex flex-1 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-center transition hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              aria-label={t.dateButtonAria}
            >
              <span className="text-lg font-semibold text-[var(--foreground)]">
                {selectedDateLabel}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleShiftDay(1)}
              disabled={isNextDisabled}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] text-lg font-semibold transition hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={t.nextDay}
            >
              ›
            </button>
          </div>
          {isCalendarOpen && (
            <div className="mt-4">
              <LogCalendar
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                loggedDates={loggedDates}
                onMonthChange={handleMonthChange}
                onSelectDate={(dateKey) => {
                  handleSelectDate(dateKey);
                  setIsCalendarOpen(false);
                }}
                locale={locale}
                legendText={t.calendarLegend}
              />
            </div>
          )}
        </section>

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocale((prev) => (prev === 'zh' ? 'en' : 'zh'))}
            aria-label={t.languageToggleAria}
          >
            {t.languageToggle}
          </Button>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">{t.subtitle}</p>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-[color:var(--border)] bg-[var(--surface)] text-sm text-[var(--muted-foreground)]">
            {t.loading}
          </div>
        ) : (
          <>
            {fetchError && (
              <p className="rounded-md border border-[color:var(--error-border)] bg-[var(--error-bg)] px-3 py-2 text-sm">
                {fetchError}
              </p>
            )}

            {actionState?.status === 'success' && actionState.message && (
              <p className="rounded-md border border-[color:var(--success-border)] bg-[var(--success-bg)] px-3 py-2 text-sm">
                {actionState.message}
              </p>
            )}

            {actionState?.status === 'error' && actionState.message && (
              <p className="rounded-md border border-[color:var(--error-border)] bg-[var(--error-bg)] px-3 py-2 text-sm">
                {actionState.message}
              </p>
            )}

            <form action={formAction} className="flex flex-col gap-6">
              <input type="hidden" name="logicalDate" value={selectedDate} />
              <input type="hidden" name="primaryActivities" value={primaryPayload} />
              <input type="hidden" name="mentalWorldActivities" value={mentalPayload} />
              <input type="hidden" name="dailyLifeActivities" value={dailyPayload} />

              <section className="flex flex-col gap-5 rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="mood">{t.moodLabel}</Label>
                  <input id="mood" name="mood" type="hidden" value={formValues.mood} />
                  <div className="flex flex-wrap gap-2">
                    {SCALE_OPTIONS.map((option) => {
                      const isSelected = formValues.mood === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => handleSelectScale('mood', option)}
                          disabled={isPending}
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-lg border text-sm font-semibold transition',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm'
                              : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]',
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {actionState?.errors?.mood && (
                    <p className="text-sm text-red-500">{actionState.errors.mood}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="sleepQuality">{t.sleepLabel}</Label>
                  <input
                    id="sleepQuality"
                    name="sleepQuality"
                    type="hidden"
                    value={formValues.sleepQuality}
                  />
                  <div className="flex flex-wrap gap-2">
                    {SCALE_OPTIONS.map((option) => {
                      const isSelected = formValues.sleepQuality === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => handleSelectScale('sleepQuality', option)}
                          disabled={isPending}
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-lg border text-sm font-semibold transition',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm'
                              : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]',
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {actionState?.errors?.sleepQuality && (
                    <p className="text-sm text-red-500">{actionState.errors.sleepQuality}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="energyLevel">{t.energyLabel}</Label>
                  <input
                    id="energyLevel"
                    name="energyLevel"
                    type="hidden"
                    value={formValues.energyLevel}
                  />
                  <div className="flex flex-wrap gap-2">
                    {SCALE_OPTIONS.map((option) => {
                      const isSelected = formValues.energyLevel === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => handleSelectScale('energyLevel', option)}
                          disabled={isPending}
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-lg border text-sm font-semibold transition',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm'
                              : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]',
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {actionState?.errors?.energyLevel && (
                    <p className="text-sm text-red-500">{actionState.errors.energyLevel}</p>
                  )}
                </div>

              </section>

              <section className="flex flex-col gap-5 rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold">{t.primaryTitle}</h2>
                  <p className="text-xs text-[var(--muted-foreground)]">{t.primaryDescription}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRIMARY_ACTIVITY_OPTIONS.map((option) => {
                    const isSelected = primaryState[option.value];
                    const label = isZh ? option.label : option.labelEn;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleTogglePrimaryActivity(option.value)}
                        disabled={isPending}
                        className={cn(
                          'flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm'
                            : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {actionState?.errors?.primaryActivities && (
                  <p className="text-sm text-red-500">
                    {actionState.errors.primaryActivities}
                  </p>
                )}
              </section>

              <section className="flex flex-col gap-5 rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold">{t.mentalTitle}</h2>
                  <p className="text-xs text-[var(--muted-foreground)]">{t.mentalDescription}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MENTAL_WORLD_OPTIONS.map((option) => {
                    const entry = mentalState[option.value];
                    const isSelected = entry?.selected ?? false;
                    const label = isZh ? option.label : option.labelEn;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleToggleMental(option.value)}
                        disabled={isPending}
                        className={cn(
                          'flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm'
                            : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {selectedMentalEntries.length > 0 && (
                  <div className="flex flex-col gap-3 rounded-xl border border-[color:var(--border)] bg-[var(--surface-raised)] p-4">
                    {selectedMentalEntries.map((entry) => (
                      <div key={entry.value} className="flex flex-col gap-2">
                        <Label className="text-xs text-[var(--muted-foreground)]">
                          {entry.label} - {t.mentalDetailLabel}
                        </Label>
                        <Input
                          value={mentalState[entry.value].detail}
                          placeholder={entry.placeholder}
                          onChange={(event) =>
                            handleChangeMentalDetail(entry.value, event.target.value)
                          }
                          disabled={isPending}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {actionState?.errors?.mentalWorldActivities && (
                  <p className="text-sm text-red-500">
                    {actionState.errors.mentalWorldActivities}
                  </p>
                )}
              </section>

              <section className="flex flex-col gap-5 rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold">{t.dailyTitle}</h2>
                  <p className="text-xs text-[var(--muted-foreground)]">{t.dailyDescription}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DAILY_LIFE_OPTIONS.map((option) => {
                    const isSelected = dailyState[option.value];
                    const label = isZh ? option.label : option.labelEn;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleToggleDaily(option.value)}
                        disabled={isPending}
                        className={cn(
                          'flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm'
                            : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {actionState?.errors?.dailyLifeActivities && (
                  <p className="text-sm text-red-500">
                    {actionState.errors.dailyLifeActivities}
                  </p>
                )}
              </section>

              <section className="flex flex-col gap-3 rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <Label htmlFor="notes">{t.notesLabel}</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder={t.notesPlaceholder}
                  value={formValues.notes}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  disabled={isPending}
                />
                {actionState?.errors?.notes && (
                  <p className="text-sm text-red-500">{actionState.errors.notes}</p>
                )}
              </section>

              <Button type="submit" disabled={isPending}>
                {isPending ? t.saving : t.save}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
