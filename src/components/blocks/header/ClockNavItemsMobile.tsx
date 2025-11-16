"use client";

import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function ClockNavItemsMobile() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('clock');

  const navItems = [
    { id: 'countdown', path: 'countdown', labelKey: 'modes.timer' },
    { id: 'stopwatch', path: 'stopwatch', labelKey: 'modes.stopwatch' },
    { id: 'alarm', path: 'alarm', labelKey: 'modes.alarm' },
    { id: 'world-clock', path: 'world-clock', labelKey: 'modes.worldclock' },
  ];

  return (
    <>
      {navItems.map((item) => {
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
            {t(item.labelKey as any)}
          </Link>
        );
      })}
    </>
  );
}

