"use client";

import { FC } from "react";
import { Volume2 } from "lucide-react";
import type { SoundOption } from "@/types/sound";

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
        {soundOptions
          .sort((a, b) => {
            // 先按使用统计排序，再按人气排序
            const aUsage = soundUsageStats?.[a.id] || 0;
            const bUsage = soundUsageStats?.[b.id] || 0;
            if (aUsage !== bUsage) return bUsage - aUsage; // 使用次数多的在前
            return b.popularity - a.popularity; // 人气高的在前
          })
          .map((sound, index) => {
            const usageCount = soundUsageStats?.[sound.id] || 0;
            const isSelected = selectedSound === sound.id;

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
                          {locale === "zh" ? sound.name : sound.nameEn}
                        </span>
                        {index === 0 && (
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
                        {locale === "zh"
                          ? sound.description
                          : sound.descriptionEn}
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
                    playNotificationSound(sound.id);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    theme === "dark"
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  title={t("settings_panel.sound_preview")}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
};

