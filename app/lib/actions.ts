'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from './prisma';
import { getCurrentLogicalDate } from './date-utils';

const DailyLogSchema = z.object({
  mood: z.coerce.number().int().min(1).max(5),
  sleepQuality: z.coerce.number().int().min(1).max(5),
  notes: z
    .string()
    .max(1000)
    .optional()
    .transform((value) => value?.trim() || undefined),
});

export type UpsertDailyLogState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  errors?: Record<string, string>;
  values?: {
    mood?: number;
    sleepQuality?: number;
    notes?: string;
  };
};

export const initialDailyLogState: UpsertDailyLogState = {
  status: 'idle',
};

export async function upsertDailyLog(
  _prevState: UpsertDailyLogState,
  formData: FormData,
): Promise<UpsertDailyLogState> {
  const parseResult = DailyLogSchema.safeParse({
    mood: formData.get('mood'),
    sleepQuality: formData.get('sleepQuality'),
    notes: formData.get('notes'),
  });

  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    parseResult.error.issues.forEach((issue) => {
      const field = issue.path[0]?.toString() ?? 'form';
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    });

    return {
      status: 'error',
      message: 'Please correct the highlighted fields.',
      errors: fieldErrors,
      values: {
        mood: Number(formData.get('mood')) || undefined,
        sleepQuality: Number(formData.get('sleepQuality')) || undefined,
        notes: formData.get('notes')?.toString(),
      },
    };
  }

  const { mood, sleepQuality, notes } = parseResult.data;
  const logicalDate = getCurrentLogicalDate();

  await prisma.dailyLog.upsert({
    where: { logicalDate },
    create: {
      logicalDate,
      mood,
      sleepQuality,
      notes,
    },
    update: {
      mood,
      sleepQuality,
      notes,
    },
  });

  revalidatePath('/dashboard');

  return {
    status: 'success',
    message: 'Daily log saved.',
    values: { mood, sleepQuality, notes },
  };
}
