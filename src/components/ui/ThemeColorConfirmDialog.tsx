"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { THEME_COLORS } from '@/lib/clock-constants';
import { toast } from 'sonner';

/**
 * ThemeColorConfirmDialog 组件的 Props 接口
 */
export interface ThemeColorConfirmDialogProps {
  /** 是否显示对话框 */
  show: boolean;
  /** 待确认的主题颜色 ID */
  pendingThemeColor: string | null;
  /** 当前主题 ('dark' | 'light') */
  theme: string | undefined;
  /** 翻译函数 */
  t: (key: string, params?: Record<string, any>) => string;
  /** 页面模式 ('timer' | 'stopwatch' | 'alarm' | 'worldclock') */
  mode: string;
  /** 关闭对话框的函数 */
  onClose: () => void;
  /** 确认应用主题颜色到当前页面的函数 */
  onConfirm: (colorId: string) => void;
  /** 确认应用主题颜色到所有页面的函数 */
  onConfirmToAll: (colorId: string) => void;
}

/**
 * ThemeColorConfirmDialog 组件
 * 
 * 主题颜色应用确认对话框
 * 
 * @param props - 组件属性
 * @returns 主题颜色确认对话框 UI
 */
export default function ThemeColorConfirmDialog({
  show,
  pendingThemeColor,
  theme,
  t,
  mode,
  onClose,
  onConfirm,
  onConfirmToAll,
}: ThemeColorConfirmDialogProps) {
  if (!show || !pendingThemeColor) {
    return null;
  }

  // 查找待确认的主题颜色
  const selectedColor = THEME_COLORS.find(c => c.id === pendingThemeColor);
  if (!selectedColor) {
    return null;
  }

  /**
   * 处理应用到所有页面
   */
  const handleConfirmToAll = () => {
    onConfirmToAll(pendingThemeColor);
    onClose();
    const colorName = t(`colors.${selectedColor.key}`);
    toast.success(t('settings_panel.theme_color_applied', { colorName }));
  };

  /**
   * 处理应用到当前页面
   */
  const handleConfirmToCurrent = () => {
    onConfirm(pendingThemeColor);
    onClose();
    const colorName = t(`colors.${selectedColor.key}`);
    toast.success(t('settings_panel.theme_color_applied', { colorName }));
  };

  return (
    <AnimatePresence>
      {show && pendingThemeColor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${
              theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
            }`}
          >
            <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('settings_panel.apply_theme_color')}
            </h3>
            
            {/* 颜色预览 */}
            <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-gray-300"
                  style={{ backgroundColor: selectedColor.color }}
                />
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t(`colors.${selectedColor.key}`)}
                  </p>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                    {t('settings_panel.select_application_scope')}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 选项说明 */}
            <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <div className="flex items-start gap-2 mb-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'
                }`}>
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                    {t('settings_panel.all_pages')}
                  </p>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-blue-400/70' : 'text-blue-600/70'}`}>
                    {t('settings_panel.all_pages_use_this_background')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  theme === 'dark' ? 'bg-slate-600' : 'bg-gray-400'
                }`}>
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    {t('settings_panel.current_page_only')}
                  </p>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                    {t('settings_panel.only_this_page_uses_this_background', { pageName: t(`modes.${mode}`) })}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 按钮组 */}
            <div className="space-y-3">
              <button
                onClick={handleConfirmToAll}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {t('settings_panel.apply_to_all')}
              </button>
              <button
                onClick={handleConfirmToCurrent}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                {t('settings_panel.apply_to_current')}
              </button>
              <button
                onClick={onClose}
                className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
                }`}
              >
                {t('settings_panel.cancel')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

