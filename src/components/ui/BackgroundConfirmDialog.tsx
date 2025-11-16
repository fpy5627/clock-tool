"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { analyzeImageBrightness, isLightColor } from '@/lib/image-utils';
import { toast } from 'sonner';

/**
 * BackgroundConfirmDialog 组件的 Props 接口
 */
export interface BackgroundConfirmDialogProps {
  /** 是否显示对话框 */
  show: boolean;
  /** 待确认的背景图片（用于图片背景） */
  pendingBackgroundImage?: string;
  /** 待确认的背景颜色（用于纯色背景） */
  pendingBackgroundColor?: string;
  /** 当前主题 ('dark' | 'light') */
  theme: string | undefined;
  /** 翻译函数 */
  t: (key: string, params?: Record<string, any>) => string;
  /** 页面模式 ('timer' | 'stopwatch' | 'alarm' | 'worldclock') */
  mode: string;
  /** 关闭对话框的函数 */
  onClose: () => void;
  /** 设置背景图片的函数 */
  setBackgroundImage: (image: string) => void;
  /** 设置背景颜色的函数 */
  setBackgroundColor: (color: string) => void;
  /** 设置应用到所有页面的函数 */
  setApplyToAllPages: (apply: boolean) => void;
  /** 设置应用到所有页面的函数（颜色） */
  setApplyColorToAllPages: (apply: boolean) => void;
  /** 设置主题的函数 */
  setTheme: (theme: 'light' | 'dark') => void;
}

/**
 * BackgroundConfirmDialog 组件
 * 
 * 背景应用确认对话框，支持图片背景和纯色背景两种类型
 * 
 * @param props - 组件属性
 * @returns 背景确认对话框 UI
 */
