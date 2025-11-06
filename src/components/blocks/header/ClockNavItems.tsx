"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Timer, Clock, AlarmClock, Globe } from 'lucide-react';
import { NavigationMenuItem } from "@/components/ui/navigation-menu";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function ClockNavItems() {
  const router = useRouter();
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
          <NavigationMenuItem key={item.id}>
            <Link
              href={`/${item.path}` as any}
              className={cn(
                "text-muted-foreground",
                navigationMenuTriggerStyle,
                buttonVariants({
                  variant: "ghost",
                }),
                isActive && "text-foreground font-medium"
              )}
            >
              <Icon className="size-4 shrink-0 mr-2" />
              <span>{t(item.labelKey as any)}</span>
            </Link>
          </NavigationMenuItem>
        );
      })}
    </>
  );
}

