"use client";

import { trpc } from "@/trpc/client";
import { BellIcon } from "lucide-react";
import Link from "next/link";


export const NotificationIcon = () => {
  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery();
  return (
    <Link href="/notifications" className="relative">
      <BellIcon className="h-6 w-6" />
      {unreadCount && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </Link>
  );
};