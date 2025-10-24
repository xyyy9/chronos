'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import type { NewsJournalEntry } from '@/app/lib/news';
import { getCurrentLogicalDateKey } from '@/app/lib/date-utils';
import { prisma } from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/auth';

const newsJournalInputSchema = z.object({
  logicalDate: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), '日期格式无效'),
  articleId: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  source: z.string().min(1),
  language: z.enum(['zh', 'en']),
  publishedAt: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export type SaveNewsJournalState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  articleId?: string;
  entries?: NewsJournalEntry[];
};

const ensureDailyLog = async (logicalDate: string, userId: string) => {
  const existing = await prisma.dailyLog.findUnique({
    where: {
      userId_logicalDate: {
        userId,
        logicalDate,
      },
    },
  });
  if (existing) {
    return existing;
  }
  return prisma.dailyLog.create({
    data: {
      logicalDate,
      userId,
      mood: 3,
      sleepQuality: 3,
      energyLevel: 3,
      primaryActivities: [],
      mentalWorldActivities: [],
      dailyLifeActivities: [],
      newsEntries: [],
    },
  });
};

export async function saveNewsJournalEntry(
  _prevState: SaveNewsJournalState,
  formData: FormData,
): Promise<SaveNewsJournalState> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      status: 'error',
      message: '请登录后再保存新闻评论。',
    };
  }

  const parseResult = newsJournalInputSchema.safeParse({
    logicalDate: formData.get('logicalDate'),
    articleId: formData.get('articleId'),
    title: formData.get('title'),
    url: formData.get('url'),
    source: formData.get('source'),
    language: formData.get('language'),
    publishedAt: formData.get('publishedAt'),
    rating: formData.get('rating'),
    comment: formData.get('comment'),
  });

  if (!parseResult.success) {
    return {
      status: 'error',
      message: parseResult.error.issues[0]?.message ?? '保存失败，请稍后再试。',
    };
  }

  const {
    logicalDate: logicalDateInput,
    articleId,
    title,
    url,
    source,
    language,
    publishedAt,
    rating,
    comment,
  } = parseResult.data;

  const logicalDate = logicalDateInput ?? getCurrentLogicalDateKey();
  const log = await ensureDailyLog(logicalDate, user.id);
  const existingEntries = Array.isArray(log.newsEntries) ? (log.newsEntries as NewsJournalEntry[]) : [];

  let snapshotId: string | undefined;
  try {
    const response = await fetch(url);
    if (response.ok) {
      const html = await response.text();
      const snapshot = await prisma.newsSnapshot.upsert({
        where: { articleId_url: { articleId, url } },
        update: {
          title,
          source,
          language,
          html,
          savedAt: new Date(),
        },
        create: {
          articleId,
          url,
          title,
          source,
          language,
          html,
        },
      });
      snapshotId = snapshot.id;
    }
  } catch (error) {
    console.error('news-snapshot-error', error);
  }

  const previousEntry = existingEntries.find((entry) => entry.id === articleId);
  const updatedEntry: NewsJournalEntry = {
    id: articleId,
    title,
    url,
    source,
    language,
    publishedAt,
    rating,
    comment: comment ?? '',
    recordedAt: new Date().toISOString(),
    snapshotId: snapshotId ?? previousEntry?.snapshotId,
  };

  const nextEntries = [
    updatedEntry,
    ...existingEntries.filter((entry) => entry.id !== articleId),
  ];

  await prisma.dailyLog.update({
    where: {
      userId_logicalDate: {
        userId: user.id,
        logicalDate,
      },
    },
    data: {
      newsEntries: nextEntries,
      // keep other fields unchanged
    },
  });

  revalidatePath('/news');
  revalidatePath('/');

  return {
    status: 'success',
    message: language === 'zh' ? '已保存到今日评论。' : 'Saved to today’s journal.',
    articleId,
    entries: nextEntries,
  };
}
