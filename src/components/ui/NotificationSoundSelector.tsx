"use client";

import { FC, useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, ChevronDown, ChevronUp } from "lucide-react";
import type { SoundOption } from "@/types/sound";
import { notifySoundMetaList } from "@/lib/notify-sound";

/**
 * NotificationSoundSelector 组件的 Props 接口
 */
interface NotificationSoundSelectorProps {
  /** 当前选中的声音 ID */
  selectedSound: string;
  /** 设置选中声音的函数 */
  setSelectedSound: (soundId: string) => void;
  /** 声音选项列表 */
  soundOptions: SoundOption[];
  /** 声音使用统计（key: 声音ID, value: 使用次数） */
  soundUsageStats?: Record<string, number>;
  /** 设置声音使用统计的函数 */
  setSoundUsageStats?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  /** 当前主题 ('dark' | 'light') */
  theme: string | undefined;
  /** 当前语言环境 */
  locale: string;
  /** 翻译函数 */
  t: (key: string, params?: { count?: number }) => string;
  /** 播放通知声音的函数 */
  playNotificationSound: (soundId: string) => void;
}

/**
 * NotificationSoundSelector 组件
 * 
 * 用于选择和预览通知声音的公共组件。
 * 支持声音选择、试听、使用统计显示等功能。
 * 
 * @param props - 组件属性
 * @returns Notification Sound 选择器 UI
 */
