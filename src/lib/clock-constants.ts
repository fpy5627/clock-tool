import type { SoundOption } from '@/types/sound';

// 预设时间选项
export const PRESET_TIMES = [
  { key: '1min', seconds: 60 },
  { key: '3min', seconds: 180 },
  { key: '5min', seconds: 300 },
  { key: '10min', seconds: 600 },
  { key: '15min', seconds: 900 },
  { key: '25min', seconds: 1500 },
  { key: '30min', seconds: 1800 },
  { key: '45min', seconds: 2700 },
  { key: '1hour', seconds: 3600 },
];

// 声音选项 - 自然铃声

/**
 * 声音选项列表
 * 
 * 包含各种自然铃声选项，分为平和之声和自然的生命力两大类
 */
export const SOUND_OPTIONS: SoundOption[] = [
  // 平和之声 (Sounds of Peace)
  { 
    id: 'night_sky', 
    key: 'night_sky',
    name: '夜空',
    nameEn: 'Night Sky',
    description: '深邃宁静的夜空氛围',
    descriptionEn: 'Deep and peaceful night sky ambiance',
    type: 'peace',
    mode: 'peace',
    popularity: 100
  },
  { 
    id: 'shining_stars', 
    key: 'shining_stars',
    name: '闪耀的星',
    nameEn: 'Shining Stars',
    description: '闪烁星光的温柔音调',
    descriptionEn: 'Gentle tones of twinkling starlight',
    type: 'peace',
    mode: 'peace',
    popularity: 98
  },
  { 
    id: 'sunrise', 
    key: 'sunrise',
    name: '日出',
    nameEn: 'Sunrise',
    description: '温暖渐升的日出之光',
    descriptionEn: 'Warm rising light of sunrise',
    type: 'peace',
    mode: 'peace',
    popularity: 96
  },
  { 
    id: 'sunset', 
    key: 'sunset',
    name: '日落',
    nameEn: 'Sunset',
    description: '柔和温暖的日落余晖',
    descriptionEn: 'Soft and warm sunset glow',
    type: 'peace',
    mode: 'peace',
    popularity: 94
  },
  { 
    id: 'meditation', 
    key: 'meditation',
    name: '冥思',
    nameEn: 'Meditation',
    description: '深度冥想的宁静之音',
    descriptionEn: 'Peaceful sounds for deep meditation',
    type: 'peace',
    mode: 'peace',
    popularity: 92
  },
  { 
    id: 'distant_serene', 
    key: 'distant_serene',
    name: '悠远',
    nameEn: 'Distant Serene',
    description: '悠远深邃的宁静空间',
    descriptionEn: 'Distant and deep serene space',
    type: 'peace',
    mode: 'peace',
    popularity: 90
  },
  { 
    id: 'emerald_lotus_pond', 
    key: 'emerald_lotus_pond',
    name: '翠绿荷塘',
    nameEn: 'Emerald Lotus Pond',
    description: '翠绿荷塘的清新音韵',
    descriptionEn: 'Fresh sounds of emerald lotus pond',
    type: 'peace',
    mode: 'peace',
    popularity: 88
  },
  { 
    id: 'moonlit_lotus', 
    key: 'moonlit_lotus',
    name: '月下荷花',
    nameEn: 'Moonlit Lotus',
    description: '月光下荷花的优雅音色',
    descriptionEn: 'Elegant sounds of lotus under moonlight',
    type: 'peace',
    mode: 'peace',
    popularity: 86
  },
  // 自然的生命力 (Natural Vitality)
  { 
    id: 'rippling_water', 
    key: 'rippling_water',
    name: '水波荡漾',
    nameEn: 'Rippling Water',
    description: '水波轻柔荡漾的自然韵律',
    descriptionEn: 'Natural rhythm of gently rippling water',
    type: 'nature',
    mode: 'nature',
    popularity: 100
  },
  { 
    id: 'faint_light', 
    key: 'faint_light',
    name: '微光',
    nameEn: 'Faint Light',
    description: '微弱光线的细腻音色',
    descriptionEn: 'Delicate tones of faint light',
    type: 'nature',
    mode: 'nature',
    popularity: 98
  },
  { 
    id: 'bathing_earth', 
    key: 'bathing_earth',
    name: '沐浴大地',
    nameEn: 'Bathing the Earth',
    description: '阳光沐浴大地的温暖之声',
    descriptionEn: 'Warm sounds of sunlight bathing the earth',
    type: 'nature',
    mode: 'nature',
    popularity: 96
  },
  { 
    id: 'jungle_morning', 
    key: 'jungle_morning',
    name: '丛林晨景',
    nameEn: 'Jungle Morning Scene',
    description: '丛林清晨的生机勃勃',
    descriptionEn: 'Vibrant sounds of jungle morning',
    type: 'nature',
    mode: 'nature',
    popularity: 94
  },
  { 
    id: 'silver_clad', 
    key: 'silver_clad',
    name: '银装素裹',
    nameEn: 'Silver-clad',
    description: '银装素裹的纯净音色',
    descriptionEn: 'Pure sounds of silver-clad landscape',
    type: 'nature',
    mode: 'nature',
    popularity: 92
  },
  { 
    id: 'elegant_tranquil', 
    key: 'elegant_tranquil',
    name: '优雅恬静',
    nameEn: 'Elegant and Tranquil',
    description: '优雅恬静的自然和谐',
    descriptionEn: 'Elegant and tranquil natural harmony',
    type: 'nature',
    mode: 'nature',
    popularity: 90
  },
  { 
    id: 'midsummer_beach', 
    key: 'midsummer_beach',
    name: '盛夏海边',
    nameEn: 'Midsummer Beach',
    description: '盛夏海边的清新活力',
    descriptionEn: 'Fresh vitality of midsummer beach',
    type: 'nature',
    mode: 'nature',
    popularity: 88
  },
  { 
    id: 'midsummer_night', 
    key: 'midsummer_night',
    name: '仲夏的夜',
    nameEn: 'Midsummer Night',
    description: '仲夏夜晚的宁静凉爽',
    descriptionEn: 'Peaceful coolness of midsummer night',
    type: 'nature',
    mode: 'nature',
    popularity: 86
  },
  { 
    id: 'ice_snow_day', 
    key: 'ice_snow_day',
    name: '冰雪天',
    nameEn: 'Ice and Snow Day',
    description: '冰雪世界的纯净清冷',
    descriptionEn: 'Pure and cool sounds of ice and snow',
    type: 'nature',
    mode: 'nature',
    popularity: 84
  },
  { 
    id: 'winter_snow_falling', 
    key: 'winter_snow_falling',
    name: '冬雪飘落',
    nameEn: 'Winter Snow Falling',
    description: '冬雪飘落的轻柔韵律',
    descriptionEn: 'Gentle rhythm of falling winter snow',
    type: 'nature',
    mode: 'nature',
    popularity: 82
  },
  { 
    id: 'primeval_rainforest', 
    key: 'primeval_rainforest',
    name: '原始雨林',
    nameEn: 'Primeval Rainforest',
    description: '原始雨林的神秘生机',
    descriptionEn: 'Mysterious vitality of primeval rainforest',
    type: 'nature',
    mode: 'nature',
    popularity: 80
  },
  { 
    id: 'rain_nourishes_all', 
    key: 'rain_nourishes_all',
    name: '雨润万物',
    nameEn: 'Rain Nourishes All Things',
    description: '春雨滋润万物的生机之声',
    descriptionEn: 'Vital sounds of rain nourishing all things',
    type: 'nature',
    mode: 'nature',
    popularity: 78
  },
];

