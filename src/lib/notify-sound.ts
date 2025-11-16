/*
 * 本文件导出所有用于计时器页面的提示音元数据。
 * 音效全部收录自允许商用（CC0、一部分ZapSplat免费授权）渠道。
 * 变更需保证新增音效无版权隐患并写明说明、用途、来源和授权。
 */

export interface NotifySoundMeta {
  /** 音效唯一ID（建议用文件名去除后缀） */
  id: string;
  /** 展示用中文名 */
  name: string;
  /** 相对 public 目录的路径，如 'notify-sounds/bell.wav'，或外部URL（http://或https://开头） */
  path?: string;
  /**
   * 合成音类型（当 path 为空时生效）
   * 使用 WebAudio 在前端实时合成，避免对静态音频文件的依赖
   */
  synthType?:
    | 'bell'        // 钟铃/叮当
    | 'chime'       // 柔和提示
    | 'success'     // 成功提示（上行三音）
    | 'subtle'      // 细微/柔和短音
    | 'reminder'    // 双音提醒
    | 'kitchen'     // 厨房计时器短滴答
    | 'digital';    // 电子提示音
  /** 简要用途/描述 */
  desc: string;
  /** 授权说明：CC0 或 Zapsplat 免费授权等 */
  license: string;
  /** 原作品/来源URL */
  sourceUrl: string;
  /** 当前该提示音被使用次数（排序参考，可由本地化存储覆盖） */
  usageCount: number;
}

/**
 * 音效列表——使用 public/notify-sounds 目录下的实际音频文件
 */
export const notifySoundMetaList: NotifySoundMeta[] = [
  {
    id: 'bell',
    name: '铃铛',
    path: 'notify-sounds/bell.wav',
    desc: '清脆的铃铛声，适合提醒和通知',
    license: '用户提供',
    sourceUrl: '',
    usageCount: 0,
  },
  {
    id: 'arabian-mystery-harp',
    name: '阿拉伯神秘竖琴',
    path: 'notify-sounds/arabian-mystery-harp.wav',
    desc: '神秘优雅的竖琴音效，适合特殊场景提醒',
    license: '用户提供',
    sourceUrl: '',
    usageCount: 0,
  },
  {
    id: 'clear-announce-tones',
    name: '清晰公告音',
    path: 'notify-sounds/clear-announce-tones.wav',
    desc: '清晰响亮的公告音效，适合重要通知',
    license: '用户提供',
    sourceUrl: '',
    usageCount: 0,
  },
  {
    id: 'happy-bells',
    name: '快乐铃声',
    path: 'notify-sounds/happy-bells.wav',
    desc: '欢快的铃声，适合成功或完成提示',
    license: '用户提供',
    sourceUrl: '',
    usageCount: 0,
  },
  {
    id: 'melodical-flute-music',
    name: '旋律长笛',
    path: 'notify-sounds/melodical-flute-music.wav',
    desc: '优美的长笛旋律，温和不刺耳',
    license: '用户提供',
    sourceUrl: '',
    usageCount: 0,
  },
  {
    id: 'positive',
    name: '积极提示音',
    path: 'notify-sounds/positive.wav',
    desc: '积极向上的提示音，适合鼓励和肯定',
    license: '用户提供',
    sourceUrl: '',
    usageCount: 0,
  },
  {
    id: 'software-interface-back',
    name: '界面返回音',
    path: 'notify-sounds/software-interface-back.wav',
    desc: '软件界面风格的返回音效',
    license: '用户提供',
    sourceUrl: '',
    usageCount: 0,
  },
  {
    id: 'software-interface-remove',
    name: '界面删除音',
    path: 'notify-sounds/software-interface-remove.wav',
    desc: '软件界面风格的删除音效',
    license: '用户提供',
    sourceUrl: '',
    usageCount: 0,
  },
  {
    id: 'urgent-simple-tone-loop',
    name: '紧急提示音',
    path: 'notify-sounds/urgent-simple-tone-loop.wav',
    desc: '紧急循环提示音，适合重要提醒',
    license: '用户提供',
    sourceUrl: '',
    usageCount: 0,
  },
  {
    id: 'wrong-answer-fail',
    name: '错误提示音',
    path: 'notify-sounds/wrong-answer-fail.wav',
    desc: '错误或失败提示音，适合提醒操作错误',
    license: '用户提供',
    sourceUrl: '',
    usageCount: 0,
  },
  {
    id: 'serene-solo-piano-airy-synth-pad-alpha-wave-v2',
    name: '宁静钢琴阿尔法波V2',
    path: 'https://cdn.pixabay.com/audio/2025/09/21/audio_e02b7f3935.mp3',
    desc: '宁静的独奏钢琴与空灵合成器垫和温和阿尔法波V2，适合专注和放松',
    license: 'Pixabay',
    sourceUrl: 'https://cdn.pixabay.com/audio/2025/09/21/audio_e02b7f3935.mp3',
    usageCount: 0,
  },
  {
    id: 'peaceful-piano-instrumental-studying-focus',
    name: '专注学习钢琴',
    path: 'https://cdn.pixabay.com/audio/2024/08/15/audio_6a3249cbfa.mp3',
    desc: '宁静的钢琴器乐，适合学习和专注',
    license: 'Pixabay',
    sourceUrl: 'https://cdn.pixabay.com/audio/2024/08/15/audio_6a3249cbfa.mp3',
    usageCount: 0,
  },
  {
    id: 'pulse-synthwave-dude',
    name: '脉冲合成波',
    path: 'https://cdn.pixabay.com/audio/2024/05/27/audio_f4e7880776.mp3',
    desc: '脉冲合成波，适合运动和活力场景',
    license: 'Pixabay',
    sourceUrl: 'https://cdn.pixabay.com/audio/2024/05/27/audio_f4e7880776.mp3',
    usageCount: 0,
  },
];
