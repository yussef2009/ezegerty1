import { Bell } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useClientNotifications } from "../hooks/useClientNotifications";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

/** Bell + dropdown for client accounts only (not admin/delivery). */
export function ClientNotificationBell() {
  const { user, role } = useAuth();
  const { t } = useLanguage();
  const c = t.client;
  const navigate = useNavigate();
  const { unread, unreadCount, markRead } = useClientNotifications(user?.id);

  if (!user || role === "admin" || role === "delivery") {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={c.notifications}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center bg-orange-500 text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel>{c.notifications}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {unread.length === 0 ? (
          <div className="p-3 text-sm text-gray-500 text-center">{c.noNotifications}</div>
        ) : (
          unread.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-1 cursor-pointer"
              onClick={async () => {
                await markRead(n.id);
                if (n.orderId) navigate(`/client/dashboard`);
                else navigate("/client/dashboard");
              }}
            >
              <span className="font-medium text-sm">{n.title}</span>
              <span className="text-xs text-gray-500 line-clamp-2">{n.message}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/client/dashboard")}>
          {c.viewAll || "View all on dashboard"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
