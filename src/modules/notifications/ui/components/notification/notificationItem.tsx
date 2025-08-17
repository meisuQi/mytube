"use client";
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';

interface NotificationItemProps {
  notification: {
    id: string;
    type: 'video_like' | 'video_comment' | 'comment_like' | 'comment_reply';
    read: boolean;
    createdAt: Date;
  };
  sender: {
    id: string;
    name: string;
    imageUrl: string;
  } | null;
  video: {
    id: string;
    title: string;
  } | null;
  comment: {
    id: string;
    value: string;
  } | null;
  onMarkRead: () => void;
  isMarking: boolean;
  onRemove: (notificationId: string) => void; // 新增删除回调
  isRemoving: boolean; // 新增删除加载状态
}

export const NotificationItem = ({
  notification,
  sender,
  video,
  comment,
  onMarkRead,
  isMarking,
  onRemove,
  isRemoving,
}: NotificationItemProps) => {
  // 根据通知类型生成跳转链接
  const getNotificationLink = () => {
    if (!video) return '/'; // 回退到首页
    
    switch (notification.type) {
      case 'video_like':
        return `/videos/${video.id}`;
      
      case 'video_comment':
      case 'comment_like':
      case 'comment_reply':
        return comment 
          ? `/videos/${video.id}#commentId=${comment.id}`
          : `/videos/${video.id}`;
      
      default:
        return '/'; 
    }
  };
  
  // 根据通知类型生成消息内容
  const getNotificationMessage = () => {
    if (!sender) return null;
    
    switch (notification.type) {
      case 'video_like':
        return (
          <p>
            <span className="font-semibold">{sender.name}</span>
            {video ? ` liked your video "${video.title}"` : ' liked your video'}
          </p>
        );
      
      case 'video_comment':
        return (
          <div>
            <p>
              <span className="font-semibold">{sender.name}</span>
              {video ? ` commented your video "${video.title}"` : ' commented your video'}
            </p>
            {comment && (
              <p className="mt-1 text-gray-600 italic">"{comment.value}"</p>
            )}
          </div>
        );
      
      case 'comment_like':
        return (
          <div>
            <p>
              <span className="font-semibold">{sender.name}</span>
              {video ? ` liked your comment of "${video.title}" ` : ' liked your comment'}
            </p>
            {comment && (
              <p className="mt-1 text-gray-600 italic">"{comment.value}"</p>
            )}
          </div>
        );
      case 'comment_reply': // 新增回复通知消息
        return (
          <div>
            <p>
              <span className="font-semibold">{sender.name}</span>
              {video ? ` replied your comment of "${video.title}"` : ' replied your comment'}
            </p>
            {comment && (
              <p className="mt-1 text-gray-600 italic">"{comment.value}"</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // 获取跳转链接
  const notificationLink = getNotificationLink();
  
  return (
    <div className={`group/notification p-4 border rounded-lg relative transition-colors cursor-pointer ${
      !notification.read 
        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
        : 'hover:bg-gray-50'
    }`}
      
    >
   {/* 删除按钮 - 使用CSS悬停控制 */} 
   <Button 
        size="icon"
        variant="destructive"
        className="absolute bottom-2 right-2 w-4 h-4 rounded-full z-10 hover:bg-black text-white opacity-0 transition-opacity duration-200 group-hover/notification:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(notification.id);
        }}
        disabled={isRemoving}
      >
        {isRemoving ? (
          <Loader2 className="h-4 w-4 animate-spin bg-black rounded-full" />
        ) : (
          <X className="h-4 w-4 bg-black rounded-full" />
        )}
      </Button>
      
      
      <div className="flex items-start gap-3">
        {sender && (
          <img 
            src={sender.imageUrl} 
            alt={sender.name}
            className="w-10 h-10 rounded-full"
          />
        )}
        
        {/* 通知内容包装在链接中 */}
        <Link 
          href={notificationLink}
          className="flex-1 group"
          onClick={(e) => {
            // 点击通知内容时标记为已读
            if (!notification.read) {
              onMarkRead();
            }
          }}
        >
          <div >
            {getNotificationMessage()}
          </div>
          
          <div className="flex items-center mt-1">
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
            </p>
            <ArrowRight className="ml-2 h-3 w-3 text-gray-400 group-hover:text-blue-500" />
          </div>
        </Link>
        
        <div className="flex flex-col items-end space-y-1">
          {!notification.read && (
            <Button 
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡
                onMarkRead();
              }}
              disabled={isMarking}
            >
              {isMarking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : "Mark As Read"}
            </Button>
          )}
          
          {!notification.read && (
            <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full">
              unread
            </span>
          )}
        </div>
      </div>
    </div>
  );
};