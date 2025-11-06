"use client";

import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Timer, Clock, AlarmClock, Globe } from 'lucide-react';
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function ClockNavItemsMobile() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('clock');

  const navItems = [
    { id: 'countdown', icon: Timer, path: 'countdown', labelKey: 'modes.timer' },
    { id: 'stopwatch', icon: Clock, path: 'stopwatch', labelKey: 'modes.stopwatch' },
    { id: 'alarm', icon: AlarmClock, path: 'alarm', labelKey: 'modes.alarm' },
    { id: 'world-clock', icon: Globe, path: 'world-clock', labelKey: 'modes.worldclock' },
  ];

  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.includes(item.path);
        
        return (
          <Link
            key={item.id}
            href={`/${item.path}` as any}
            className={cn(
              "font-semibold my-4 flex items-center gap-2 px-4",
              isActive && "text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {t(item.labelKey as any)}
          </Link>
        );
      })}
    </>
  );
}

