'use server';

import type { PrimaryActivity } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { DAILY_LIFE_VALUES, MENTAL_WORLD_VALUES, type DailyLifeValue, type MentalWorldValue } from '@/app/lib/activity-options';

import { prisma } from './prisma';
import { getCurrentLogicalDateKey } from './date-utils';

const PrimaryActivityEnum = z.enum(['WORK', 'STUDY', 'FITNESS', 'REST', 'SOCIAL', 'CREATIVE']);
const MentalWorldEnum = z.enum(MENTAL_WORLD_VALUES);
const DailyLifeEnum = z.enum(DAILY_LIFE_VALUES);

const mentalWorldSchema = z.array(
  z.object({
    value: MentalWorldEnum,
    detail: z
      .string()
      .min(1, '请输入具体内容')
      .max(200, '描述不要超过 200 个字符'),
  }),
);

const dailyLifeSchema = z.array(DailyLifeEnum);

const DailyLogSchema = z.object({
  mood: z.coerce.number().int().min(1).max(5),
  sleepQuality: z.coerce.number().int().min(1).max(5),
  energyLevel: z.coerce.number().int().min(1).max(5),
  primaryActivities: z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (!value) return [];
      try {
        return JSON.parse(value);
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: '主要活动记录格式无效' });
        return z.NEVER;
      }
    })
    .pipe(z.array(PrimaryActivityEnum)),
  mentalWorldActivities: z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (!value) return [];
      try {
        return JSON.parse(value);
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: '精神世界记录格式无效' });
        return z.NEVER;
      }
    })
    .pipe(mentalWorldSchema),
  dailyLifeActivities: z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (!value) return [];
      try {
        return JSON.parse(value);
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: '生活日常记录格式无效' });
        return z.NEVER;
      }
    })
    .pipe(dailyLifeSchema),
  notes: z
    .string()
    .max(1000)
    .optional()
    .transform((value) => value?.trim() || undefined),
  logicalDate: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), '日期格式无效'),
});

type MentalWorldEntry = {
  value: MentalWorldValue;
  detail: string;
};

type DailyLogFormValues = {
  mood?: number;
  sleepQuality?: number;
  energyLevel?: number;
  primaryActivities?: PrimaryActivity[];
  mentalWorldActivities?: MentalWorldEntry[];
  dailyLifeActivities?: DailyLifeValue[];
  notes?: string;
  logicalDate?: string;
};

export type UpsertDailyLogState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  errors?: Record<string, string>;
  values?: DailyLogFormValues;
};

const parseMentalWorldFallback = (raw: FormDataEntryValue | null): MentalWorldEntry[] => {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as MentalWorldEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseDailyLifeFallback = (raw: FormDataEntryValue | null): DailyLifeValue[] => {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as DailyLifeValue[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parsePrimaryActivitiesFallback = (
  raw: FormDataEntryValue | null,
): PrimaryActivity[] => {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as PrimaryActivity[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export async function upsertDailyLog(
  _prevState: UpsertDailyLogState,
  formData: FormData,
): Promise<UpsertDailyLogState> {
  'use server';

  const parseResult = DailyLogSchema.safeParse({
    mood: formData.get('mood'),
    sleepQuality: formData.get('sleepQuality'),
    energyLevel: formData.get('energyLevel'),
    primaryActivities: formData.get('primaryActivities'),
    mentalWorldActivities: formData.get('mentalWorldActivities'),
    dailyLifeActivities: formData.get('dailyLifeActivities'),
    notes: formData.get('notes'),
    logicalDate: formData.get('logicalDate'),
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
      message: '请检查提示并修正表单内容。',
      errors: fieldErrors,
      values: {
        mood: Number(formData.get('mood')) || undefined,
        sleepQuality: Number(formData.get('sleepQuality')) || undefined,
        energyLevel: Number(formData.get('energyLevel')) || undefined,
        primaryActivities: parsePrimaryActivitiesFallback(formData.get('primaryActivities')),
        mentalWorldActivities: parseMentalWorldFallback(formData.get('mentalWorldActivities')),
        dailyLifeActivities: parseDailyLifeFallback(formData.get('dailyLifeActivities')),
        notes: formData.get('notes')?.toString(),
        logicalDate: formData.get('logicalDate')?.toString(),
      },
    };
  }

  const {
    mood,
    sleepQuality,
    energyLevel,
    primaryActivities,
    mentalWorldActivities,
    dailyLifeActivities,
    notes,
    logicalDate: logicalDateInput,
  } = parseResult.data;

  const logicalDateKey = logicalDateInput ?? getCurrentLogicalDateKey();

  await prisma.dailyLog.upsert({
    where: { logicalDate: logicalDateKey },
    create: {
      logicalDate: logicalDateKey,
      mood,
      sleepQuality,
      energyLevel,
      primaryActivities,
      mentalWorldActivities,
      dailyLifeActivities,
      notes,
    },
    update: {
      mood,
      sleepQuality,
      energyLevel,
      primaryActivities,
      mentalWorldActivities,
      dailyLifeActivities,
      notes,
    },
  });

  revalidatePath('/dashboard');

  return {
    status: 'success',
    message: 'Daily log saved.',
    values: {
      mood,
      sleepQuality,
      energyLevel,
      primaryActivities,
      mentalWorldActivities,
      dailyLifeActivities,
      notes,
      logicalDate: logicalDateKey,
    },
  };
}
