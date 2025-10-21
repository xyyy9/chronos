import { NextResponse } from 'next/server';

import { prisma } from '@/app/lib/prisma';
import { getCurrentLogicalDateKey } from '@/app/lib/date-utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month');

  const referenceKey = monthParam && /^\d{4}-\d{2}$/.test(monthParam)
    ? monthParam
    : getCurrentLogicalDateKey().slice(0, 7);
  const [yearStr, monthStr] = referenceKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const hasValidMonth = !Number.isNaN(year) && !Number.isNaN(month);
  const startKey = `${referenceKey}-01`;
  const nextMonth = hasValidMonth ? (month === 12 ? 1 : month + 1) : 12;
  const nextYear = hasValidMonth ? (month === 12 ? year + 1 : year) : year || 1970;
  const endKey = `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}-01`;

  const logs = await prisma.dailyLog.findMany({
    where: {
      logicalDate: {
        gte: startKey,
        lt: endKey,
      },
    },
    select: {
      logicalDate: true,
    },
    orderBy: {
      logicalDate: 'asc',
    },
  });

  const dates = logs.map((entry) => entry.logicalDate);

  return NextResponse.json({
    dates,
  });
}
