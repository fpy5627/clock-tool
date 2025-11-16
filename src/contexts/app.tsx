"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { cacheGet, cacheRemove } from "@/lib/cache";

import { CacheKey } from "@/services/constant";
import { ContextValue } from "@/types/context";
import { User } from "@/types/user";
import moment from "moment";
import useOneTapLogin from "@/hooks/useOneTapLogin";
import { useSession } from "next-auth/react";
import { isAuthEnabled, isGoogleOneTapEnabled } from "@/lib/auth";
import { notifySoundMetaList } from "@/lib/notify-sound";

/**
 * 全局提示音KEY，localStorage用于存取用户偏好
 */
const NOTIFY_SOUND_KEY = "notifySoundId";
// 默认音效ID（与notify-sound.ts首个保持一致）
const DEFAULT_NOTIFY_SOUND = notifySoundMetaList[0]?.id || "bell";

const AppContext = createContext({} as ContextValue);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  if (isAuthEnabled() && isGoogleOneTapEnabled()) {
    useOneTapLogin();
  }

  const { data: session } = isAuthEnabled() ? useSession() : { data: null };

  const [showSignModal, setShowSignModal] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  // ========== 新增：提示音全局状态逻辑 ===========
  // 通知音效当前选中值
  const [notifySoundId, setNotifySoundIdState] = useState<string>(DEFAULT_NOTIFY_SOUND);
  // 变更并持久化到localStorage
  const setNotifySoundId = (id: string) => {
    setNotifySoundIdState(id);
    try {
      localStorage.setItem(NOTIFY_SOUND_KEY, id);
    } catch {}
  };
  // 初次加载从本地恢复用户上次选择
  useEffect(() => {
    const cached = localStorage.getItem(NOTIFY_SOUND_KEY);
    if (cached && cached !== notifySoundId) {
      setNotifySoundIdState(cached);
    }
  }, []);

  const fetchUserInfo = async function () {
    try {
      const resp = await fetch("/api/get-user-info", {
        method: "POST",
      });

      if (!resp.ok) {
        throw new Error("fetch user info failed with status: " + resp.status);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setUser(data);

      updateInvite(data);
    } catch (e) {
      console.log("fetch user info failed");
    }
  };

  const updateInvite = async (user: User) => {
    try {
      if (user.invited_by) {
        // user already been invited
        console.log("user already been invited", user.invited_by);
        return;
      }

      const inviteCode = cacheGet(CacheKey.InviteCode);
      if (!inviteCode) {
        // no invite code
        return;
      }

      const userCreatedAt = moment(user.created_at).unix();
      const currentTime = moment().unix();
      const timeDiff = Number(currentTime - userCreatedAt);

      if (timeDiff <= 0 || timeDiff > 7200) {
        // user created more than 2 hours
        console.log("user created more than 2 hours");
        return;
      }

      // update invite relation
      console.log("update invite", inviteCode, user.uuid);
      const req = {
        invite_code: inviteCode,
        user_uuid: user.uuid,
      };
      const resp = await fetch("/api/update-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
      });
      if (!resp.ok) {
        throw new Error("update invite failed with status: " + resp.status);
      }
      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setUser(data);
      cacheRemove(CacheKey.InviteCode);
    } catch (e) {
      console.log("update invite failed: ", e);
    }
  };

  useEffect(() => {
    if (session && session.user) {
      fetchUserInfo();
    }
  }, [session]);

  return (
    <AppContext.Provider
      value={{
        showSignModal,
        setShowSignModal,
        user,
        setUser,
        showFeedback,
        setShowFeedback,
        // ========== 新增全局提示音字段 ===========
        notifySoundId,
        setNotifySoundId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
