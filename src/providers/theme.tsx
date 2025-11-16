"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode, useEffect } from "react";
import { useLocale } from "next-intl";
import { isAuthEnabled } from "@/lib/auth";
import dynamic from "next/dynamic";
import Analytics from "@/components/analytics";
import Adsense from "./adsense";

// 延迟加载 SignModal（只在需要时加载）
const SignModal = dynamic(() => import("@/components/sign/modal"), {
  ssr: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={process.env.NEXT_PUBLIC_DEFAULT_THEME || "system"}
      enableSystem
      disableTransitionOnChange
    >
      {children}

      <Analytics />

      {isAuthEnabled() && <SignModal />}

      <Adsense />
    </NextThemesProvider>
  );
}
