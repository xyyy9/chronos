export const MENTAL_WORLD_VALUES = [
  'MOVIE',
  'GAME',
  'TRAVEL',
  'BOOK',
  'DRAMA',
  'MUSIC',
  'STUDY',
] as const;

export type MentalWorldValue = (typeof MENTAL_WORLD_VALUES)[number];

export const MENTAL_WORLD_OPTIONS: Array<{
  value: MentalWorldValue;
  label: string;
  labelEn: string;
  placeholder: string;
  placeholderEn: string;
  color: string;
}> = [
  {
    value: 'MOVIE',
    label: '电影',
    labelEn: 'Movies',
    placeholder: '例如：《沙丘2》',
    placeholderEn: 'e.g., Dune: Part Two',
    color: '#60a5fa',
  },
  {
    value: 'GAME',
    label: '游戏',
    labelEn: 'Games',
    placeholder: '例如：塞尔达传说 王国之泪',
    placeholderEn: 'e.g., Zelda: Tears of the Kingdom',
    color: '#38bdf8',
  },
  {
    value: 'TRAVEL',
    label: '旅游',
    labelEn: 'Travel',
    placeholder: '例如：Orlando',
    placeholderEn: 'e.g., Orlando',
    color: '#34d399',
  },
  {
    value: 'BOOK',
    label: '读书',
    labelEn: 'Books',
    placeholder: '例如：《了不起的盖茨比》',
    placeholderEn: 'e.g., The Great Gatsby',
    color: '#a855f7',
  },
  {
    value: 'DRAMA',
    label: '看剧',
    labelEn: 'TV Shows',
    placeholder: '例如：《甄嬛传》',
    placeholderEn: 'e.g., Empresses in the Palace',
    color: '#fb7185',
  },
  {
    value: 'MUSIC',
    label: '音乐',
    labelEn: 'Music',
    placeholder: '例如：Tears',
    placeholderEn: 'e.g., Tears',
    color: '#facc15',
  },
  {
    value: 'STUDY',
    label: '学习',
    labelEn: 'Study',
    placeholder: '例如：AI Agent',
    placeholderEn: 'e.g., AI Agents',
    color: '#f97316',
  },
];

export const DAILY_LIFE_VALUES = [
  'DINING_OUT',
  'SHOWER',
  'LAUNDRY',
  'HOSPITAL',
  'GROCERIES',
  'WALK',
] as const;

export type DailyLifeValue = (typeof DAILY_LIFE_VALUES)[number];

export const DAILY_LIFE_OPTIONS: Array<{
  value: DailyLifeValue;
  label: string;
  labelEn: string;
  color: string;
}> = [
  { value: 'DINING_OUT', label: '外食', labelEn: 'Dining Out', color: '#f97316' },
  { value: 'SHOWER', label: '洗澡', labelEn: 'Shower', color: '#60a5fa' },
  { value: 'LAUNDRY', label: '洗衣服', labelEn: 'Laundry', color: '#a855f7' },
  { value: 'HOSPITAL', label: '看病', labelEn: 'Medical Visit', color: '#f87171' },
  { value: 'GROCERIES', label: '去超市', labelEn: 'Groceries', color: '#34d399' },
  { value: 'WALK', label: '散步', labelEn: 'Walk', color: '#38bdf8' },
];

export const PRIMARY_ACTIVITY_VALUES = ['WORK', 'STUDY', 'FITNESS', 'REST', 'SOCIAL', 'CREATIVE'] as const;

export type PrimaryActivityValue = (typeof PRIMARY_ACTIVITY_VALUES)[number];

export const PRIMARY_ACTIVITY_OPTIONS: Array<{
  value: PrimaryActivityValue;
  label: string;
  labelEn: string;
  color: string;
}> = [
  { value: 'WORK', label: '工作', labelEn: 'Work', color: '#ef4444' },
  { value: 'STUDY', label: '学习', labelEn: 'Study', color: '#6366f1' },
  { value: 'FITNESS', label: '健身', labelEn: 'Fitness', color: '#10b981' },
  { value: 'REST', label: '休息', labelEn: 'Rest', color: '#fbbf24' },
  { value: 'SOCIAL', label: '社交', labelEn: 'Social', color: '#38bdf8' },
  { value: 'CREATIVE', label: '创作', labelEn: 'Creative', color: '#f472b6' },
];
