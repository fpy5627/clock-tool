"use client";
import { FC, useEffect, useRef, useState } from "react";
import { notifySoundMetaList, NotifySoundMeta } from "@/lib/notify-sound";
import { useAppContext } from "@/contexts/app";

/**
 * 音效选择组件（带试听+使用量排序）
 * - 音效选项按usageCount降序排列
 * - 选中点击可试听
 * - 切换选项后全局context与使用量自动更新
 * - 使用localStorage同步音效使用量
 */
const USAGE_STAT_KEY = "notifySoundUsage"; // 本地存储音效用量

/**
 * 获取本地的使用量统计（key=音效id，value=计数）
 */
function loadUsageStat(): Record<string, number> {
  try {
    const t = localStorage.getItem(USAGE_STAT_KEY);
    if (!t) return {};
    return JSON.parse(t);
  } catch {
    return {};
  }
}

/**
 * 写回本地音效使用量数据
 */
function saveUsageStat(stats: Record<string, number>) {
  try {
    localStorage.setItem(USAGE_STAT_KEY, JSON.stringify(stats));
  } catch {}
}

/**
 * 音效选择UI组件
 * @returns 选择UI
 */
export const SoundSelector: FC = () => {
  // 全局context，持有音效ID及设置方法
  const { notifySoundId, setNotifySoundId } = useAppContext();

  // 音效meta合并本地计数后的排序表（状态）
  const [sortedList, setSortedList] = useState<NotifySoundMeta[]>(notifySoundMetaList);
  // 维护已播放音效实例，避免重叠（文件音频）
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  // WebAudio 上下文/关闭计时器引用，保证切换时能停止
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);

  // 本地用量，变动自动重排
  useEffect(() => {
    const localStat = loadUsageStat();
    const merged = [...notifySoundMetaList].map(item => ({
      ...item,
      usageCount: localStat[item.id] || 0,
    }));
    setSortedList(merged.sort((a,b) => b.usageCount - a.usageCount));
  }, [notifySoundId]);

  /**
   * 切换音效：更新通知音全局context，并记录使用量
   */
  const changeSound = (id: string) => {
    if (id === notifySoundId) return;
    setNotifySoundId && setNotifySoundId(id);
    // 统计使用量
    const stat = loadUsageStat();
    stat[id] = (stat[id] || 0) + 1;
    saveUsageStat(stat);
  };

  /**
   * 试听功能：播放选中音效
   */
  const playSound = (sound: NotifySoundMeta) => {
    // 如果是文件，走 <audio>
    if (sound.path) {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      // 支持外部URL：如果path以http://或https://开头，直接使用；否则添加/前缀
      const audioPath = sound.path.startsWith('http://') || sound.path.startsWith('https://') 
        ? sound.path 
        : `/${sound.path}`;
      const a = new Audio(audioPath);
      setAudio(a);
      a.play();
      return;
    }

    // 否则使用 WebAudio 合成
    try {
      // 若已有上下文，先关闭
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
        audioCtxRef.current = null;
      }
      if (stopTimeoutRef.current) {
        window.clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);

      const attack = 0.005;
      const release = 0.25;

      const mkBeep = (time: number, freq: number, type: OscillatorType = 'sine', duration = 0.15, gain = 0.8) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(gain, time + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, time + duration + release);
        osc.connect(g).connect(master);
        osc.start(time);
        osc.stop(time + duration + release + 0.05);
      };

      // 目标总时长（秒）
      const total = 10;
      const start = now;

      const every = (interval: number, fn: (t: number) => void) => {
        for (let t = 0; t < total; t += interval) {
          fn(start + t);
        }
      };

      switch (sound.synthType) {
        case 'bell': {
          // 每1.2秒一次叮当（主音+谐波）
          every(1.2, (t) => {
            mkBeep(t + 0.00, 1567, 'sine', 0.18, 0.9);
            mkBeep(t + 0.00, 3134, 'sine', 0.14, 0.5);
            mkBeep(t + 0.02, 2349, 'triangle', 0.12, 0.4);
          });
          break;
        }
        case 'chime': {
          // 每1.5秒一次双音柔和提示
          every(1.5, (t) => {
            mkBeep(t + 0.00, 880, 'triangle', 0.22, 0.7);
            mkBeep(t + 0.06, 1175, 'sine', 0.18, 0.5);
          });
          break;
        }
        case 'success': {
          // 每1.2秒一组三连上行动
          every(1.2, (t) => {
            mkBeep(t + 0.00, 659, 'sine', 0.12, 0.7);
            mkBeep(t + 0.12, 784, 'sine', 0.12, 0.7);
            mkBeep(t + 0.24, 987, 'sine', 0.16, 0.8);
          });
          break;
        }
        case 'subtle': {
          // 每0.8秒一次细微短音
          every(0.8, (t) => {
            mkBeep(t + 0.00, 740, 'sine', 0.09, 0.35);
          });
          break;
        }
        case 'reminder': {
          // 每1.0秒一次双音
          every(1.0, (t) => {
            mkBeep(t + 0.00, 740, 'sine', 0.12, 0.6);
            mkBeep(t + 0.18, 880, 'sine', 0.12, 0.6);
          });
          break;
        }
        case 'kitchen': {
          // 每0.5秒两下“滴答”
          every(0.5, (t) => {
            mkBeep(t + 0.00, 2000, 'square', 0.06, 0.5);
          });
          break;
        }
        case 'digital':
        default: {
          // 每1秒两下方波
          every(1.0, (t) => {
            mkBeep(t + 0.00, 1200, 'square', 0.1, 0.6);
            mkBeep(t + 0.12, 900, 'square', 0.08, 0.5);
          });
          break;
        }
      }

      // 到点自动关闭上下文
      stopTimeoutRef.current = window.setTimeout(() => {
        if (audioCtxRef.current) {
          try { audioCtxRef.current.close(); } catch {}
          audioCtxRef.current = null;
        }
        stopTimeoutRef.current = null;
      }, (total + 0.5) * 1000);
    } catch (e) {
      // 回退：若WebAudio失败，静默处理
      console.warn('WebAudio synth failed', e);
    }
  };

  // ========== UI部分 ==========
  // 采用简单button+弹窗，下步可替换shadcn UI ListBox/Popover增强体验
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      {/* 触发按钮 */}
      <button
        className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 border text-sm min-w-[120px]"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        选择提示音
      </button>
      {open && (
        <ul className="absolute z-10 mt-2 w-[240px] bg-white shadow-lg border rounded-lg p-2 max-h-[320px] overflow-y-auto" role="listbox">
          {sortedList.map(item => (
            <li
              key={item.id}
              className={`flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer justify-between ${notifySoundId === item.id ? "bg-blue-50 font-bold" : ""}`}
              onClick={() => changeSound(item.id)}
              aria-selected={notifySoundId === item.id}
              role="option"
            >
              <span>
                {item.name}
                <span className="ml-2 text-xs text-gray-400">({item.usageCount}次使用)</span>
              </span>
              <button
                tabIndex={-1}
                className="inline-block text-blue-500 text-xs px-1 border border-blue-100 rounded hover:bg-blue-100"
                title="试听该音效"
                onClick={e => { e.stopPropagation(); playSound(item); }}
              >
                试听
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SoundSelector;
