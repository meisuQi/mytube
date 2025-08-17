"use client";
import { trpc } from '@/trpc/client';
import { DEFAULT_LIMIT } from "@/constants";

import { Button } from '@/components/ui/button'; // 假设使用 UI 组件库
import { Loader2 } from 'lucide-react'; // 加载图标
import { NotificationItem } from './notificationItem';
import { useState } from 'react';

export default function Notifications() {
  const utils = trpc.useUtils();
  const [removingId, setRemovingId] = useState<string | null>(null);
  // 获取通知列表
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = 
    trpc.notification.getAll.useInfiniteQuery(
      { limit: DEFAULT_LIMIT },
      { 
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );
  
  // 标记单个通知为已读
  const markOneAsRead = trpc.notification.markOneAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.getAll.invalidate();
    }
  });

  // 标记所有通知为已读
  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.getAll.invalidate();
    }
  });
  // 删除通知
  const deleteNotification = trpc.notification.remove.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.getAll.invalidate();
      setRemovingId(null);
    },
    onError: () => {
      setRemovingId(null);
    }
  });
  // 处理标记单个通知为已读
  const handleMarkOneAsRead = (notificationId: string) => {
    markOneAsRead.mutate({ id: notificationId });
  };

  // 处理标记所有通知为已读
  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };
 // 处理删除通知
 const handleRemoveNotification = (notificationId: string) => {
  setRemovingId(notificationId);
  deleteNotification.mutate({ id: notificationId });
};

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button 
          variant="ghost"
          onClick={handleMarkAllAsRead}
          disabled={markAllAsRead.isPending}
        >
          {markAllAsRead.isPending ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : (
            "Mark All As Read"
          )}
        </Button>
      </div>

      {!data && isFetchingNextPage ? (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2">Loading Notification...</p>
        </div>
      ) : !data || data.pages[0].items.length === 0 ? (
        <div className="text-center py-10">No Notifications</div>
      ) : (
        <>
          <div className="space-y-4">
            {data.pages.flatMap(page => 
              page.items.map(item => (
                <NotificationItem
                  key={item.notification.id}
                  notification={item.notification}
                  sender={item.sender}
                  video={item.video}
                  comment={item.comment}
                  onMarkRead={() => handleMarkOneAsRead(item.notification.id)}
                  isMarking={markOneAsRead.isPending && markOneAsRead.variables?.id === item.notification.id}
                  onRemove={handleRemoveNotification}
                  isRemoving={deleteNotification.isPending && removingId === item.notification.id}
                />
              ))
            )}
          </div>

          {hasNextPage && (
            <Button 
              variant="outline"
              className="mt-4 w-full"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                "Load More"
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
}