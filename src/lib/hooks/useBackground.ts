import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { isLightColor, analyzeImageBrightness } from '@/lib/image-utils';

/**
 * 背景类型
 */
export type BackgroundType = 'default' | 'color' | 'image';

/**
 * 背景管理Hook的配置选项
 */
export interface UseBackgroundOptions {
  /** 当前模式（用于区分不同页面的背景设置） */
  mode: string;
  /** 默认背景颜色 */
  defaultBackgroundColor?: string;
}

/**
 * useBackground Hook
 * 
 * 管理背景类型、颜色、图片等设置
 * 支持按页面模式分别保存背景设置
 * 自动根据背景颜色/图片亮度切换主题
 * 
 * @param options - 配置选项
 * @returns 返回背景状态和控制函数
 */
export const useBackground = (options: UseBackgroundOptions) => {
  const { mode, defaultBackgroundColor = '#1e293b' } = options;
  const { theme, setTheme } = useTheme();
  
  /** 背景类型 */
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('default');
  /** 背景颜色 */
  const [backgroundColor, setBackgroundColor] = useState(defaultBackgroundColor);
  /** 背景图片 */
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  /** 图片遮罩不透明度（0-100，数值越大遮罩越重） */
  const [imageOverlayOpacity, setImageOverlayOpacity] = useState(40);
  /** 图片水平位置 (0-100) */
  const [imagePositionX, setImagePositionX] = useState(50);
  /** 图片垂直位置 (0-100) */
  const [imagePositionY, setImagePositionY] = useState(50);
  
  /** 背景确认对话框状态 */
  const [showBackgroundConfirm, setShowBackgroundConfirm] = useState(false);
  const [pendingBackgroundImage, setPendingBackgroundImage] = useState<string>('');
  const [applyToAllPages, setApplyToAllPages] = useState(true);
  
  /** 纯色背景确认对话框状态 */
  const [showColorBackgroundConfirm, setShowColorBackgroundConfirm] = useState(false);
  const [pendingBackgroundColor, setPendingBackgroundColor] = useState<string>('');
  const [applyColorToAllPages, setApplyColorToAllPages] = useState(true);
  
  /** 防止状态检测逻辑干扰的标志 */
  const [isSettingFromHistory, setIsSettingFromHistory] = useState(false);
  /** 跟踪上一次的背景颜色 */
  const lastBackgroundColorRef = useRef<string>('');
  /** 跟踪用户是否刚刚手动切换了主题 */
  const userInitiatedThemeChangeRef = useRef(false);

  /**
   * 从localStorage加载背景设置
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 加载背景类型
    const savedBackgroundType = localStorage.getItem('timer-background-type');
    if (savedBackgroundType) {
      setBackgroundType(savedBackgroundType as BackgroundType);
    }

    // 优先加载当前功能页面的背景颜色，如果没有则加载通用背景颜色
    const currentModeBackgroundColor = localStorage.getItem(`timer-background-color-${mode}`);
    const generalBackgroundColor = localStorage.getItem('timer-background-color');
    
    let savedBackgroundColor;
    if (currentModeBackgroundColor) {
      savedBackgroundColor = currentModeBackgroundColor;
    } else if (generalBackgroundColor) {
      savedBackgroundColor = generalBackgroundColor;
    } else {
      savedBackgroundColor = defaultBackgroundColor;
    }
    if (savedBackgroundColor) {
      setBackgroundColor(savedBackgroundColor);
    }

    // 优先加载当前功能页面的背景图片，如果没有则加载通用背景图片
    const currentModeBackgroundImage = localStorage.getItem(`timer-background-image-${mode}`);
    const generalBackgroundImage = localStorage.getItem('timer-background-image');
    
    let savedBackgroundImage;
    if (currentModeBackgroundImage) {
      savedBackgroundImage = currentModeBackgroundImage;
    } else if (generalBackgroundImage) {
      savedBackgroundImage = generalBackgroundImage;
    } else {
      savedBackgroundImage = '';
    }
    if (savedBackgroundImage) {
      setBackgroundImage(savedBackgroundImage);
    }

    // 加载图片位置设置
    const savedImagePositionX = localStorage.getItem('timer-image-position-x');
    const savedImagePositionY = localStorage.getItem('timer-image-position-y');
    if (savedImagePositionX) setImagePositionX(Number(savedImagePositionX));
    if (savedImagePositionY) setImagePositionY(Number(savedImagePositionY));
  }, [mode, defaultBackgroundColor]);

  /**
   * 保存背景设置到localStorage
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem('timer-background-type', backgroundType);

    // 根据应用范围保存背景颜色
    if (applyColorToAllPages) {
      localStorage.setItem('timer-background-color', backgroundColor);
    } else {
      localStorage.setItem(`timer-background-color-${mode}`, backgroundColor);
    }

    // 根据应用范围保存背景图片
    if (applyToAllPages) {
      localStorage.setItem('timer-background-image', backgroundImage);
    } else {
      localStorage.setItem(`timer-background-image-${mode}`, backgroundImage);
    }

    localStorage.setItem('timer-image-position-x', String(imagePositionX));
    localStorage.setItem('timer-image-position-y', String(imagePositionY));
  }, [backgroundType, backgroundColor, backgroundImage, applyToAllPages, applyColorToAllPages, imagePositionX, imagePositionY, mode]);

  /**
   * 监听背景颜色变化，自动切换主题
   */
  useEffect(() => {
    // 只有在背景颜色真正改变且是颜色模式时才处理
    if (backgroundType === 'color' && backgroundColor && backgroundColor !== lastBackgroundColorRef.current) {
      lastBackgroundColorRef.current = backgroundColor;
      
      const isLight = isLightColor(backgroundColor);
      
      // 浅色背景：使用白天模式（light theme）
      // 深色背景：使用夜晚模式（dark theme）
      const targetTheme = isLight ? 'light' : 'dark';
      
      // 使用 setTimeout 延迟切换，避免状态更新冲突
      const timer = setTimeout(() => {
        setTheme(targetTheme);
      }, 0);
      
      return () => clearTimeout(timer);
    }
    
    // 当切换回默认背景时，重置追踪
    if (backgroundType === 'default') {
      lastBackgroundColorRef.current = '';
    }
  }, [backgroundColor, backgroundType, setTheme]);

  /**
   * 监听背景图片变化，自动切换主题
   */
  useEffect(() => {
    if (backgroundType === 'image' && backgroundImage) {
      analyzeImageBrightness(backgroundImage).then((isLight) => {
        const targetTheme = isLight ? 'light' : 'dark';
        setTheme(targetTheme);
      });
    }
  }, [backgroundImage, backgroundType, setTheme]);

  /**
   * 当用户通过其他方式设置背景时，重置为应用到所有页面
   */
  useEffect(() => {
    if (backgroundType !== 'image' || backgroundImage === '') {
      setApplyToAllPages(true);
    }
    if (backgroundType !== 'color') {
      setApplyColorToAllPages(true);
    }
  }, [backgroundType, backgroundImage]);

  /**
   * 检测当前背景的应用状态
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && !isSettingFromHistory) {
      // 检测纯色背景的应用状态
      if (backgroundType === 'color' && backgroundColor) {
        const currentModeBackgroundColor = localStorage.getItem(`timer-background-color-${mode}`);
        const generalBackgroundColor = localStorage.getItem('timer-background-color');
        
        // 如果当前模式有专用背景且与当前背景相同，说明是仅应用到当前页面
        if (currentModeBackgroundColor === backgroundColor && currentModeBackgroundColor !== generalBackgroundColor) {
          setApplyColorToAllPages(false);
        } else {
          setApplyColorToAllPages(true);
        }
      }
    }
    
    // 重置标志
    if (isSettingFromHistory) {
      setIsSettingFromHistory(false);
    }
  }, [mode, backgroundType, backgroundColor, isSettingFromHistory]);

  return {
    // 状态
    backgroundType,
    backgroundColor,
    backgroundImage,
    imageOverlayOpacity,
    imagePositionX,
    imagePositionY,
    showBackgroundConfirm,
    pendingBackgroundImage,
    applyToAllPages,
    showColorBackgroundConfirm,
    pendingBackgroundColor,
    applyColorToAllPages,
    isSettingFromHistory,
    
    // 设置函数
    setBackgroundType,
    setBackgroundColor,
    setBackgroundImage,
    setImageOverlayOpacity,
    setImagePositionX,
    setImagePositionY,
    setShowBackgroundConfirm,
    setPendingBackgroundImage,
    setApplyToAllPages,
    setShowColorBackgroundConfirm,
    setPendingBackgroundColor,
    setApplyColorToAllPages,
    setIsSettingFromHistory,
  };
};

