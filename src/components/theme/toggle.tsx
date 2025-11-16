"use client";

import { BsMoonStars, BsSun } from "react-icons/bs";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("clock.tooltips");

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex items-center gap-x-2 px-2">
      {resolvedTheme === "dark" ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <BsSun
              className="cursor-pointer text-lg text-muted-foreground"
              onClick={() => setTheme("light")}
              width={80}
              height={20}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("switch_to_light")}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <BsMoonStars
              className="cursor-pointer text-lg text-muted-foreground"
              onClick={() => setTheme("dark")}
              width={80}
              height={20}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("switch_to_dark")}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
