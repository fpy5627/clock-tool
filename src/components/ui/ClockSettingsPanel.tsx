"use client";

/**
 * 注意：这是一个基础版本的设置面板组件。
 * 由于设置面板代码非常长（1000+行），这里先创建基础结构。
 * 完整的设置面板功能需要根据各个页面的具体需求进行完善。
 * 
 * 建议：将设置面板的代码从各个页面中提取出来，逐步完善这个组件。
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * ClockSettingsPanel 组件的 Props 接口
 */
export interface ClockSettingsPanelProps {
  /** 是否显示设置面板 */
  showSettingsPanel: boolean;
  /** 是否处于全屏模式 */
  isFullscreen: boolean;
  /** 关闭设置面板的函数 */
  onClose: () => void;
  /** 当前主题 ('dark' | 'light') */
  theme: string | undefined;
  /** 翻译函数 */
  t: (key: string, params?: Record<string, any>) => string;
  /** 页面模式 ('timer' | 'stopwatch' | 'alarm' | 'worldclock') */
  mode: string;
  /** 子组件内容 */
  children?: React.ReactNode;
}

/**
 * ClockSettingsPanel 组件
 * 
 * 时钟工具页面的设置面板组件，包含：
 * - 主题颜色选择
 * - 通知音效选择
 * - 背景自定义（颜色/图片）
 * - 显示控制开关
 * 
 * 根据选项不同，决定配置的项是应用当前页面还是所有页面。
 * 
 * @param props - 组件属性
 * @returns 设置面板 UI
 */
export default function ClockSettingsPanel({
  showSettingsPanel,
  isFullscreen,
  onClose,
  theme,
  t,
  mode,
  children,
}: ClockSettingsPanelProps) {
  if (!showSettingsPanel || isFullscreen) {
    return null;
  }

  return (
    <AnimatePresence>
      {showSettingsPanel && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed right-4 top-20 bottom-4 z-40 w-80 flex flex-col"
        >
          <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} border rounded-2xl shadow-2xl flex flex-col max-h-full overflow-hidden`}>
            {/* 固定头部 */}
            <div className="flex-shrink-0 flex justify-between items-center p-6 pb-4 border-b" style={{ borderColor: theme === 'dark' ? '#334155' : '#e5e7eb' }}>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{t('settings_panel.title')}</h3>
              <button
                onClick={onClose}
                className={`p-2 ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
              >
                <X className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* 可滚动内容区域 */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pt-4 settings-scrollbar" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: theme === 'dark' ? '#475569 #1e293b' : '#d1d5db #f1f5f9'
            }}>
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

