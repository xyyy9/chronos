import { createHash } from 'node:crypto';

export type NewsArticle = {
  id: string;
  title: string;
  url: string;
  source: string;
  language: 'zh' | 'en';
  publishedAt?: string;
};

export type NewsJournalEntry = NewsArticle & {
  rating: number;
  comment: string;
  recordedAt: string;
};

type ExternalArticle = {
  title?: string | null;
  link?: string | null;
  url?: string | null;
  source?: { name?: string | null } | string | null;
  publishedAt?: string | null;
  pubDate?: string | null;
  id?: string | null;
  guid?: string | null;
  origin?: string | null;
};

const FALLBACK_ZH: Array<Omit<NewsArticle, 'id'>> = [
  {
    title: '国家推进新能源基础设施建设，释放绿色发展动能',
    url: 'https://news.example.com/cn/green-energy',
    source: '澎湃新闻',
    language: 'zh',
    publishedAt: new Date().toISOString(),
  },
  {
    title: '上海自贸区发布新政策，吸引外资企业入驻',
    url: 'https://news.example.com/cn/shanghai-free-trade',
    source: '澎湃新闻',
    language: 'zh',
    publishedAt: new Date().toISOString(),
  },
];

const FALLBACK_EN: Array<Omit<NewsArticle, 'id'>> = [
  {
    title: 'Global markets rally as inflation shows signs of cooling',
    url: 'https://news.example.com/en/markets-rally',
    source: 'Sample Daily',
    language: 'en',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Breakthrough in renewable storage promises cheaper green energy',
    url: 'https://news.example.com/en/renewable-storage',
    source: 'Sample Daily',
    language: 'en',
    publishedAt: new Date().toISOString(),
  },
];

const zhEndpoint = process.env.NEWS_ZH_API_URL;
const zhApiKey = process.env.NEWS_ZH_API_KEY;
const enEndpoint = process.env.NEWS_EN_API_URL;
const enApiKey = process.env.NEWS_EN_API_KEY;

const hashString = (value: string) =>
  createHash('sha256').update(value).digest('hex').slice(0, 16);

const normalizeArticles = (articles: ExternalArticle[], language: 'zh' | 'en'): NewsArticle[] => {
  return articles
    .map((item) => {
      const title = (item.title ?? '').trim();
      if (!title) {
        return null;
      }
      const url =
        (item.url ?? item.link ?? '').trim() ||
        `https://news.local/${language}/${hashString(title + (item.guid ?? ''))}`;
      const sourceRaw =
        typeof item.source === 'string'
          ? item.source
          : (item.source?.name ?? item.origin ?? 'Unknown Source');
      const source =
        sourceRaw.trim() || (language === 'zh' ? '澎湃新闻' : 'Unknown Source');
      const publishedAt = item.publishedAt ?? item.pubDate ?? null;
      const idBase = item.id ?? item.guid ?? url;

      return {
        id: hashString(`${language}-${idBase}`),
        title,
        url,
        source,
        language,
        publishedAt: publishedAt ?? undefined,
      } satisfies NewsArticle;
    })
    .filter(Boolean) as NewsArticle[];
};

const fetchSourceArticles = async (
  endpoint: string | undefined,
  apiKey: string | undefined,
  language: 'zh' | 'en',
): Promise<NewsArticle[]> => {
  if (!endpoint) {
    const fallbackPool = language === 'zh' ? FALLBACK_ZH : FALLBACK_EN;
    return fallbackPool.map((item) => ({
      ...item,
      id: hashString(`${language}-${item.title}`),
    }));
  }

  try {
    const headers: HeadersInit = {};
    if (apiKey) {
      headers['Authorization'] = apiKey;
      headers['X-Api-Key'] = apiKey;
    }
    const response = await fetch(endpoint, {
      headers,
      next: { revalidate: 60 * 30 },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch news from ${endpoint}`);
    }
    const data = (await response.json()) as { articles?: ExternalArticle[]; data?: ExternalArticle[] };
    const articles = data.articles ?? data.data ?? [];
    return normalizeArticles(articles, language);
  } catch (error) {
    console.error(`news-fetch-error (${language}):`, error);
    const fallbackPool = language === 'zh' ? FALLBACK_ZH : FALLBACK_EN;
    return fallbackPool.map((item) => ({
      ...item,
      id: hashString(`${language}-${item.title}`),
    }));
  }
};

export async function fetchDailyNews(): Promise<NewsArticle[]> {
  const [zhArticles, enArticles] = await Promise.all([
    fetchSourceArticles(zhEndpoint, zhApiKey, 'zh'),
    fetchSourceArticles(enEndpoint, enApiKey, 'en'),
  ]);

  const pool = [...zhArticles, ...enArticles];
  const seen = new Set<string>();

  return pool.filter((article) => {
    if (seen.has(article.id)) {
      return false;
    }
    seen.add(article.id);
    return true;
  });
}

export const serializeNewsEntries = (entries: NewsJournalEntry[]): string =>
  JSON.stringify(entries, null, 2);

export const normalizeSavedNewsEntries = (value: unknown): NewsJournalEntry[] =>
  Array.isArray(value)
    ? (value as Array<unknown>).flatMap((entry) => {
        if (!entry || typeof entry !== 'object') {
          return [];
        }
        const item = entry as Partial<NewsJournalEntry>;
        if (!item?.id || !item?.title || !item?.url) {
          return [];
        }
        const language = item.language === 'zh' ? 'zh' : 'en';
        return [
          {
            id: String(item.id),
            title: String(item.title),
            url: String(item.url),
            source: item.source ? String(item.source) : language === 'zh' ? '澎湃新闻' : 'Unknown Source',
            language,
            publishedAt: item.publishedAt ? String(item.publishedAt) : undefined,
            rating: Number.isFinite(Number(item.rating)) ? Number(item.rating) : 3,
            comment: item.comment ? String(item.comment) : '',
            recordedAt: item.recordedAt ? String(item.recordedAt) : new Date().toISOString(),
          },
        ];
      })
    : [];
