import { useCallback, useEffect, useRef, useState } from "react";
import { dbGet } from "../lib/db";
import { markNotificationRead, type AppNotification } from "../lib/notifications";
import { toast } from "sonner";

export function useClientNotifications(userId: string | undefined, pollMs = 8000) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState<AppNotification[]>([]);
  const prevUnreadRef = useRef(0);
  const initializedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnread([]);
      return;
    }
    const list = ((await dbGet(`notifications:${userId}`)) as AppNotification[] | null) || [];
    const unreadList = list.filter((n) => !n.read);
    setNotifications(list);
    setUnread(unreadList);

    if (initializedRef.current && unreadList.length > prevUnreadRef.current && unreadList[0]) {
      const newest = unreadList[0];
      toast.info(newest.title, { description: newest.message, duration: 6000 });
    }
    initializedRef.current = true;
    prevUnreadRef.current = unreadList.length;
  }, [userId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollMs);
    return () => clearInterval(interval);
  }, [refresh, pollMs]);

  const markRead = async (notificationId: string) => {
    if (!userId) return;
    await markNotificationRead(userId, notificationId);
    await refresh();
  };

  return {
    notifications,
    unread,
    unreadCount: unread.length,
    refresh,
    markRead,
  };
}
