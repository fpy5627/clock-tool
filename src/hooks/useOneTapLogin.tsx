"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export default function useOneTapLogin() {
  const { data: session, status } = useSession();
  const googleOneTapRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);
  const initializedRef = useRef(false);

  const loadGoogleOneTap = async () => {
    // 动态导入 google-one-tap 库
    if (!googleOneTapRef.current) {
      try {
        const googleOneTap = (await import("google-one-tap")).default;
        googleOneTapRef.current = googleOneTap;
      } catch (error) {
        console.error("Failed to load google-one-tap:", error);
        return false;
      }
    }

    // 确保 GSI 脚本已加载（只加载一次）
    if (!scriptLoadedRef.current && typeof window !== "undefined") {
      return new Promise<boolean>((resolve) => {
        // 检查是否已经存在 GSI 脚本
        const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
        if (existingScript) {
          scriptLoadedRef.current = true;
          resolve(true);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          scriptLoadedRef.current = true;
          resolve(true);
        };
        script.onerror = () => {
          console.error("Failed to load GSI script");
          resolve(false);
        };
        document.head.appendChild(script);
      });
    }

    return true;
  };

  const oneTapLogin = async function () {
    // 延迟加载库和脚本
    const loaded = await loadGoogleOneTap();
    if (!loaded || !googleOneTapRef.current) {
      return;
    }

    const options = {
      client_id: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID,
      auto_select: false,
      cancel_on_tap_outside: false,
      context: "signin",
    };

    try {
      googleOneTapRef.current(options, (response: any) => {
        console.log("onetap login ok", response);
        handleLogin(response.credential);
      });
    } catch (error) {
      console.error("One tap login error:", error);
    }
  };

  const handleLogin = async function (credentials: string) {
    const res = await signIn("google-one-tap", {
      credential: credentials,
      redirect: false,
    });
    console.log("signIn ok", res);
  };

  useEffect(() => {
    if (status === "unauthenticated" && !initializedRef.current) {
      initializedRef.current = true;
      
      let intervalId: NodeJS.Timeout | null = null;
      
      // 延迟初始化：等待页面加载完成后再加载（避免阻塞首屏）
      const initTimer = setTimeout(() => {
        oneTapLogin();

        // 减少轮询频率，从3秒改为10秒
        intervalId = setInterval(() => {
          oneTapLogin();
        }, 10000);
      }, 2000); // 2秒后开始加载

      return () => {
        clearTimeout(initTimer);
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    } else if (status === "authenticated") {
      initializedRef.current = false;
    }
  }, [status]);

  return null;
}
