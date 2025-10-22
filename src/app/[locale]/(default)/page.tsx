"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Maximize, Volume2, VolumeX, Edit3, X } from 'lucide-react';

// 预设时间选项
const PRESET_TIMES = [
  { label: '1分钟', seconds: 60 },
  { label: '3分钟', seconds: 180 },
  { label: '5分钟', seconds: 300 },
  { label: '10分钟', seconds: 600 },
  { label: '15分钟', seconds: 900 },
  { label: '25分钟', seconds: 1500 },
  { label: '30分钟', seconds: 1800 },
  { label: '45分钟', seconds: 2700 },
  { label: '1小时', seconds: 3600 },
];

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState(300); // Default 5 minutes
  const [initialTime, setInitialTime] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (soundEnabled) {
              playNotificationSound();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, soundEnabled]);

  // 全屏功能
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 鼠标移动显示控制按钮
  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true);
      return;
    }

    const handleMouseMove = () => {
      setShowControls(true);
      
      // 清除之前的定时器
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      
      // 3秒后隐藏控制按钮
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1500);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // 初始显示控制按钮
    handleMouseMove();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isFullscreen]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch (error) {
      console.log('Audio notification not available');
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(initialTime);
  };

  const setPresetTime = (seconds: number) => {
    setIsRunning(false);
    setInitialTime(seconds);
    setTimeLeft(seconds);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        console.log('Fullscreen not available');
      }
    } else {
      await document.exitFullscreen();
    }
  };

  const applyCustomTime = () => {
    const totalSeconds = customMinutes * 60 + customSeconds;
    if (totalSeconds > 0) {
      setIsRunning(false);
      setInitialTime(totalSeconds);
      setTimeLeft(totalSeconds);
      setShowEditModal(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div 
      className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-black flex flex-col ${isFullscreen ? 'p-0' : 'p-4'}`}
      style={{ cursor: isFullscreen && !showControls ? 'none' : 'default' }}
    >
      {/* 主计时器区域 */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* 顶部工具栏 - 只在非全屏显示 */}
        {!isFullscreen && (
          <div className="absolute top-4 right-4 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEditModal(true)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="编辑时间"
            >
              <Edit3 className="w-5 h-5 text-white" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title={soundEnabled ? '关闭声音' : '开启声音'}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-white" />
              ) : (
                <VolumeX className="w-5 h-5 text-white" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="全屏模式"
            >
              <Maximize className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        )}

        {/* 全屏模式下的浮动工具栏 */}
        <AnimatePresence>
          {isFullscreen && showControls && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="fixed top-4 right-4 flex gap-2 z-50"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
                title={soundEnabled ? '关闭声音' : '开启声音'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-6 h-6 text-white" />
                ) : (
                  <VolumeX className="w-6 h-6 text-white" />
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleFullscreen}
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
                title="退出全屏"
              >
                <X className="w-6 h-6 text-white" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex flex-col items-center justify-center"
        >
          {/* Time Display */}
          <div className="text-center">
            <div 
              className={`${isFullscreen ? 'text-[20rem] leading-none' : 'text-[10rem] md:text-[12rem] leading-none'}`}
              style={{
                fontFamily: '"DS-Digital", "Courier New", monospace',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
                color: timeLeft === 0 
                  ? '#22c55e'
                  : timeLeft < 60 
                  ? '#ef4444'
                  : '#e5e7eb',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}
            >
              {formatTime(timeLeft)}
            </div>
            {timeLeft === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`font-semibold mt-8 text-green-500 ${isFullscreen ? 'text-5xl' : 'text-3xl'}`}
              >
                时间到！
              </motion.div>
            )}
          </div>

          {/* Control Buttons */}
          <AnimatePresence>
            {(!isFullscreen || showControls) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className={`flex justify-center gap-4 ${isFullscreen ? 'mt-20' : 'mt-12'}`}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTimer}
                  disabled={timeLeft === 0}
                  className={`flex items-center gap-2 ${isFullscreen ? 'px-12 py-6 text-xl' : 'px-8 py-4'} rounded-full font-semibold text-white shadow-lg transition-all ${
                    timeLeft === 0
                      ? 'bg-slate-700 cursor-not-allowed'
                      : isRunning
                      ? 'bg-orange-500 hover:bg-orange-600'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className={isFullscreen ? 'w-7 h-7' : 'w-5 h-5'} />
                      <span>暂停</span>
                    </>
                  ) : (
                    <>
                      <Play className={isFullscreen ? 'w-7 h-7' : 'w-5 h-5'} />
                      <span>开始</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetTimer}
                  className={`flex items-center gap-2 ${isFullscreen ? 'px-12 py-6 text-xl' : 'px-8 py-4'} bg-slate-700 hover:bg-slate-600 text-white rounded-full font-semibold shadow-lg transition-all`}
                >
                  <RotateCcw className={isFullscreen ? 'w-7 h-7' : 'w-5 h-5'} />
                  <span>重置</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 预设时间快捷按钮 */}
          {!isFullscreen && (
            <div className="mt-12 w-full max-w-2xl px-4">
              <p className="text-sm text-slate-400 mb-4 text-center">快捷设置</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_TIMES.map((preset) => (
                  <motion.button
                    key={preset.seconds}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPresetTime(preset.seconds)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      initialTime === preset.seconds
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {preset.label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* 编辑时间模态框 */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">自定义时间</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    分钟
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    秒
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={applyCustomTime}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
