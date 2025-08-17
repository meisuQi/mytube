// 在 routers 目录下创建 notification.ts
import { db } from '@/db';
import { comments, notifications, users, videos } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { trpc } from '@/trpc/server';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, lt, or, sql ,getTableColumns} from 'drizzle-orm';
import { z } from 'zod';


export const notificationRouter = createTRPCRouter({
  // 在 notificationRouter 中添加 create 过程
  create: protectedProcedure
    .input(z.object({
      type: z.enum(["video_like", "video_comment", "comment_like","comment_reply"]),
      senderId: z.string().uuid(),
      recipientId: z.string().uuid(),
      videoId: z.string().uuid().optional(),
      commentId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证通知数据完整性
      if (input.type === "video_like" && !input.videoId) {
        throw new Error("Video ID is required for video_like notification");
      }
      
      if (input.type === "video_comment" && (!input.videoId || !input.commentId)) {
        throw new Error("Video ID and Comment ID are required for video_comment notification");
      }
      
      if (input.type === "comment_like" && (!input.commentId || !input.videoId)) {
        throw new Error("Video ID and Comment ID are required for comment_like notification");
      }
      if (input.type === "comment_reply" && (!input.commentId || !input.videoId)) {
        throw new Error("Video ID and Comment ID are required for comment_reply notification");
      }
      
      // 创建通知
      const [notification] = await db.insert(notifications).values({
        type: input.type,
        senderId: input.senderId,
        recipientId: input.recipientId,
        videoId: input.videoId,
        commentId: input.commentId,
        read: false
      }).returning();
      
      // 触发实时更新
      (globalThis as any).notificationEmitter.emit('new', notification);
      
      return notification;
    }),
  // 获取未读通知数量
  getUnreadCount: protectedProcedure
  .query(async ({ ctx }) => {
    const {id:userId}=ctx.user;
    const result = await  
    db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, userId),
          eq(notifications.read, false)
        )
      );
      return result[0]?.count ?? 0;
  }),

  // 获取通知列表
  getAll: protectedProcedure
    .input(z.object({
      cursor:z.object({
        id:z.string().uuid(),
        createdAt:z.date(),
      })
      .nullish(),
      limit:z.number().min(1).max(100),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const {id:userId}=ctx.user;
      const data = await db
        .select({
          notification: getTableColumns(notifications),
          sender:users,
          comment:comments,
          video:videos,
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.senderId, users.id))
        .leftJoin(videos, eq(notifications.videoId, videos.id))
        .leftJoin(comments, eq(notifications.commentId, comments.id))
        .where(and(eq(notifications.recipientId, userId),
        cursor 
        ? or(
          lt(notifications.createdAt,cursor.createdAt),
          and(
            eq(notifications.createdAt,cursor.createdAt),
            lt(notifications.id,cursor.id)
          ))
        :undefined,
        ))
        .orderBy(desc(notifications.createdAt))
        .limit(limit + 1)
        const hasMore=data.length >limit
          //remove the last item if there is more data
          const items=hasMore ?data.slice(0,-1):data
          //set the next cursor to the last item if there is more data
          const lastItem=items[items.length-1];
          const nextCursor=hasMore ?
            {
              id:lastItem.notification.id,
              createdAt:lastItem.notification.createdAt,
            }:null;
      return {
        items,
        nextCursor,
      };
    }),    


    // 标记单个通知为已读
    markOneAsRead: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id } = input;
        await db.update(notifications)
          .set({ read: true })
          .where(and(
            eq(notifications.id, id),
            eq(notifications.recipientId, ctx.user.id) // 确保用户只能操作自己的通知
          )) 
      }),
    
    // 标记所有通知为已读
    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.update(notifications)
          .set({ read: true })
          .where(eq(notifications.recipientId, ctx.user.id));
      }),
      remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const { id: userId } = ctx.user;
      
      // 删除通知（确保用户只能删除自己的通知）
      const [deletedNotification] = await db
        .delete(notifications)
        .where(and(
          eq(notifications.recipientId, userId), // 确保是当前用户的通知
          eq(notifications.id, id)
        ))
        .returning();
      
      if (!deletedNotification) {
        throw new TRPCError({ 
          code: "NOT_FOUND"
        });
      }
      return deletedNotification;
    }),
  });
