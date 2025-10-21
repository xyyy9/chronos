import { NextResponse } from 'next/server';

import { prisma } from '@/app/lib/prisma';
import { getCurrentLogicalDateKey } from '@/app/lib/date-utils';
import type { NewsJournalEntry } from '@/app/lib/news';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const logicalDateKey =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : getCurrentLogicalDateKey();

  const log = await prisma.dailyLog.findUnique({
    where: { logicalDate: logicalDateKey },
  });

  const mentalWorldActivities =
    log && Array.isArray(log.mentalWorldActivities)
      ? (log.mentalWorldActivities as Array<{ value: string; detail: string }>)
      : [];

  const dailyLifeActivities =
    log && Array.isArray(log.dailyLifeActivities)
      ? (log.dailyLifeActivities as string[])
      : [];

  const newsEntries =
    log && Array.isArray(log.newsEntries)
      ? (log.newsEntries as NewsJournalEntry[])
      : [];

  return NextResponse.json({
    log: log
      ? {
          id: log.id,
          logicalDate: log.logicalDate,
          mood: log.mood,
          sleepQuality: log.sleepQuality,
          energyLevel: log.energyLevel,
          primaryActivities: Array.isArray(log.primaryActivities)
            ? (log.primaryActivities as string[])
            : [],
          mentalWorldActivities,
          dailyLifeActivities,
          newsEntries,
          notes: log.notes,
        }
      : null,
  });
}
