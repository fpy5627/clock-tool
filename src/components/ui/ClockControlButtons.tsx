"use client";

import { motion } from 'framer-motion';
import { Bell, BellOff, Volume2, VolumeX, Moon, Sun, Settings, Maximize, X } from 'lucide-react';

/**
 * ClockControlButtons 组件的 Props 接口
 */
export interface ClockControlButtonsProps {
  /** 当前主题 ('dark' | 'light') */
  theme: string | undefined;
  /** 通知是否启用 */
  notificationEnabled: boolean;
  /** 切换通知状态的函数 */
  onNotificationToggle: () => void;
  /** 声音是否启用 */
  soundEnabled: boolean;
  /** 切换声音状态的函数 */
  onSoundToggle: () => void;
  /** 切换主题的函数 */
  onThemeToggle: () => void;
  /** 设置面板是否显示 */
  showSettingsPanel: boolean;
  /** 切换设置面板显示状态的函数 */
  onSettingsToggle: () => void;
  /** 切换全屏的函数 */
  onFullscreenToggle: () => void;
  /** 是否处于全屏模式 */
  isFullscreen: boolean;
  /** 翻译函数 */
  t: (key: string) => string;
  /** 是否显示控制按钮 */
  showControls?: boolean;
  /** 鼠标进入事件处理函数 */
  onMouseEnter?: () => void;
  /** 鼠标离开事件处理函数 */
  onMouseLeave?: () => void;
  /** 是否在移动端隐藏通知按钮 */
  hideNotificationOnMobile?: boolean;
}

/**
 * ClockControlButtons 组件
 * 
 * 时钟工具页面的右侧控制按钮组件，包含：
 * - 通知开关按钮
 * - 声音开关按钮
 * - 主题切换按钮（白天/夜晚）
 * - 设置面板按钮
 * - 全屏切换按钮
 * 
 * 支持普通模式和全屏模式两种样式。
 * 
 * @param props - 组件属性
 * @returns 控制按钮组
 */
export default function ClockControlButtons({
  theme,
  notificationEnabled,
  onNotificationToggle,
  soundEnabled,
  onSoundToggle,
  onThemeToggle,
  showSettingsPanel,
  onSettingsToggle,
  onFullscreenToggle,
  isFullscreen,
  t,
  showControls = true,
  onMouseEnter,
  onMouseLeave,
  hideNotificationOnMobile = true,
}: ClockControlButtonsProps) {
  // 普通模式下的按钮组
  if (!isFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="hidden sm:flex fixed top-20 sm:top-24 right-2 sm:right-4 gap-0.5 sm:gap-2 z-40"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* 通知按钮 */}
        {hideNotificationOnMobile && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNotificationToggle}
            className={`hidden sm:flex p-1 sm:p-2.5 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-md sm:rounded-lg transition-colors`}
            title={notificationEnabled ? t('tooltips.close_notification') : t('tooltips.open_notification')}
            aria-label={notificationEnabled ? t('tooltips.close_notification') : t('tooltips.open_notification')}
          >
            {notificationEnabled ? (
              <Bell className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
            ) : (
              <BellOff className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
            )}
          </motion.button>
        )}

        {/* 声音按钮 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSoundToggle}
          className={`p-1 sm:p-2.5 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-md sm:rounded-lg transition-colors`}
          title={soundEnabled ? t('tooltips.close_sound') : t('tooltips.open_sound')}
          aria-label={soundEnabled ? t('tooltips.close_sound') : t('tooltips.open_sound')}
        >
          {soundEnabled ? (
            <Volume2 className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
          ) : (
            <VolumeX className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
          )}
        </motion.button>

        {/* 主题切换按钮 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onThemeToggle}
          className={`p-1 sm:p-2.5 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-md sm:rounded-lg transition-colors`}
          title={theme === 'dark' ? t('tooltips.switch_to_light') : t('tooltips.switch_to_dark')}
          aria-label={theme === 'dark' ? t('tooltips.switch_to_light') : t('tooltips.switch_to_dark')}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-white" />
          ) : (
            <Moon className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-black" />
          )}
        </motion.button>

        {/* 设置按钮 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSettingsToggle}
          className={`hidden sm:flex p-1 sm:p-2 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-md sm:rounded-lg transition-colors ${showSettingsPanel ? 'ring-2 ring-blue-500' : ''}`}
          title={t('buttons.settings')}
          aria-label={t('buttons.settings')}
        >
          <Settings className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
        </motion.button>

        {/* 全屏按钮 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onFullscreenToggle}
          className={`p-1 sm:p-2 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-md sm:rounded-lg transition-colors`}
          title={t('tooltips.fullscreen')}
          aria-label={t('tooltips.fullscreen')}
        >
          <Maximize className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
        </motion.button>
      </motion.div>
    );
  }

  // 全屏模式下的按钮组
  if (!showControls) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="hidden sm:flex fixed top-1 sm:top-6 right-1 sm:right-6 gap-0.5 sm:gap-3 z-50"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 声音按钮 - 桌面端显示 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSoundToggle}
        className="p-1.5 sm:p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-md sm:rounded-xl transition-all shadow-2xl border border-white/20"
        title={soundEnabled ? t('tooltips.close_sound') : t('tooltips.open_sound')}
        aria-label={soundEnabled ? t('tooltips.close_sound') : t('tooltips.open_sound')}
      >
        {soundEnabled ? (
          <Volume2 className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
        ) : (
          <VolumeX className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
        )}
      </motion.button>

      {/* 退出全屏按钮 - 桌面端显示 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onFullscreenToggle}
        className="p-1.5 sm:p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-md sm:rounded-xl transition-all shadow-2xl border border-white/20"
        title={t('tooltips.exit_fullscreen')}
        aria-label={t('tooltips.exit_fullscreen')}
      >
        <X className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
      </motion.button>
    </motion.div>
  );
}

