"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Timer, Clock, AlarmClock, Globe, LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  path: string;
  labelKey: string;
  icon: LucideIcon;
}

interface VerticalSidebarProps {
  /** 当前模式（timer、countdown、stopwatch、alarm、worldclock） */
  currentMode: 'timer' | 'countdown' | 'stopwatch' | 'alarm' | 'worldclock' | 'world-clock';
  /** 是否处于全屏模式 */
  isFullscreen?: boolean;
  /** 是否显示控制按钮 */
  showControls?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 是否检查全屏状态并保存到sessionStorage */
  checkFullscreen?: boolean;
  /** 鼠标进入事件处理器 */
  onMouseEnter?: () => void;
  /** 鼠标离开事件处理器 */
  onMouseLeave?: () => void;
}

/**
 * 垂直侧边栏组件
 * 用于在页面左侧显示垂直导航按钮（Timer、Stopwatch、Alarm、World Clock）
 * 
 * @param currentMode - 当前模式（timer、stopwatch、alarm、worldclock）
 * @param isFullscreen - 是否处于全屏模式
 * @param showControls - 是否显示控制按钮
 * @param className - 自定义样式类名
 * @param checkFullscreen - 是否检查全屏状态并保存到sessionStorage
 */
export default function VerticalSidebar({
  currentMode,
  isFullscreen = false,
  showControls = true,
  className = '',
  checkFullscreen = true,
  onMouseEnter,
  onMouseLeave,
}: VerticalSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { theme } = useTheme();
  const t = useTranslations('clock');

  /**
   * 导航到指定页面
   * 如果当前处于全屏模式，保存状态到sessionStorage以便在新页面自动进入全屏
   * @param page - 目标页面路径（不包含locale前缀）
   */
  const navigateToPage = (page: string) => {
    const currentLocale = locale || 'en';
    const targetPath = `/${currentLocale}/${page}`;
    if (pathname !== targetPath) {
      // 检查当前是否处于全屏模式
      if (checkFullscreen && typeof window !== 'undefined') {
        const isCurrentlyFullscreen = !!(
          document.fullscreenElement || 
          (document as any).webkitFullscreenElement || 
          (document as any).mozFullScreenElement || 
          (document as any).msFullscreenElement
        ) || isFullscreen; // 也检查本地状态（用于模拟全屏）
        
        // 如果处于全屏模式，保存状态到sessionStorage
        if (isCurrentlyFullscreen) {
          sessionStorage.setItem('shouldEnterFullscreen', 'true');
        }
      }
      
      router.push(targetPath);
    }
  };

  const navItems: NavItem[] = [
    { id: 'countdown', path: 'countdown', labelKey: 'modes.timer', icon: Timer },
    { id: 'stopwatch', path: 'stopwatch', labelKey: 'modes.stopwatch', icon: Clock },
    { id: 'alarm', path: 'alarm', labelKey: 'modes.alarm', icon: AlarmClock },
    { id: 'world-clock', path: 'world-clock', labelKey: 'modes.worldclock', icon: Globe },
  ];

  // 根据是否全屏决定样式
  const containerClassName = isFullscreen
    ? "fixed top-1 sm:top-6 left-1 sm:left-6 flex gap-0.5 sm:gap-3 z-50 flex-wrap max-w-[70%] sm:max-w-none"
    : "hidden sm:flex fixed top-20 sm:top-24 left-2 sm:left-4 gap-0.5 sm:gap-2 flex-wrap max-w-[50%] sm:max-w-none z-40";

  const buttonClassName = isFullscreen
    ? "p-1.5 sm:p-4 rounded-md sm:rounded-xl transition-all backdrop-blur-md shadow-2xl"
    : "p-1.5 sm:p-2.5 rounded-md sm:rounded-lg transition-colors";

  if (!showControls) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`${containerClassName} ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {navItems.map((item) => {
        const isActive = 
          (item.id === 'countdown' && (currentMode === 'timer' || currentMode === 'countdown')) ||
          (item.id === 'stopwatch' && currentMode === 'stopwatch') ||
          (item.id === 'alarm' && currentMode === 'alarm') ||
          (item.id === 'world-clock' && (currentMode === 'worldclock' || currentMode === 'world-clock'));
        
        const Icon = item.icon;
        
        return (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateToPage(item.path)}
            className={`${buttonClassName} ${
              isActive
                ? isFullscreen
                  ? 'bg-blue-500 text-white shadow-blue-500/50'
                  : 'bg-blue-500 text-white'
                : isFullscreen
                ? 'bg-black/40 hover:bg-black/60 text-white border border-white/20'
                : theme === 'dark'
                ? 'bg-white/10 hover:bg-white/20 text-white/60'
                : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300'
            }`}
            title={t(item.labelKey as any)}
            aria-label={t(item.labelKey as any)}
          >
            <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${isFullscreen ? 'sm:w-7 sm:h-7' : ''}`} />
          </motion.button>
        );
      })}
    </motion.div>
  );
}

