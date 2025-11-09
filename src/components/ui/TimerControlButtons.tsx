"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

/**
 * TimerControlButtons 组件的 Props 接口
 */
export interface TimerControlButtonsProps {
  /** 是否正在运行 */
  isRunning: boolean;
  /** 是否禁用（例如倒计时结束时） */
  disabled?: boolean;
  /** 切换运行状态的函数 */
  onToggle: () => void;
  /** 重置函数 */
  onReset: () => void;
  /** 打开设置函数 */
  onSettings?: () => void;
  /** 是否处于全屏模式 */
  isFullscreen: boolean;
  /** 是否显示控制按钮 */
  showControls: boolean;
  /** 翻译函数 */
  t: (key: string) => string;
  /** 鼠标进入事件处理函数 */
  onMouseEnter?: () => void;
  /** 鼠标离开事件处理函数 */
  onMouseLeave?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * TimerControlButtons 组件
 * 
 * 计时器控制按钮组件，包含：
 * - 开始/暂停按钮
 * - 重置按钮
 * - 设置按钮（可选）
 * 
 * @param isRunning - 是否正在运行
 * @param disabled - 是否禁用
 * @param onToggle - 切换运行状态的函数
 * @param onReset - 重置函数
 * @param onSettings - 打开设置函数
 * @param isFullscreen - 是否处于全屏模式
 * @param showControls - 是否显示控制按钮
 * @param t - 翻译函数
 * @param onMouseEnter - 鼠标进入事件处理函数
 * @param onMouseLeave - 鼠标离开事件处理函数
 * @param className - 自定义类名
 */
export default function TimerControlButtons({
  isRunning,
  disabled = false,
  onToggle,
  onReset,
  onSettings,
  isFullscreen,
  showControls,
  t,
  onMouseEnter,
  onMouseLeave,
  className = '',
}: TimerControlButtonsProps) {
  return (
    <AnimatePresence>
      {showControls && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className={`flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 relative z-10 ${
            isFullscreen 
              ? 'px-2 pb-8 sm:pb-12 md:pb-16 lg:pb-20 w-full' 
              : 'mt-6 sm:mt-8 md:mt-12'
          } ${className}`}
          style={isFullscreen ? {
            marginTop: 'auto'
          } : {}}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {/* 开始/暂停按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            disabled={disabled}
            className={`flex items-center gap-1 sm:gap-2 ${
              isFullscreen 
                ? 'px-4 py-2 sm:px-8 sm:py-4 md:px-10 md:py-5 lg:px-12 lg:py-6 text-sm sm:text-lg md:text-xl' 
                : 'px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base'
            } rounded-[10px] font-semibold text-white shadow-lg transition-all ${
              disabled
                ? 'bg-slate-700 cursor-not-allowed'
                : isRunning
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className={
                  isFullscreen 
                    ? 'w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7' 
                    : 'w-4 h-4 sm:w-5 sm:h-5'
                } />
                <span>{t('buttons.pause')}</span>
              </>
            ) : (
              <>
                <Play className={
                  isFullscreen 
                    ? 'w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7' 
                    : 'w-4 h-4 sm:w-5 sm:h-5'
                } />
                <span>{t('buttons.start')}</span>
              </>
            )}
          </motion.button>

          {/* 重置按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className={`flex items-center gap-1 sm:gap-2 ${
              isFullscreen 
                ? 'px-4 py-2 sm:px-8 sm:py-4 md:px-10 md:py-5 lg:px-12 lg:py-6 text-sm sm:text-lg md:text-xl' 
                : 'px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base'
            } bg-slate-700 hover:bg-slate-600 text-white rounded-[8px] font-semibold shadow-lg transition-all`}
          >
            <RotateCcw className={
              isFullscreen 
                ? 'w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7' 
                : 'w-4 h-4 sm:w-5 sm:h-5'
            } />
            <span>{t('buttons.reset')}</span>
          </motion.button>

          {/* 设置按钮（可选） */}
          {onSettings && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSettings}
              className={`flex items-center gap-1 sm:gap-2 ${
                isFullscreen 
                  ? 'px-4 py-2 sm:px-8 sm:py-4 md:px-10 md:py-5 lg:px-12 lg:py-6 text-sm sm:text-lg md:text-xl' 
                  : 'px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base'
              } bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] font-semibold shadow-lg transition-all`}
            >
              <Settings className={
                isFullscreen 
                  ? 'w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7' 
                  : 'w-4 h-4 sm:w-5 sm:h-5'
              } />
              <span>{t('buttons.settings')}</span>
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

