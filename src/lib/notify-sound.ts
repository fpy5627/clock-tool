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
  /** 相对 public 目录的路径，如 'notify-sounds/pop-cc0.mp3' */
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
 * 推荐初始音效列表——需放置到 public/notify-sounds 下：
 * - pop-cc0.mp3    [FreeSound, Keweldog, CC0, https://freesound.org/people/Keweldog/sounds/518413/]
 * - beep1-cc0.wav  [ZapSplat, 免费商用，https://www.zapsplat.com/music/bing/]
 * - ding-cc0.mp3   [FreeSound, LittleRobotSoundFactory, CC0, https://freesound.org/people/LittleRobotSoundFactory/sounds/270404/]
 * 如后续添加，务必注明授权和来源。
 */
export const notifySoundMetaList: NotifySoundMeta[] = [
  // 合成音（无需静态文件）
  {
    id: 'bell-synth',
    name: '铃铛',
    synthType: 'bell',
    desc: '明亮的叮当声',
    license: '合成音（前端WebAudio实时生成）',
    sourceUrl: 'synth://bell',
    usageCount: 0,
  },
  {
    id: 'chime-synth',
    name: '提示音',
    synthType: 'chime',
    desc: '柔和提示音',
    license: '合成音（前端WebAudio实时生成）',
    sourceUrl: 'synth://chime',
    usageCount: 0,
  },
  {
    id: 'success-synth',
    name: '成功钟声',
    synthType: 'success',
    desc: '上行三音的成功提示',
    license: '合成音（前端WebAudio实时生成）',
    sourceUrl: 'synth://success',
    usageCount: 0,
  },
  {
    id: 'subtle-synth',
    name: '柔和铃声',
    synthType: 'subtle',
    desc: '细微且温和的短提示',
    license: '合成音（前端WebAudio实时生成）',
    sourceUrl: 'synth://subtle',
    usageCount: 0,
  },
  {
    id: 'reminder-synth',
    name: '温和提醒',
    synthType: 'reminder',
    desc: '双音提示，适中不刺耳',
    license: '合成音（前端WebAudio实时生成）',
    sourceUrl: 'synth://reminder',
    usageCount: 0,
  },
  {
    id: 'kitchen-synth',
    name: '厨房计时器',
    synthType: 'kitchen',
    desc: '模拟厨房计时器滴答',
    license: '合成音（前端WebAudio实时生成）',
    sourceUrl: 'synth://kitchen',
    usageCount: 0,
  },
  {
    id: 'digital-synth',
    name: '电子音',
    synthType: 'digital',
    desc: '电子装置风格的提示音',
    license: '合成音（前端WebAudio实时生成）',
    sourceUrl: 'synth://digital',
    usageCount: 0,
  },

  // 如果后续放置了真实文件，也可以继续保留这些文件型音效
  {
    id: 'pop-cc0',
    name: '流行弹窗音',
    path: 'notify-sounds/pop-cc0.mp3',
    desc: '流行轻弹窗音效，适合通用提醒',
    license: 'CC0（可自由商用，无署名要求）',
    sourceUrl: 'https://freesound.org/people/Keweldog/sounds/518413/',
    usageCount: 0,
  },
  {
    id: 'beep1-cc0',
    name: '简洁提示音（文件）',
    path: 'notify-sounds/beep1-cc0.wav',
    desc: '高频短提示音，适合短倒计时提醒',
    license: 'ZapSplat 免费商用（无需署名）',
    sourceUrl: 'https://www.zapsplat.com/music/bing/',
    usageCount: 0,
  },
  {
    id: 'ding-cc0',
    name: '经典叮声（文件）',
    path: 'notify-sounds/ding-cc0.mp3',
    desc: '温和经典提示音，柔和不刺耳',
    license: 'CC0（可自由商用，无署名要求）',
    sourceUrl: 'https://freesound.org/people/LittleRobotSoundFactory/sounds/270404/',
    usageCount: 0,
  },
];
