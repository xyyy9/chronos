'use client';

import * as React from 'react';
import { useActionState } from 'react';

import { Button } from '@/app/components/ui/button';
import type { NewsArticle, NewsJournalEntry } from '@/app/lib/news';
import type { SaveNewsJournalState } from '@/app/lib/news-actions';
import { saveNewsJournalEntry } from '@/app/lib/news-actions';
import { useLocale } from '@/app/hooks/use-locale';

type NewsJournalTabProps = {
  articles: NewsArticle[];
  logicalDate: string;
  initialEntries: NewsJournalEntry[];
};

type DraftState = {
  rating: number | null;
  comment: string;
};

const PAGE_SIZE = 10;
const initialActionState: SaveNewsJournalState = { status: 'idle' };

const COPY = {
  zh: {
    heading: '今日新闻评论',
    subtitle: '从中英文头条里挑选你感兴趣的新闻，为它们打分并写下你的看法。',
    refresh: '换一批',
    pending: '保存中…',
    success: '已保存到今日记录。',
    error: '保存失败，请稍后重试。',
    ratingLabel: '心情评分',
    ratingError: '请选择一个分值',
    commentLabel: '评论',
    commentPlaceholder: '写下你的感受或思考…',
    saveButton: '保存到今日记录',
    viewOriginal: '查看原文',
    savedChip: '已保存',
    noNews: '暂无更多新闻，请稍后再试。',
  },
  en: {
    heading: "Today's News Journal",
    subtitle:
      'Browse today’s headlines in Chinese and English, rate how they make you feel, and jot down your thoughts.',
    refresh: 'Refresh',
    pending: 'Saving…',
    success: 'Saved to today’s journal.',
    error: 'Save failed, please try again later.',
    ratingLabel: 'Feeling rating',
    ratingError: 'Please choose a score',
    commentLabel: 'Comment',
    commentPlaceholder: 'Share how this headline makes you feel…',
    saveButton: 'Save to today’s journal',
    viewOriginal: 'Open article',
    savedChip: 'Saved',
    noNews: 'No additional headlines right now. Please try again later.',
  },
} as const;

