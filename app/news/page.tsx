import { NewsJournalTab } from '@/app/components/news-journal-tab';
import { fetchDailyNews, normalizeSavedNewsEntries } from '@/app/lib/news';
import { getCurrentLogicalDateKey } from '@/app/lib/date-utils';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const logicalDate = getCurrentLogicalDateKey();
  const [articles, existingLog] = await Promise.all([
    fetchDailyNews(),
    prisma.dailyLog.findUnique({ where: { logicalDate } }),
  ]);

  const initialEntries = existingLog ? normalizeSavedNewsEntries(existingLog.newsEntries) : [];

  return (
    <NewsJournalTab
      logicalDate={logicalDate}
      articles={articles}
      initialEntries={initialEntries}
    />
  );
}
