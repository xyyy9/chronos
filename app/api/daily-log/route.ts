import { NextResponse } from 'next/server';

import { prisma } from '@/app/lib/prisma';
import { getCurrentLogicalDate } from '@/app/lib/date-utils';

export async function GET() {
  const logicalDate = getCurrentLogicalDate();
  const log = await prisma.dailyLog.findUnique({
    where: { logicalDate },
  });

  return NextResponse.json({
    log: log
      ? {
          id: log.id,
          logicalDate: log.logicalDate.toISOString(),
          mood: log.mood,
          sleepQuality: log.sleepQuality,
          notes: log.notes,
        }
      : null,
  });
}