export function NewsJournalTab({ articles, logicalDate, initialEntries }: NewsJournalTabProps) {
  const [locale] = useLocale();
  const isZh = locale === 'zh';
  const copy = isZh ? COPY.zh : COPY.en;

  const [startIndex, setStartIndex] = React.useState(0);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [pendingArticleId, setPendingArticleId] = React.useState<string | null>(null);
  const [savedEntries, setSavedEntries] = React.useState<Map<string, NewsJournalEntry>>(
    () => new Map(initialEntries.map((entry) => [entry.id, entry])),
  );
  const [drafts, setDrafts] = React.useState<Record<string, DraftState>>(() => {
    const map: Record<string, DraftState> = {};
    initialEntries.forEach((entry) => {
      map[entry.id] = {
        rating: entry.rating,
        comment: entry.comment,
      };
    });
    return map;
  });

  const [actionState, formAction, isPending] = useActionState(saveNewsJournalEntry, initialActionState);

  React.useEffect(() => {
    if (actionState.status === 'success' && actionState.entries) {
      setSavedEntries(new Map(actionState.entries.map((entry) => [entry.id, entry])));
      setDrafts((prev) => {
        const next = { ...prev };
        actionState.entries?.forEach((entry) => {
          next[entry.id] = {
            rating: entry.rating,
            comment: entry.comment,
          };
        });
        return next;
      });
    }
  }, [actionState]);

  React.useEffect(() => {
    if (!isPending) {
      setPendingArticleId(null);
    }
  }, [isPending]);

  const visibleArticles = React.useMemo(
    () => articles.slice(startIndex, Math.min(startIndex + PAGE_SIZE, articles.length)),
    [articles, startIndex],
  );

  const canRefresh = startIndex + PAGE_SIZE < articles.length;

  const handleRefresh = () => {
    if (!canRefresh) {
      return;
    }
    setExpandedId(null);
    setStartIndex((prev) => prev + PAGE_SIZE);
  };

  const handleToggle = (articleId: string) => {
    setExpandedId((prev) => (prev === articleId ? null : articleId));
  };

  const updateDraft = (articleId: string, updates: Partial<DraftState>) => {
    setDrafts((prev) => {
      const existing = prev[articleId] ?? {
        rating: savedEntries.get(articleId)?.rating ?? null,
        comment: savedEntries.get(articleId)?.comment ?? '',
      };
      return {
        ...prev,
        [articleId]: {
          rating: updates.rating ?? existing.rating ?? null,
          comment: updates.comment ?? existing.comment ?? '',
        },
      };
    });
  };

  const renderRatingButtons = (articleId: string, currentRating: number | null) => (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((score) => {
        const isSelected = currentRating === score;
        return (
          <button
            key={score}
            type="button"
            className={`rounded-md border px-3 py-1 text-sm font-medium transition ${
              isSelected
                ? 'border-[var(--selected-bg)] bg-[var(--selected-bg)] text-[var(--selected-foreground)] shadow-sm'
                : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]'
            }`}
            onClick={() => updateDraft(articleId, { rating: score })}
          >
            {score}
          </button>
        );
      })}
    </div>
  );

  const pendingMessage = isPending && pendingArticleId ? copy.pending : null;

  return (
    <div className="pb-32 text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">{copy.heading}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{copy.subtitle}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={handleRefresh} disabled={!canRefresh}>
              {copy.refresh}
            </Button>
            {pendingMessage && <span className="text-sm text-[var(--muted-foreground)]">{pendingMessage}</span>}
            {actionState.status === 'success' && (
              <span className="text-sm text-green-600">{actionState.message ?? copy.success}</span>
            )}
            {actionState.status === 'error' && (
              <span className="text-sm text-red-500">{actionState.message ?? copy.error}</span>
            )}
          </div>
        </header>

        {visibleArticles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--muted-foreground)]">
            {copy.noNews}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visibleArticles.map((article) => {
              const saved = savedEntries.get(article.id);
              const draft = drafts[article.id] ?? {
                rating: saved?.rating ?? null,
                comment: saved?.comment ?? '',
              };
              const rating = draft.rating ?? null;
              const comment = draft.comment ?? '';
              const isExpanded = expandedId === article.id;
              const displaySource = article.language === 'zh' ? '澎湃新闻' : article.source;
              const formattedDate = article.publishedAt
                ? new Date(article.publishedAt).toLocaleString(
                    article.language === 'zh' ? 'zh-CN' : 'en-US',
                    { hour12: false },
                  )
                : null;

              return (
                <div
                  key={article.id}
                  className="rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(article.id)}
                      className="text-left text-base font-semibold text-[var(--foreground)] hover:underline"
                    >
                      {article.title}
                    </button>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
                      <span>{displaySource}</span>
                      {formattedDate && <span>{formattedDate}</span>}
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--interactive)] hover:underline"
                      >
                        {copy.viewOriginal}
                      </a>
                      {saved && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">
                          {copy.savedChip}
                        </span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <form
                      action={formAction}
                      onSubmit={() => setPendingArticleId(article.id)}
                      className="mt-4 flex flex-col gap-4 rounded-xl border border-[color:var(--border)] bg-[var(--surface-raised)] p-4"
                    >
                      <input type="hidden" name="logicalDate" value={logicalDate} />
                      <input type="hidden" name="articleId" value={article.id} />
                      <input type="hidden" name="title" value={article.title} />
                      <input type="hidden" name="url" value={article.url} />
                      <input type="hidden" name="source" value={displaySource} />
                      <input type="hidden" name="language" value={article.language} />
                      <input type="hidden" name="publishedAt" value={article.publishedAt ?? ''} />
                      <input type="hidden" name="rating" value={rating ?? ''} />

                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">{copy.ratingLabel}</span>
                        {renderRatingButtons(article.id, rating)}
                      </div>

                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor={`comment-${article.id}`}
                          className="text-sm font-medium text-[var(--foreground)]"
                        >
                          {copy.commentLabel}
                        </label>
                        <textarea
                          id={`comment-${article.id}`}
                          name="comment"
                          value={comment}
                          onChange={(event) => updateDraft(article.id, { comment: event.target.value })}
                          rows={4}
                          className="w-full resize-y rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--interactive)]"
                          placeholder={copy.commentPlaceholder}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <Button
                          type="submit"
                          disabled={rating == null || (isPending && pendingArticleId === article.id)}
                        >
                          {copy.saveButton}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
