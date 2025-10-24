import { NewsJournalTab } from '@/app/components/news-journal-tab';
import { fetchDailyNews, normalizeSavedNewsEntries } from '@/app/lib/news';
import { getCurrentLogicalDateKey } from '@/app/lib/date-utils';
import { prisma } from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/auth';
import { generateDemoNewsEntries } from '@/app/lib/demo-data';

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const user = await getCurrentUser();
  const logicalDate = getCurrentLogicalDateKey();
  const articles = await fetchDailyNews();

  if (!user) {
    return (
      <NewsJournalTab
        logicalDate={logicalDate}
        articles={articles}
        initialEntries={generateDemoNewsEntries(logicalDate)}
        isDemo
      />
    );
  }

  const existingLog = await prisma.dailyLog.findUnique({
    where: {
      userId_logicalDate: {
        userId: user.id,
        logicalDate,
      },
    },
  });

  const initialEntries = existingLog ? normalizeSavedNewsEntries(existingLog.newsEntries) : [];

  return (
    <NewsJournalTab
      logicalDate={logicalDate}
      articles={articles}
      initialEntries={initialEntries}
    />
  );
}
