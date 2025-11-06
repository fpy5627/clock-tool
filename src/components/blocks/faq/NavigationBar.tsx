"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Timer, Clock, AlarmClock, Globe, HelpCircle } from 'lucide-react';

interface NavigationBarProps {
  currentPage?: string;
}

export default function NavigationBar({ currentPage }: NavigationBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { theme } = useTheme();
  const t = useTranslations('clock');

  const navigateToPage = (page: string) => {
    const targetPath = `/${locale}/${page}`;
    if (pathname !== targetPath) {
      router.push(targetPath);
    }
  };

  const navItems = [
    { id: 'countdown', icon: Timer, path: 'countdown', labelKey: 'modes.timer' },
    { id: 'stopwatch', icon: Clock, path: 'stopwatch', labelKey: 'modes.stopwatch' },
    { id: 'alarm', icon: AlarmClock, path: 'alarm', labelKey: 'modes.alarm' },
    { id: 'world-clock', icon: Globe, path: 'world-clock', labelKey: 'modes.worldclock' },
    { id: 'faq', icon: HelpCircle, path: 'faq', labelKey: 'faq' },
  ];

  return (
    <div className={`sticky top-0 left-0 right-0 w-full z-40 ${
      theme === 'dark' ? 'bg-slate-900/95' : 'bg-white/95'
    } backdrop-blur-md border-b ${
      theme === 'dark' ? 'border-slate-700/50' : 'border-gray-200/50'
    } shadow-sm`}>
      <div className="container mx-auto max-w-7xl">
        {/* 主要功能按钮 */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 py-3 px-2 sm:px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.id === 'faq' && pathname.includes('/faq')) || (!item.id.includes('faq') && pathname.includes(item.path));
            
            return (
              <motion.button
                key={item.id}
                onClick={() => navigateToPage(item.path)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex flex-col items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
                  isActive ? 'scale-110' : ''
                }`} />
                <span className={`text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}>
                  {item.labelKey === 'faq' 
                    ? (locale === 'zh' ? '常见问题' : 'FAQ')
                    : t(item.labelKey as any)
                  }
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                      theme === 'dark' ? 'bg-blue-300' : 'bg-blue-100'
                    }`}
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

