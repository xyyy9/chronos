import { DAILY_LIFE_VALUES, MENTAL_WORLD_VALUES, PRIMARY_ACTIVITY_VALUES } from '@/app/lib/activity-options';
import type { DailyLifeValue, MentalWorldValue, PrimaryActivityValue } from '@/app/lib/activity-options';
import { createUtcDateFromKey, formatDateKey, getCurrentLogicalDateKey } from '@/app/lib/date-utils';
import type { NewsJournalEntry } from '@/app/lib/news';

type DemoLog = {
  logicalDate: string;
  mood: number;
  sleepQuality: number;
  energyLevel: number;
  primaryActivities: PrimaryActivityValue[];
  mentalWorldActivities: Array<{ value: MentalWorldValue; detail: string }>;
  dailyLifeActivities: DailyLifeValue[];
  notes?: string;
  newsEntries: NewsJournalEntry[];
};

const NOTE_PREFIXES = [
  '清晨阳台晒太阳时',
  '早餐后的空档里',
  '午后咖啡馆里',
  '地铁通勤的路上',
  '傍晚散步途中',
  '夜跑结束后',
  '练瑜伽的间隙',
  '听播客的同时',
  '阅读角落里',
  '整理房间时',
  '做饭的间隙',
  '学习休息时',
  '写日记前',
  '练琴结束后',
  '准备睡觉前',
  '查看待办清单时',
  '给朋友发消息后',
  '望着窗外的雨时',
  '看完纪录片后',
  '给自己泡茶时',
];

const NOTE_OBSERVATIONS = [
  '忽然觉得身体轻了一点',
  '冒出一个新的灵感',
  '意识到需要慢下来',
  '决定给自己放个小假',
  '对今天的收获挺满意',
  '感觉情绪比昨天稳定',
  '决定早点关掉手机',
  '突然想去郊外走走',
  '计划周末尝试新菜谱',
  '想把快乐分享给别人',
  '给自己写了张小卡片',
  '把旧书整理得整整齐齐',
  '发现坚持真的有效果',
  '想尝试新的晨间习惯',
  '决定补充一些维生素',
  '想约朋友一起运动',
  '给家人打了个电话',
  '感受到充足的安全感',
  '决定延续这个节奏',
  '在心里默默感谢今天',
];

const NOTE_CLOSERS = [
  '，希望明天也延续这样的节奏。',
  '，准备把它写进下一周的计划里。',
  '，于是决定晚上早点休息。',
  '，今晚给自己奖励一份甜品。',
  '，记录下来提醒自己保持耐心。',
  '，准备周末再回顾一次。',
  '，要记得继续关注身体的反馈。',
  '，决定在下一次会议上试试看。',
  '，也许可以写成一篇博客。',
  '，瞬间觉得整个人都被点亮了。',
  '，让今天的努力变得更有意义。',
  '，想把这种心情拍成照片留住。',
  '，准备明天早起继续体验。',
  '，感觉这正是我需要的节奏。',
  '，决定把好状态分享给身边人。',
  '，也提醒自己要保持弹性。',
  '，很想就这样多待一会儿。',
  '，默默对自己说辛苦啦。',
  '，于是给自己安排了一个小惊喜。',
  '，让人对接下来充满期待。',
];

const SAMPLE_MENTAL_DETAILS: Record<MentalWorldValue, string[]> = {
  MOVIE: ['沙丘2', '奥本海默', '瞬息全宇宙', '头脑特工队2'],
  GAME: ['塞尔达传说', '霍格沃茨之遗', '动物森友会', '暗黑破坏神4','英雄联盟'],
  TRAVEL: ['杭州西湖', '苏州古城', '京都嵯峨野', '故宫博物院'],
  BOOK: ['原则', '人类简史', '三体', '小王子'],
  DRAMA: ['漫长的季节', '权力的游戏', '请回答1988', 'TBBT','甄嬛传'],
  MUSIC: ['Taylor Swift - Lover', '陈粒 - 小半', 'Doja Cat - Kiss Me More', 'Sabrina Carpenter - Espresso','Lexie Liu - RRR'],
  STUDY: ['React 19 新特性', 'Rust 并发编程', '机器学习导论', '日语 N3 词汇','Python 基础教程'],
};

