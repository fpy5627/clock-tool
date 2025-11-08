import { useState } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { addToImageHistory, removeFromImageHistory } from '@/lib/image-utils';

/**
 * 时钟页面处理函数Hook的配置选项
 */
export interface UseClockPageHandlersOptions {
  /** 当前模式（用于区分不同页面的设置） */
  mode: 'timer' | 'stopwatch' | 'alarm' | 'worldclock';
  /** 背景相关的状态设置函数 */
  setBackgroundType: (type: 'default' | 'color' | 'image') => void;
  /** 设置背景图片 */
  setBackgroundImage: (image: string) => void;
  /** 设置是否应用到所有页面 */
  setApplyToAllPages: (apply: boolean) => void;
  /** 设置用户是否手动设置了主题 */
  setUserManuallySetTheme: (manual: boolean) => void;
}

/**
 * useClockPageHandlers Hook
 * 
 * 提供时钟页面公共的处理函数
 * 包括主题切换、图片历史记录管理等
 * 
 * @param options - 配置选项
 * @returns 返回处理函数和图片历史记录状态
 */
export const useClockPageHandlers = (options: UseClockPageHandlersOptions) => {
  const { mode, setBackgroundType, setBackgroundImage, setApplyToAllPages, setUserManuallySetTheme } = options;
  const { theme, setTheme } = useTheme();
  const t = useTranslations('clock');
  
  /** 上传图片历史记录 */
  const [uploadedImageHistory, setUploadedImageHistory] = useState<string[]>([]);

  /**
   * 添加上传图片到历史记录
   * 
   * @param imageDataUrl - 图片的 Data URL
   */
  const handleAddToImageHistory = (imageDataUrl: string) => {
    const newHistory = addToImageHistory(imageDataUrl);
    setUploadedImageHistory(newHistory);
  };

  /**
   * 从历史记录中移除图片
   * 
   * @param imageDataUrl - 要移除的图片的 Data URL
   */
  const handleRemoveFromImageHistory = (imageDataUrl: string) => {
    const newHistory = removeFromImageHistory(imageDataUrl);
    setUploadedImageHistory(newHistory);
  };

  /**
   * 处理主题切换
   * 根据切换的主题执行相应的逻辑，包括重置背景、保存设置等
   */
  const handleThemeToggle = () => {
    // 使用 next-themes 的 setTheme
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    console.log('手动切换主题:', theme, '->', newTheme);
    
    // 如果切换到夜晚模式，重置所有功能页面到默认状态
    if (newTheme === 'dark') {
      console.log('切换到夜晚模式，重置所有功能页面到默认状态');
      const allModes = ['timer', 'stopwatch', 'alarm', 'worldclock'];
      
      // 清除所有功能页面的自定义背景图片
      allModes.forEach(modeKey => {
        localStorage.removeItem(`timer-background-image-${modeKey}`);
        localStorage.removeItem(`timer-manual-theme-${modeKey}`);
        console.log(`Clearing custom settings for ${modeKey} page`);
      });
      
      // 清除通用背景图片设置
      localStorage.removeItem('timer-background-image');
      
      // 重置背景类型为默认
      setBackgroundType('default');
      setBackgroundImage('');
      setApplyToAllPages(true);
      
      // 清除手动主题设置标志
      setUserManuallySetTheme(false);
      
      toast.success(t('settings_panel.reset_all_pages'));
    } else {
      // 切换到白天模式，保持现有逻辑
      // 标记用户手动设置了主题
      setUserManuallySetTheme(true);
      localStorage.setItem(`timer-manual-theme-${mode}`, newTheme);
      
      // 检查当前页面是否有专用背景图片
      const currentModeBackgroundImage = localStorage.getItem(`timer-background-image-${mode}`);
      const generalBackgroundImage = localStorage.getItem('timer-background-image');
      
      // 如果当前页面有专用背景图片，需要确保其他页面保持正确的默认背景
      if (currentModeBackgroundImage && !generalBackgroundImage) {
        console.log('当前页面有专用背景图片，确保其他页面保持默认背景');
        const allModes = ['timer', 'stopwatch', 'alarm', 'worldclock'];
        
        // 为其他页面设置与当前主题匹配的默认背景
        allModes.forEach(modeKey => {
          if (modeKey !== mode) {
            const defaultBackgroundColor = newTheme === 'light' ? '#f8fafc' : '#1e293b';
            localStorage.setItem(`timer-background-color-${modeKey}`, defaultBackgroundColor);
            console.log(`Setting default background for ${modeKey} page:`, defaultBackgroundColor);
          }
        });
      }
    }
    
    setTheme(newTheme);
  };

  return {
    /** 上传图片历史记录 */
    uploadedImageHistory,
    /** 设置上传图片历史记录 */
    setUploadedImageHistory,
    /** 添加上传图片到历史记录 */
    handleAddToImageHistory,
    /** 从历史记录中移除图片 */
    handleRemoveFromImageHistory,
    /** 处理主题切换 */
    handleThemeToggle,
  };
};