export const NotificationSoundSelector: FC<NotificationSoundSelectorProps> = ({
  selectedSound,
  setSelectedSound,
  soundOptions,
  soundUsageStats,
  setSoundUsageStats,
  theme,
  locale,
  t,
  playNotificationSound,
}) => {
  // 展开/收起状态
  const [isExpanded, setIsExpanded] = useState(false);
  // 当前正在播放的音频ID
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  // 所有正在播放的音频元素引用（使用 Map 来跟踪）
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  // 用于检查音频播放状态的定时器
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 停止所有音频的辅助函数
  const stopAllAudio = () => {
    // 停止所有 DOM 中的音频元素
    const allAudioElements = document.querySelectorAll('audio[data-sound-id]') as NodeListOf<HTMLAudioElement>;
    allAudioElements.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    
    // 停止所有跟踪的音频元素
    audioElementsRef.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    audioElementsRef.current.clear();
    
    setPlayingSoundId(null);
  };

  // 检查音频播放状态
  useEffect(() => {
    if (playingSoundId) {
      checkIntervalRef.current = setInterval(() => {
        const audio = audioElementsRef.current.get(playingSoundId);
        if (!audio || audio.paused || audio.ended) {
          // 检查 DOM 中的音频
          const domAudio = document.querySelector(`audio[data-sound-id="${playingSoundId}"]`) as HTMLAudioElement;
          if (!domAudio || domAudio.paused || domAudio.ended) {
            setPlayingSoundId(null);
            audioElementsRef.current.delete(playingSoundId);
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
          }
        }
      }, 100);
    } else {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [playingSoundId]);

  // 组件卸载时停止所有音频
  useEffect(() => {
    return () => {
      // 停止所有 DOM 中的音频元素
      const allAudioElements = document.querySelectorAll('audio[data-sound-id]') as NodeListOf<HTMLAudioElement>;
      allAudioElements.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      
      // 停止所有跟踪的音频元素
      audioElementsRef.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      audioElementsRef.current.clear();
      
      // 清理定时器
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, []);

  /**
   * 处理声音选择
   * 更新选中的声音并记录使用统计
   * 
   * @param soundId - 选中的声音 ID
   */
  const handleSoundSelect = (soundId: string) => {
    setSelectedSound(soundId);
    // 更新使用统计
    if (setSoundUsageStats) {
      setSoundUsageStats((prev) => ({
        ...prev,
        [soundId]: (prev?.[soundId] || 0) + 1,
      }));
    }
  };

  /**
   * 处理试听按钮点击
   * 如果音频正在播放，则停止；否则开始播放
   * 
   * @param soundId - 要播放/停止的声音 ID
   */
  const handlePreviewClick = (soundId: string) => {
    // 先检查是否正在播放（通过状态变量和跟踪的音频元素）
    const isCurrentlyPlaying = playingSoundId === soundId;
    const trackedAudio = audioElementsRef.current.get(soundId);
    const isTrackedPlaying = trackedAudio && !trackedAudio.paused && !trackedAudio.ended;
    
    // 如果正在播放，则停止
    if (isCurrentlyPlaying || isTrackedPlaying) {
      // 停止所有音频元素
      const allAudioElements = document.querySelectorAll('audio[data-sound-id]') as NodeListOf<HTMLAudioElement>;
      allAudioElements.forEach((audioEl) => {
        audioEl.pause();
        audioEl.currentTime = 0;
      });
      
      // 停止跟踪的音频元素
      if (trackedAudio) {
        trackedAudio.pause();
        trackedAudio.currentTime = 0;
      }
      audioElementsRef.current.delete(soundId);
      
      // 清除状态
      setPlayingSoundId(null);
      return;
    }
    
    // 如果未播放，则开始播放
    // 先停止所有正在播放的音频（确保不会多个音频同时播放）
    stopAllAudio();
    
    // 查找音频配置
    const sound = notifySoundMetaList.find(s => s.id === soundId);
    if (!sound || !sound.path) {
      // 如果没有找到音频配置，使用原来的播放函数
      playNotificationSound(soundId);
      setPlayingSoundId(soundId);
      return;
    }
    
    // 创建新的音频元素并播放
    const audioPath = sound.path.startsWith('http://') || sound.path.startsWith('https://') 
      ? sound.path 
      : `/${sound.path}`;
    
    const audio = new Audio(audioPath);
    audio.setAttribute('data-sound-id', soundId);
    audio.volume = 0.8;
    
    // 保存音频引用
    audioElementsRef.current.set(soundId, audio);
    setPlayingSoundId(soundId);
    
    // 监听音频播放结束事件
    const handleEnded = () => {
      setPlayingSoundId((prev) => {
        if (prev === soundId) {
          audioElementsRef.current.delete(soundId);
          return null;
        }
        return prev;
      });
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
    };
    
    // 监听音频暂停事件
    const handlePause = () => {
      if (audio.paused && !audio.ended) {
        setPlayingSoundId((prev) => {
          if (prev === soundId) {
            audioElementsRef.current.delete(soundId);
            return null;
          }
          return prev;
        });
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('pause', handlePause);
      }
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    
    // 播放音频
    audio.play().catch((error) => {
      console.warn('Failed to play sound file:', error);
      setPlayingSoundId(null);
      audioElementsRef.current.delete(soundId);
    });
  };

  // 排序后的铃声列表
  const sortedSounds = [...soundOptions].sort((a, b) => {
    // 先按使用统计排序，再按人气排序
    const aUsage = soundUsageStats?.[a.id] || 0;
    const bUsage = soundUsageStats?.[b.id] || 0;
    if (aUsage !== bUsage) return bUsage - aUsage; // 使用次数多的在前
    return b.popularity - a.popularity; // 人气高的在前
  });

  // 显示的铃声列表（展开时显示全部，收起时只显示前3个）
  const displayedSounds = isExpanded ? sortedSounds : sortedSounds.slice(0, 3);
  const hasMore = sortedSounds.length > 3;

  return (
    <div className="mb-6">
      <label
        className={`block text-sm font-medium ${
          theme === "dark" ? "text-slate-300" : "text-gray-700"
        } mb-3`}
      >
        {t("settings_panel.notification_sound")}
      </label>
      <div className="space-y-2">
        {displayedSounds.map((sound, index) => {
          const usageCount = soundUsageStats?.[sound.id] || 0;
          const isSelected = selectedSound === sound.id;
          const isMostPopular = index === 0;

          return (
            <div
              key={sound.id}
              className={`flex items-center gap-2 p-3 rounded-lg transition-all border ${
                isSelected
                  ? theme === "dark"
                    ? "bg-blue-500/20 border-blue-500"
                    : "bg-blue-50 border-blue-500"
                  : theme === "dark"
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {/* 左侧：选择按钮和名称 */}
              <button
                onClick={() => handleSoundSelect(sound.id)}
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-blue-500 bg-blue-500"
                        : theme === "dark"
                        ? "border-slate-400"
                        : "border-gray-400"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium ${
                          isSelected
                            ? theme === "dark"
                              ? "text-blue-300"
                              : "text-blue-700"
                            : theme === "dark"
                            ? "text-slate-200"
                            : "text-gray-800"
                        }`}
                      >
                        {(() => {
                          const translationKey = `sounds.${sound.id.replace(/-/g, "_")}`;
                          const translated = t(translationKey);
                          // 如果翻译返回的是 key 本身（说明翻译不存在），则使用 fallback
                          return translated === translationKey 
                            ? (locale === "zh" ? sound.name : sound.nameEn)
                            : translated;
                        })()}
                      </span>
                      {isMostPopular && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            theme === "dark"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {t("settings_panel.most_popular")}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs mt-0.5 ${
                        theme === "dark" ? "text-slate-400" : "text-gray-500"
                      }`}
                    >
                      {(() => {
                        const descriptionKey = `sound_descriptions.${sound.id.replace(/-/g, "_")}`;
                        const translated = t(descriptionKey);
                        // 如果翻译返回的是 key 本身（说明翻译不存在），则使用 fallback
                        return translated === descriptionKey 
                          ? (locale === "zh" ? sound.description : sound.descriptionEn)
                          : translated;
                      })()}
                      {usageCount > 0 && (
                        <span className="ml-2">
                          · {t("settings_panel.usage_count", { count: usageCount })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </button>

              {/* 右侧：试听按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewClick(sound.id);
                }}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  playingSoundId === sound.id
                    ? theme === "dark"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-red-500 text-white hover:bg-red-600"
                    : theme === "dark"
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                title={playingSoundId === sound.id ? "停止播放" : t("settings_panel.sound_preview")}
              >
                {playingSoundId === sound.id ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        })}

        {/* 更多按钮 */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-lg transition-all border ${
              theme === "dark"
                ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700"
            }`}
          >
            <span className="text-sm font-medium">
              {isExpanded ? t("settings_panel.show_less") : t("settings_panel.show_more")}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