const buildDemoNote = (seed: number) => {
  const prefix = NOTE_PREFIXES[seed % NOTE_PREFIXES.length];
  const observationIndex = (seed * 3 + 7) % NOTE_OBSERVATIONS.length;
  const closerIndex = (seed * 5 + 11) % NOTE_CLOSERS.length;
  const observation = NOTE_OBSERVATIONS[observationIndex];
  const closer = NOTE_CLOSERS[closerIndex];
  const joiner = prefix.endsWith('时') || prefix.endsWith('后') ? ' ' : '，';
  return `${prefix}${joiner}${observation}${closer}`;
};

const randomSubset = <T,>(values: readonly T[], maxCount: number) => {
  const count = Math.min(
    values.length,
    Math.max(0, Math.floor(Math.random() * (maxCount + 1))),
  );
  const shuffled = [...values].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const generateMentalEntries = () => {
  const subset = randomSubset(MENTAL_WORLD_VALUES, 2);
  return subset.map((value) => {
    const pool = SAMPLE_MENTAL_DETAILS[value];
    const detail = pool[Math.floor(Math.random() * pool.length)];
    return { value, detail };
  });
};

export const generateDemoMonth = (selectedDateKey?: string) => {
  const targetKey = selectedDateKey ?? getCurrentLogicalDateKey();
  const referenceDate = createUtcDateFromKey(targetKey, 12);
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const logs: DemoLog[] = [];
  const byDate: Record<string, DemoLog> = {};

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(start);
    date.setUTCDate(day);

    const logicalDate = formatDateKey(
      new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    const primaryActivities = randomSubset(PRIMARY_ACTIVITY_VALUES, 2) as PrimaryActivityValue[];
    const dailyLifeActivities = randomSubset(DAILY_LIFE_VALUES, 3) as DailyLifeValue[];
    const mentalWorldActivities = generateMentalEntries();

    const seed = year * 10000 + (month + 1) * 100 + day;

    const entry: DemoLog = {
      logicalDate,
      mood: Math.floor(Math.random() * 5) + 1,
      sleepQuality: Math.floor(Math.random() * 5) + 1,
      energyLevel: Math.floor(Math.random() * 5) + 1,
      primaryActivities,
      mentalWorldActivities,
      dailyLifeActivities,
      notes: buildDemoNote(seed),
      newsEntries: [],
    };

    logs.push(entry);
    byDate[logicalDate] = entry;
  }

  const loggedDates = logs.map((log) => log.logicalDate);
  const initialLog =
    logs.find((log) => log.logicalDate === targetKey) ?? logs[logs.length - 1] ?? null;

  return {
    logs,
    loggedDates,
    initialLog,
    selectedDate: targetKey,
    byDate,
  };
};

export const generateDemoNewsEntries = (logicalDate: string): NewsJournalEntry[] => {
  const now = new Date();
  const base: Array<Omit<NewsJournalEntry, 'recordedAt'>> = [
    {
      id: 'demo-zh-green-energy',
      title: '国家推进新能源基础设施建设，释放绿色发展动能',
      url: 'https://news.example.com/cn/green-energy',
      source: '澎湃新闻',
      language: 'zh',
      publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
      rating: 4,
      comment: '绿色能源势头很好，希望政策能持续推进。',
      snapshotId: undefined,
    },
    {
      id: 'demo-en-market',
      title: 'Global markets rally as inflation shows signs of cooling',
      url: 'https://news.example.com/en/markets-rally',
      source: 'Sample Daily',
      language: 'en',
      publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
      rating: 3,
      comment: '市场回暖让人安心，但仍然要谨慎。',
      snapshotId: undefined,
    },
  ];

  return base.map((entry, index) => ({
    ...entry,
    recordedAt: new Date(
      new Date(`${logicalDate}T08:00:00`).getTime() + index * 1000 * 60 * 15,
    ).toISOString(),
  }));
};
