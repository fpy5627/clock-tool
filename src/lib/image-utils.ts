/**
 * 图片处理工具函数
 * 
 * 提供图片压缩、缩放、亮度分析等功能
 */

/**
 * 判断颜色是否为浅色
 * 
 * @param color - 十六进制颜色值（如 '#ffffff'）
 * @returns 如果颜色为浅色返回 true，否则返回 false
 */
export const isLightColor = (color: string): boolean => {
  // 将十六进制颜色转换为RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // 使用感知亮度公式
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155; // 大于155认为是浅色
};

/**
 * 压缩和缩放图片
 * 
 * 将图片压缩并缩放到适合屏幕显示的尺寸，最大尺寸为屏幕的2倍（适配高清屏）
 * 
 * @param file - 要处理的图片文件
 * @returns Promise<string> - 返回压缩后的base64图片数据URL
 */
export const compressAndResizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 获取屏幕尺寸，设置最大宽高为屏幕的2倍（适配高清屏）
        const maxWidth = window.innerWidth * 2;
        const maxHeight = window.innerHeight * 2;
        
        let width = img.width;
        let height = img.height;
        
        // 计算缩放比例，保持宽高比
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // 创建canvas进行压缩
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'));
          return;
        }
        
        // 使用高质量缩放
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为base64，质量设置为0.9（90%质量）
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        reject(new Error('Image loading failed'));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('File reading failed'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * 分析图片亮度
 * 
 * 通过分析图片像素的平均亮度来判断图片是浅色还是深色
 * 
 * @param imageDataUrl - 图片的base64数据URL
 * @returns Promise<boolean> - 如果图片为浅色返回 true，否则返回 false
 */
export const analyzeImageBrightness = (imageDataUrl: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(false);
        return;
      }

      // 缩小图片以加快分析速度
      const size = 50;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      let totalBrightness = 0;

      // 计算所有像素的平均亮度
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        totalBrightness += brightness;
      }

      const avgBrightness = totalBrightness / (size * size);
      // 平均亮度大于128认为是浅色图片
      const isLight = avgBrightness > 128;
      resolve(isLight);
    };
    img.onerror = () => {
      resolve(false);
    };
    img.src = imageDataUrl;
  });
};

/**
 * 图片历史记录管理
 * 
 * 提供图片历史记录的添加、移除和获取功能
 */

const IMAGE_HISTORY_KEY = 'timer-uploaded-image-history';
const MAX_HISTORY_SIZE = 10;

/**
 * 添加上传图片到历史记录
 * 
 * @param imageDataUrl - 图片的base64数据URL
 * @returns 更新后的历史记录数组
 */
export const addToImageHistory = (imageDataUrl: string): string[] => {
  // 从localStorage读取现有历史记录
  const existingHistory = getImageHistory();
  
  // 如果图片已存在，先移除
  const filtered = existingHistory.filter(img => img !== imageDataUrl);
  
  // 添加到开头，限制最多保存10张图片
  const newHistory = [imageDataUrl, ...filtered].slice(0, MAX_HISTORY_SIZE);
  
  // 保存到localStorage
  localStorage.setItem(IMAGE_HISTORY_KEY, JSON.stringify(newHistory));
  
  return newHistory;
};

/**
 * 从历史记录中移除图片
 * 
 * @param imageDataUrl - 要移除的图片的base64数据URL
 * @returns 更新后的历史记录数组
 */
export const removeFromImageHistory = (imageDataUrl: string): string[] => {
  const existingHistory = getImageHistory();
  const newHistory = existingHistory.filter(img => img !== imageDataUrl);
  localStorage.setItem(IMAGE_HISTORY_KEY, JSON.stringify(newHistory));
  return newHistory;
};

/**
 * 获取图片历史记录
 * 
 * @returns 历史记录数组
 */
export const getImageHistory = (): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(IMAGE_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored) as string[];
    }
  } catch (error) {
    console.error('Failed to parse image history:', error);
  }
  
  return [];
};

