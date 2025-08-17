import { db } from "@/db";
import { commentReactions, comments, notifications, users, videos } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, getTableColumns, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { z } from "zod";

export const commentsRouter = createTRPCRouter({
  remove: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const { id: userId } = ctx.user;
      const [deletedComment] = await db
        .delete(comments)
        .where(and(
          eq(comments.userId, userId),
          eq(comments.id, id),
        ))
        .returning();
      if (!deletedComment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return deletedComment;
    }),  
    
  // 修改 create 过程
create: protectedProcedure
.input(
  z.object({
    parentId: z.string().uuid().nullish(),
    videoId: z.string().uuid(),
    value: z.string(),
  }),
)
.mutation(async ({ input, ctx }) => {
  const { videoId, value, parentId } = input;
  const { id: userId } = ctx.user;
  // 1. 获取视频所有者
  const videoOwner = await db
  .select({ userId: videos.userId })
  .from(videos)
  .where(eq(videos.id, videoId))
  .then(rows => rows[0]?.userId);

  if (!videoOwner) throw new TRPCError({ code: "NOT_FOUND", message: "video not exist" });
  let rootId: string | null = null;
  let parentCommentOwnerId: string | null = null; // 新增：存储被回复评论的作者ID

  if (parentId) {
    // 获取父评论以确定 rootId
    const [parentComment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, parentId));

    if (!parentComment) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    // 如果父评论有 rootId，则使用它，否则使用父评论 ID
    rootId = parentComment.rootId || parentComment.id;
    parentCommentOwnerId = parentComment.userId; // 存储被回复评论的作者ID
  }

  const [createdComment] = await db
    .insert(comments)
    .values({ 
      userId, 
      videoId, 
      value, 
      parentId: parentId || null,
      rootId // 设置 rootId
    })
    .returning();
      // 4. 发送通知
  if (parentId) {
    // 发送回复通知（如果不是回复自己）
    if (parentCommentOwnerId && parentCommentOwnerId !== userId) {
      await db.insert(notifications).values({
        type: "comment_reply",
        senderId: userId,
        recipientId: parentCommentOwnerId, // 通知被回复的用户
        videoId,
        commentId: createdComment.id,
        read: false,
        createdAt: new Date()
      });
    }
  } else {
    // 只对顶级评论发送视频评论通知（如果不是给自己的视频评论）
    if (videoOwner !== userId) {
      await db.insert(notifications).values({
        type: "video_comment",
        senderId: userId,
        recipientId: videoOwner, // 通知视频作者
        videoId,
        commentId: createdComment.id,
        read: false,
        createdAt: new Date()
      });
    }
  }
  return createdComment;
}),

    getMany: baseProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        rootId: z.string().uuid().nullish(), // 改为 rootId 而不是 parentId
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        }).nullish(),
        limit: z.number().min(1).max(100),
        commentId: z.string().uuid().nullish(), // 添加目标评论ID参数
      }),
    ) 
    .query(async ({ input, ctx }) => {
      const { clerkUserId } = ctx;
      const { videoId, cursor, limit, rootId } = input; // 改为 rootId
      let userId;
  
      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));
      if (user) {
        userId = user.id;
      }  
  
      const viewerReactions = db.$with("viewer_reactions").as(
        db
          .select({
            commentId: commentReactions.commentId,
            type: commentReactions.type,
          })
          .from(commentReactions)
          .where(inArray(commentReactions.userId, userId ? [userId] : []))
      );
  
      // 修改为基于 rootId 统计回复数量
      const replies = db.$with("replies").as(
        db
          .select({
            rootId: comments.rootId,
            count: count(comments.id).as("count"),
          })
          .from(comments)
          .where(isNotNull(comments.rootId))
          .groupBy(comments.rootId),
      );
  
      const [totalComments] = await db
        .select({ 
          count: count() 
        })
        .from(comments)
        .where(
          and(
            eq(comments.videoId, videoId)
          )
        );
      
      const data = await db
        .with(viewerReactions, replies)  
        .select({
          ...getTableColumns(comments),
          user: users,
          parentUser: {
            id: sql<string>`parent_users.id`.as('parent_user_id'),
            name: sql<string>`parent_users.name`.as('parent_user_name'),
            imageUrl: sql<string>`parent_users.image_url`.as('parent_user_image_url')
          },
          viewerReaction: viewerReactions.type,
          replyCount: replies.count,
          likeCount: db.$count(
            commentReactions,
            and(
              eq(commentReactions.type, "like"),
              eq(commentReactions.commentId, comments.id),
            )
          ),
          dislikeCount: db.$count(
            commentReactions,
            and(
              eq(commentReactions.type, "dislike"),
              eq(commentReactions.commentId, comments.id),
            )
          ),
        })
        .from(comments)
        .where(and(
          eq(comments.videoId, videoId),
          rootId
            ? eq(comments.rootId, rootId) // 使用 rootId 查询
            : isNull(comments.rootId), // 顶级评论的 rootId 为 null
          cursor
            ? or(
                lt(comments.updatedAt, cursor.updatedAt),
                and(
                  eq(comments.updatedAt, cursor.updatedAt),
                  lt(comments.id, cursor.id)
                )
              )
            : undefined
        ))
        .innerJoin(users, eq(comments.userId, users.id))
        .leftJoin(viewerReactions, eq(comments.id, viewerReactions.commentId))
        .leftJoin(replies, eq(comments.id, replies.rootId))
        //修复：先创建 parent_comments 子查询
        .leftJoin(
          db.select().from(comments).as("parent_comments"),
          eq(comments.parentId, sql`parent_comments.id`)
        )
        // 然后才能引用 parent_users
        .leftJoin(
          db.select({
            id: users.id,
            name: users.name,
            imageUrl: users.imageUrl,
          }).from(users).as("parent_users"),
          eq(sql`parent_comments.user_id`, sql`parent_users.id`)  
        )
        .orderBy(desc(comments.updatedAt), desc(comments.id))  
        .limit(limit + 1);
  
      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore ? {
        id: lastItem.id,
        updatedAt: lastItem.updatedAt
      } : null;
  
      return {
        items,
        nextCursor,
        totalCount: totalComments.count,
      };        
    }),
});