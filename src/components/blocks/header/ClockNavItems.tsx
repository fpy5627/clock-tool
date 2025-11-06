"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
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
              <span>{t(item.labelKey as any)}</span>
            </Link>
          </NavigationMenuItem>
        );
      })}
    </>
  );
}

