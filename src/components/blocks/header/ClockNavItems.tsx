"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { NavigationMenuItem } from "@/components/ui/navigation-menu";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * 时钟应用导航项组件
 * 用于在头部导航栏中显示 Timer、Stopwatch、Alarm、World Clock 等导航链接
 */
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

  /**
   * 处理导航点击事件
   * @param path - 目标页面路径
   */
  const handleNavigation = (path: string) => {
    const targetPath = `/${locale}/${path}`;
    if (pathname !== targetPath) {
      router.push(targetPath);
    }
  };

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname.includes(item.path);
        
        return (
          <NavigationMenuItem key={item.id}>
            <Link
              href={`/${item.path}` as any}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation(item.path);
              }}
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

