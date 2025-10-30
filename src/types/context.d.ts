import { ReactNode } from "react";

/**
 * 全局Context扩展：增加通知/计时器的提示音ID字段，以及设置方法。
 * notifySoundId: 当前全局选中的通知音唯一ID（与notify-sound.ts保持一致）
 * setNotifySoundId: 变更提示音的setState
 */
export interface ContextValue {
  [propName: string]: any;
  /** 当前全局选中的通知音唯一ID，默认可为 'pop-cc0' 等 */
  notifySoundId?: string;
  /** 设置当前通知音的方法 */
  setNotifySoundId?: (id: string) => void;
}