export default function BackgroundConfirmDialog({
  show,
  pendingBackgroundImage,
  pendingBackgroundColor,
  theme,
  t,
  mode,
  onClose,
  setBackgroundImage,
  setBackgroundColor,
  setApplyToAllPages,
  setApplyColorToAllPages,
  setTheme,
}: BackgroundConfirmDialogProps) {
  // 如果是图片背景确认
  const isImageBackground = !!pendingBackgroundImage;
  
  // 如果都不显示，返回 null
  if (!show || (!pendingBackgroundImage && !pendingBackgroundColor)) {
    return null;
  }

  /**
   * 处理应用到所有页面（图片背景）
   */
  const handleApplyImageToAll = async () => {
    if (!pendingBackgroundImage) return;
    
    console.log('User selected "Apply to all pages"');
    setApplyToAllPages(true);
    setBackgroundImage(pendingBackgroundImage);
    
    // 保存到localStorage
    localStorage.setItem('timer-background-image', pendingBackgroundImage);
    
    // 分析图片亮度并自动设置主题
    const isLight = await analyzeImageBrightness(pendingBackgroundImage);
    setTimeout(() => {
      if (isLight) {
        if (theme !== 'light') setTheme('light');
      } else {
        if (theme !== 'dark') setTheme('dark');
      }
    }, 0);
    
    onClose();
    toast.success(t('settings_panel.background_applied_all'));
  };

  /**
   * 处理应用到当前页面（图片背景）
   */
  const handleApplyImageToCurrent = async () => {
    if (!pendingBackgroundImage) return;
    
    console.log('User selected "Apply to current page only"');
    setApplyToAllPages(false);
    setBackgroundImage(pendingBackgroundImage);
    
    // 清除其他功能页面的背景设置
    const allModes = ['timer', 'stopwatch', 'alarm', 'worldclock'];
    allModes.forEach(modeKey => {
      if (modeKey !== mode) {
        localStorage.removeItem(`timer-background-image-${modeKey}`);
      }
    });
    
    // 清除通用背景设置
    localStorage.removeItem('timer-background-image');
    
    // 分析图片亮度并自动设置主题和其他页面的默认背景
    const isLight = await analyzeImageBrightness(pendingBackgroundImage);
    setTimeout(() => {
      if (isLight) {
        // 浅色图片：设置为白天模式，其他页面使用浅色默认背景
        if (theme !== 'light') setTheme('light');
        // 为其他页面设置浅色默认背景
        allModes.forEach(modeKey => {
          if (modeKey !== mode) {
            localStorage.setItem(`timer-background-color-${modeKey}`, '#f8fafc'); // 浅色默认背景
          }
        });
      } else {
        // 深色图片：设置为夜间模式，其他页面使用深色默认背景
        if (theme !== 'dark') setTheme('dark');
        // 为其他页面设置深色默认背景
        allModes.forEach(modeKey => {
          if (modeKey !== mode) {
            localStorage.setItem(`timer-background-color-${modeKey}`, '#1e293b'); // 深色默认背景
          }
        });
      }
    }, 0);
    
    onClose();
    const pageName = t(`modes.${mode}`);
    toast.success(t('settings_panel.background_applied_to_page', { pageName }));
  };

  /**
   * 处理应用到所有页面（纯色背景）
   */
  const handleApplyColorToAll = async () => {
    if (!pendingBackgroundColor) return;
    
    console.log('用户选择了"应用到所有功能页面"');
    setApplyColorToAllPages(true);
    setBackgroundColor(pendingBackgroundColor);
    
    // 保存到通用 localStorage
    localStorage.setItem('timer-background-color', pendingBackgroundColor);
    
    // 清除各个功能页面的专用背景设置
    const allModes = ['timer', 'stopwatch', 'alarm', 'worldclock'];
    allModes.forEach(modeKey => {
      localStorage.removeItem(`timer-background-color-${modeKey}`);
    });
    
    // 分析颜色亮度并自动设置主题
    const isLight = isLightColor(pendingBackgroundColor);
    setTimeout(() => {
      if (isLight) {
        if (theme !== 'light') setTheme('light');
      } else {
        if (theme !== 'dark') setTheme('dark');
      }
    }, 0);
    
    onClose();
    toast.success(t('settings_panel.background_applied_all'));
  };

  /**
   * 处理应用到当前页面（纯色背景）
   */
  const handleApplyColorToCurrent = async () => {
    if (!pendingBackgroundColor) return;
    
    console.log('用户选择了"仅应用到当前功能页面"');
    setApplyColorToAllPages(false);
    setBackgroundColor(pendingBackgroundColor);
    
    // 保存当前页面的背景颜色到 localStorage
    localStorage.setItem(`timer-background-color-${mode}`, pendingBackgroundColor);
    
    // 清除其他功能页面的背景设置
    const allModes = ['timer', 'stopwatch', 'alarm', 'worldclock'];
    allModes.forEach(modeKey => {
      if (modeKey !== mode) {
        localStorage.removeItem(`timer-background-color-${modeKey}`);
      }
    });
    
    // 清除通用背景设置
    localStorage.removeItem('timer-background-color');
    
    // 分析颜色亮度并自动设置主题和其他页面的默认背景
    const isLight = isLightColor(pendingBackgroundColor);
    setTimeout(() => {
      if (isLight) {
        // 浅色背景：设置为白天模式，其他页面使用浅色默认背景
        if (theme !== 'light') setTheme('light');
        // 为其他页面设置浅色默认背景
        allModes.forEach(modeKey => {
          if (modeKey !== mode) {
            localStorage.setItem(`timer-background-color-${modeKey}`, '#f8fafc'); // 浅色默认背景
          }
        });
      } else {
        // 深色背景：设置为夜间模式，其他页面使用深色默认背景
        if (theme !== 'dark') setTheme('dark');
        // 为其他页面设置深色默认背景
        allModes.forEach(modeKey => {
          if (modeKey !== mode) {
            localStorage.setItem(`timer-background-color-${modeKey}`, '#1e293b'); // 深色默认背景
          }
        });
      }
    }, 0);
    
    onClose();
    const pageName = t(`modes.${mode}`);
    toast.success(t('settings_panel.background_applied_to_page', { pageName }));
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
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
              {isImageBackground ? '应用背景图片' : t('settings_panel.apply_solid_color_background')}
            </h3>
            
            {/* 预览区域 */}
            <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
              {isImageBackground ? (
                <>
                  <img
                    src={pendingBackgroundImage}
                    alt="Background preview"
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                    选择应用范围：
                  </p>
                </>
              ) : (
                <>
                  <div 
                    className="w-full h-20 rounded-lg mb-3 border-2 border-gray-300"
                    style={{ backgroundColor: pendingBackgroundColor }}
                  />
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                    {t('settings_panel.select_application_scope')}
                  </p>
                </>
              )}
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
                    {isImageBackground ? '所有页面' : t('settings_panel.all_functional_pages')}
                  </p>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-blue-400/70' : 'text-blue-600/70'}`}>
                    {isImageBackground 
                      ? '计时器、秒表、闹钟、世界时间都使用此背景'
                      : t('settings_panel.all_pages_use_this_background')
                    }
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
                    {isImageBackground ? '仅当前页面' : t('settings_panel.current_functional_page_only')}
                  </p>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                    {isImageBackground
                      ? `只在${mode === 'timer' ? '计时器' : mode === 'stopwatch' ? '秒表' : mode === 'alarm' ? '闹钟' : '世界时间'}页面使用此背景`
                      : t('settings_panel.only_this_page_uses_this_background', { pageName: t(`modes.${mode}`) })
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {/* 按钮组 */}
            <div className="space-y-3">
              <button
                onClick={isImageBackground ? handleApplyImageToAll : handleApplyColorToAll}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {t('settings_panel.apply_to_all')}
              </button>
              <button
                onClick={isImageBackground ? handleApplyImageToCurrent : handleApplyColorToCurrent}
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

