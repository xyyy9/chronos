'use client';

import * as React from 'react';
import { useActionState } from 'react';

import { initialDailyLogState, upsertDailyLog } from '@/app/lib/actions';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';

type FormValues = {
  mood: string;
  sleepQuality: string;
  notes: string;
};

export function LoggingTab() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [formValues, setFormValues] = React.useState<FormValues>({
    mood: '',
    sleepQuality: '',
    notes: '',
  });

  const [state, formAction, isPending] = useActionState(
    upsertDailyLog,
    initialDailyLogState,
  );

  React.useEffect(() => {
    let ignore = false;

    async function loadInitialState() {
      try {
        setFetchError(null);
        const response = await fetch('/api/daily-log', { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Failed to load the current daily log.');
        }

        const data = (await response.json()) as {
          log: { mood: number; sleepQuality: number; notes?: string } | null;
        };

        if (!ignore && data.log) {
          setFormValues({
            mood: data.log.mood.toString(),
            sleepQuality: data.log.sleepQuality.toString(),
            notes: data.log.notes ?? '',
          });
        }
      } catch (error) {
        if (!ignore) {
          setFetchError(
            error instanceof Error ? error.message : 'Unexpected error loading data.',
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadInitialState();

    return () => {
      ignore = true;
    };
  }, []);

  React.useEffect(() => {
    if (state?.values) {
      setFormValues({
        mood: state.values.mood?.toString() ?? '',
        sleepQuality: state.values.sleepQuality?.toString() ?? '',
        notes: state.values.notes ?? '',
      });
    }
  }, [state]);

  return (
    <div className="pb-32">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-8">
        <header>
          <h1 className="text-2xl font-semibold text-black">Daily Log</h1>
          <p className="mt-1 text-sm text-black/60">
            Track your mood and sleep quality. The day resets at 4 AM to match your routine.
          </p>
        </header>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-black/10 text-sm text-black/50">
            Loading your latest entry…
          </div>
        ) : (
          <>
            {fetchError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {fetchError}
              </p>
            )}

            {state?.status === 'success' && state.message && (
              <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {state.message}
              </p>
            )}

            {state?.status === 'error' && state.message && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {state.message}
              </p>
            )}

            <form action={formAction} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="mood">Mood (1 - 5)</Label>
                <Input
                  id="mood"
                  name="mood"
                  type="number"
                  min={1}
                  max={5}
                  value={formValues.mood}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, mood: event.target.value }))
                  }
                  disabled={isPending}
                />
                {state?.errors?.mood && (
                  <p className="text-sm text-red-600">{state.errors.mood}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="sleepQuality">Sleep Quality (1 - 5)</Label>
                <Input
                  id="sleepQuality"
                  name="sleepQuality"
                  type="number"
                  min={1}
                  max={5}
                  value={formValues.sleepQuality}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      sleepQuality: event.target.value,
                    }))
                  }
                  disabled={isPending}
                />
                {state?.errors?.sleepQuality && (
                  <p className="text-sm text-red-600">{state.errors.sleepQuality}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Anything noteworthy about today?"
                  value={formValues.notes}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  disabled={isPending}
                />
                {state?.errors?.notes && (
                  <p className="text-sm text-red-600">{state.errors.notes}</p>
                )}
              </div>

              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save Log'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
