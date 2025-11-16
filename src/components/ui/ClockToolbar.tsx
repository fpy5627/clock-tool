"use client";

import { AnimatePresence } from 'framer-motion';
import VerticalSidebar from '@/components/blocks/navigation/VerticalSidebar';
import ClockControlButtons from '@/components/ui/ClockControlButtons';

/**
 * ClockToolbar 组件的 Props 接口
 */
export interface ClockToolbarProps {
  /** 当前模式 */
  mode: 'timer' | 'stopwatch' | 'alarm' | 'worldclock';
  /** 是否处于全屏模式 */
  isFullscreen: boolean;
  /** 是否显示控制按钮 */
  showControls: boolean;
  /** 主题 */
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
  /** 翻译函数 */
  t: (key: string) => string;
  /** 鼠标进入事件处理函数 */
  onMouseEnter?: () => void;
  /** 鼠标离开事件处理函数 */
  onMouseLeave?: () => void;
  /** 是否在移动端隐藏通知按钮 */
  hideNotificationOnMobile?: boolean;
}

/**
 * ClockToolbar 组件
 * 
 * 时钟工具页面的工具栏组件，包含：
 * - 非全屏模式下的工具栏（左上角模式切换，右上角功能按钮）
 * - 全屏模式下的浮动工具栏（同样的布局）
 * 
 * @param mode - 当前模式
 * @param isFullscreen - 是否处于全屏模式
 * @param showControls - 是否显示控制按钮
 * @param theme - 主题
 * @param notificationEnabled - 通知是否启用
 * @param onNotificationToggle - 切换通知状态的函数
 * @param soundEnabled - 声音是否启用
 * @param onSoundToggle - 切换声音状态的函数
 * @param onThemeToggle - 切换主题的函数
 * @param showSettingsPanel - 设置面板是否显示
 * @param onSettingsToggle - 切换设置面板显示状态的函数
 * @param onFullscreenToggle - 切换全屏的函数
 * @param t - 翻译函数
 * @param onMouseEnter - 鼠标进入事件处理函数
 * @param onMouseLeave - 鼠标离开事件处理函数
 * @param hideNotificationOnMobile - 是否在移动端隐藏通知按钮
 */
export default function ClockToolbar({
  mode,
  isFullscreen,
  showControls,
  theme,
  notificationEnabled,
  onNotificationToggle,
  soundEnabled,
  onSoundToggle,
  onThemeToggle,
  showSettingsPanel,
  onSettingsToggle,
  onFullscreenToggle,
  t,
  onMouseEnter,
  onMouseLeave,
  hideNotificationOnMobile = false,
}: ClockToolbarProps) {
  return (
    <>
      {/* 顶部工具栏 - 只在非全屏显示 */}
      <AnimatePresence>
        {!isFullscreen && showControls && (
          <>
            {/* 左上角：模式切换 - 移动端隐藏 */}
            <VerticalSidebar
              currentMode={mode}
              isFullscreen={false}
              showControls={showControls}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            />

            {/* 右上角：功能按钮 - 使用公共组件 */}
            <ClockControlButtons
              theme={theme}
              notificationEnabled={notificationEnabled}
              onNotificationToggle={onNotificationToggle}
              soundEnabled={soundEnabled}
              onSoundToggle={onSoundToggle}
              onThemeToggle={onThemeToggle}
              showSettingsPanel={showSettingsPanel}
              onSettingsToggle={onSettingsToggle}
              onFullscreenToggle={onFullscreenToggle}
              isFullscreen={isFullscreen}
              t={t}
              showControls={showControls}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              hideNotificationOnMobile={hideNotificationOnMobile}
            />
          </>
        )}
      </AnimatePresence>

      {/* 全屏模式下的浮动工具栏 */}
      <AnimatePresence>
        {isFullscreen && showControls && (
          <>
            {/* 左上角：模式切换 - PC端全屏模式显示 */}
            <VerticalSidebar
              currentMode={mode}
              isFullscreen={true}
              showControls={showControls}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            />

            {/* 右上角：功能按钮 - 全屏模式使用公共组件 */}
            <ClockControlButtons
              theme={theme}
              notificationEnabled={notificationEnabled}
              onNotificationToggle={onNotificationToggle}
              soundEnabled={soundEnabled}
              onSoundToggle={onSoundToggle}
              onThemeToggle={onThemeToggle}
              showSettingsPanel={showSettingsPanel}
              onSettingsToggle={onSettingsToggle}
              onFullscreenToggle={onFullscreenToggle}
              isFullscreen={isFullscreen}
              t={t}
              showControls={showControls}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              hideNotificationOnMobile={hideNotificationOnMobile}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

