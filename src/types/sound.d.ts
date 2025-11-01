/**
 * 声音选项类型定义
 */
export interface SoundOption {
  /** 声音唯一标识符 */
  id: string;
  /** 声音键值 */
  key: string;
  /** 中文名称 */
  name: string;
  /** 英文名称 */
  nameEn: string;
  /** 中文描述 */
  description: string;
  /** 英文描述 */
  descriptionEn: string;
  /** 声音类型 */
  type: string;
  /** 声音模式 */
  mode: string;
  /** 人气值（用于排序） */
  popularity: number;
  /** 频率（某些简单实现可能需要） */
  frequency?: number;
}