// 主题颜色选项
export const THEME_COLORS = [
  { id: 'blue', key: 'blue', color: '#3b82f6' },
  { id: 'purple', key: 'purple', color: '#a855f7' },
  { id: 'green', key: 'green', color: '#22c55e' },
  { id: 'orange', key: 'orange', color: '#f97316' },
  { id: 'pink', key: 'pink', color: '#ec4899' },
  { id: 'cyan', key: 'cyan', color: '#06b6d4' },
  { id: 'red', key: 'red', color: '#dc2626' },
  { id: 'magenta', key: 'magenta', color: '#d946ef' },
  { id: 'indigo', key: 'indigo', color: '#6366f1' },
  { id: 'yellow', key: 'yellow', color: '#eab308' },
  { id: 'lime', key: 'lime', color: '#84cc16' },
  { id: 'teal', key: 'teal', color: '#14b8a6' },
  { id: 'white', key: 'white', color: '#ffffff' },
  { id: 'black', key: 'black', color: '#000000' },
  // 渐变色 - gradient用于数字和进度条显示，color用于其他元素
  { id: 'sunset', key: 'sunset', color: '#ff6b6b', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #c44569 100%)' },
  { id: 'ocean', key: 'ocean', color: '#667eea', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'forest', key: 'forest', color: '#0ba360', gradient: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' },
  { id: 'aurora', key: 'aurora', color: '#00c6ff', gradient: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
  { id: 'fire', key: 'fire', color: '#f83600', gradient: 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)' },
  { id: 'candy', key: 'candy', color: '#a8edea', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
];

// 世界城市列表（按UTC时区偏移量从西到东排序）
export const WORLD_CITIES = [
  { key: 'losangeles', timezone: 'America/Los_Angeles', offset: -8, weatherCode: '113', temp: 22, countryKey: 'usa' },
  { key: 'chicago', timezone: 'America/Chicago', offset: -6, weatherCode: '119', temp: 13, countryKey: 'usa' },
  { key: 'newyork', timezone: 'America/New_York', offset: -5, weatherCode: '116', temp: 15, countryKey: 'usa' },
  { key: 'greenwich', timezone: 'Europe/London', offset: 0, weatherCode: '296', temp: 10, countryKey: 'uk' },
  { key: 'london', timezone: 'Europe/London', offset: 0, weatherCode: '296', temp: 12, countryKey: 'uk' },
  { key: 'paris', timezone: 'Europe/Paris', offset: 1, weatherCode: '176', temp: 14, countryKey: 'france' },
  { key: 'moscow', timezone: 'Europe/Moscow', offset: 3, weatherCode: '122', temp: 8, countryKey: 'russia' },
  { key: 'dubai', timezone: 'Asia/Dubai', offset: 4, weatherCode: '113', temp: 32, countryKey: 'uae' },
  { key: 'mumbai', timezone: 'Asia/Kolkata', offset: 5.5, weatherCode: '116', temp: 30, countryKey: 'india' },
  { key: 'beijing', timezone: 'Asia/Shanghai', offset: 8, weatherCode: '116', temp: 22, countryKey: 'china' },
  { key: 'singapore', timezone: 'Asia/Singapore', offset: 8, weatherCode: '296', temp: 28, countryKey: 'singapore' },
  { key: 'tokyo', timezone: 'Asia/Tokyo', offset: 9, weatherCode: '113', temp: 18, countryKey: 'japan' },
  { key: 'seoul', timezone: 'Asia/Seoul', offset: 9, weatherCode: '119', temp: 16, countryKey: 'korea' },
  { key: 'sydney', timezone: 'Australia/Sydney', offset: 10, weatherCode: '113', temp: 24, countryKey: 'australia' },
];

// 更多时区选项（供用户选择）
export const MORE_TIMEZONES = [
  { name: '雅加达', nameEn: 'Jakarta', timezone: 'Asia/Jakarta', country: '印度尼西亚', countryEn: 'Indonesia' },
  { name: '曼谷', nameEn: 'Bangkok', timezone: 'Asia/Bangkok', country: '泰国', countryEn: 'Thailand' },
  { name: '河内', nameEn: 'Hanoi', timezone: 'Asia/Ho_Chi_Minh', country: '越南', countryEn: 'Vietnam' },
  { name: '吉隆坡', nameEn: 'Kuala Lumpur', timezone: 'Asia/Kuala_Lumpur', country: '马来西亚', countryEn: 'Malaysia' },
  { name: '马尼拉', nameEn: 'Manila', timezone: 'Asia/Manila', country: '菲律宾', countryEn: 'Philippines' },
  { name: '台北', nameEn: 'Taipei', timezone: 'Asia/Taipei', country: '中国', countryEn: 'China' },
  { name: '香港', nameEn: 'Hong Kong', timezone: 'Asia/Hong_Kong', country: '中国', countryEn: 'China' },
  { name: '上海', nameEn: 'Shanghai', timezone: 'Asia/Shanghai', country: '中国', countryEn: 'China' },
  { name: '奥克兰', nameEn: 'Auckland', timezone: 'Pacific/Auckland', country: '新西兰', countryEn: 'New Zealand' },
  { name: '墨尔本', nameEn: 'Melbourne', timezone: 'Australia/Melbourne', country: '澳大利亚', countryEn: 'Australia' },
  { name: '布里斯班', nameEn: 'Brisbane', timezone: 'Australia/Brisbane', country: '澳大利亚', countryEn: 'Australia' },
  { name: '珀斯', nameEn: 'Perth', timezone: 'Australia/Perth', country: '澳大利亚', countryEn: 'Australia' },
  { name: '德里', nameEn: 'Delhi', timezone: 'Asia/Kolkata', country: '印度', countryEn: 'India' },
  { name: '卡拉奇', nameEn: 'Karachi', timezone: 'Asia/Karachi', country: '巴基斯坦', countryEn: 'Pakistan' },
  { name: '开罗', nameEn: 'Cairo', timezone: 'Africa/Cairo', country: '埃及', countryEn: 'Egypt' },
  { name: '伊斯坦布尔', nameEn: 'Istanbul', timezone: 'Europe/Istanbul', country: '土耳其', countryEn: 'Turkey' },
  { name: '柏林', nameEn: 'Berlin', timezone: 'Europe/Berlin', country: '德国', countryEn: 'Germany' },
  { name: '罗马', nameEn: 'Rome', timezone: 'Europe/Rome', country: '意大利', countryEn: 'Italy' },
  { name: '马德里', nameEn: 'Madrid', timezone: 'Europe/Madrid', country: '西班牙', countryEn: 'Spain' },
  { name: '阿姆斯特丹', nameEn: 'Amsterdam', timezone: 'Europe/Amsterdam', country: '荷兰', countryEn: 'Netherlands' },
  { name: '布鲁塞尔', nameEn: 'Brussels', timezone: 'Europe/Brussels', country: '比利时', countryEn: 'Belgium' },
  { name: '苏黎世', nameEn: 'Zurich', timezone: 'Europe/Zurich', country: '瑞士', countryEn: 'Switzerland' },
  { name: '斯德哥尔摩', nameEn: 'Stockholm', timezone: 'Europe/Stockholm', country: '瑞典', countryEn: 'Sweden' },
  { name: '多伦多', nameEn: 'Toronto', timezone: 'America/Toronto', country: '加拿大', countryEn: 'Canada' },
  { name: '温哥华', nameEn: 'Vancouver', timezone: 'America/Vancouver', country: '加拿大', countryEn: 'Canada' },
  { name: '蒙特利尔', nameEn: 'Montreal', timezone: 'America/Montreal', country: '加拿大', countryEn: 'Canada' },
  { name: '墨西哥城', nameEn: 'Mexico City', timezone: 'America/Mexico_City', country: '墨西哥', countryEn: 'Mexico' },
  { name: '圣保罗', nameEn: 'São Paulo', timezone: 'America/Sao_Paulo', country: '巴西', countryEn: 'Brazil' },
  { name: '布宜诺斯艾利斯', nameEn: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', country: '阿根廷', countryEn: 'Argentina' },
  { name: '圣地亚哥', nameEn: 'Santiago', timezone: 'America/Santiago', country: '智利', countryEn: 'Chile' },
];

// 闹钟类型定义
export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
  repeat: 'once' | 'daily' | 'weekdays' | 'weekends';
  label?: string;
}

// 自定义时区类型
export interface CustomTimezone {
  id: string;
  city: string;
  country: string;
  timezone: string;
}

