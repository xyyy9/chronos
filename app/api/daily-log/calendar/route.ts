import { NextResponse } from 'next/server';

import { prisma } from '@/app/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month');

  const reference = monthParam ? new Date(`${monthParam}-01T12:00:00`) : new Date();
  const start = new Date(reference);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const logs = await prisma.dailyLog.findMany({
    where: {
      logicalDate: {
        gte: start,
        lt: end,
      },
    },
    select: {
      logicalDate: true,
    },
    orderBy: {
      logicalDate: 'asc',
    },
  });

  const dates = logs.map((entry) => entry.logicalDate.toISOString().slice(0, 10));

  return NextResponse.json({
    dates,
  });
}
