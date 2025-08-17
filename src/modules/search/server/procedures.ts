import { db } from "@/db";
import { users, videoReactions, videoViews, videos } from "@/db/schema";
import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { and, eq, or, lt, desc, ilike, getTableColumns, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export const searchRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        query: z.string().nullish(),
        categoryId: z.string().uuid().nullish(),
        sortBy: z.enum(["default", "views"]).default("default"),
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        }).nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      const { cursor, limit, query, categoryId, sortBy } = input;
      
      // 为聚合字段创建别名
      const viewCountAlias = alias(videoViews, "view_count_alias");
      const likeCountAlias = alias(videoReactions, "like_count_alias");
      const dislikeCountAlias = alias(videoReactions, "dislike_count_alias");
      
      const baseQuery = db
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: count(viewCountAlias).as("viewCount"),
          likeCount: count(likeCountAlias).mapWith(Number).as("likeCount"),
          dislikeCount: count(dislikeCountAlias).mapWith(Number).as("dislikeCount"),
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .leftJoin(viewCountAlias, eq(viewCountAlias.videoId, videos.id))
        .leftJoin(
          likeCountAlias,
          and(
            eq(likeCountAlias.videoId, videos.id),
            eq(likeCountAlias.type, "like")
          )
        )
        .leftJoin(
          dislikeCountAlias,
          and(
            eq(dislikeCountAlias.videoId, videos.id),
            eq(dislikeCountAlias.type, "dislike")
          )
        )
        .where(and(
          eq(videos.visibility, "public"),
          query ? or(
            ilike(videos.title, `%${query}%`),
            ilike(videos.description, `%${query}%`)
          ) : undefined,
          categoryId ? eq(videos.categoryId, categoryId) : undefined
        ))
        .groupBy(videos.id, users.id);

      // 根据排序参数添加排序
      let orderedQuery;
      if (sortBy === "views") {
        orderedQuery = baseQuery.orderBy(
          desc(count(viewCountAlias)),
          desc(videos.updatedAt),
          desc(videos.id)
        );
      } else {
        orderedQuery = baseQuery.orderBy(
          desc(videos.updatedAt),
          desc(videos.id)
        );
      }

      // 添加游标分页
      if (cursor) {
        orderedQuery = orderedQuery.having(or(
          lt(videos.updatedAt, cursor.updatedAt),
          and(
            eq(videos.updatedAt, cursor.updatedAt),
            lt(videos.id, cursor.id)
          )
        ));
      }

      // 执行查询
      const result = await orderedQuery.limit(limit + 1);
      
      const data = result.map(row => ({
        ...row,
        viewCount: row.viewCount ?? 0,
        likeCount: row.likeCount ?? 0,
        dislikeCount: row.dislikeCount ?? 0,
      }));

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore && lastItem
        ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
        : null;

      return {
        items,
        nextCursor
      };
    }),

  // 用户搜索过程保持不变
  getUsers: baseProcedure
    .input(
      z.object({
        query: z.string().nullish(),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ input }) => {
      const { query, limit } = input;
      
      if (!query) return { items: [] };

      const data = await db
        .select({
          id: users.id,
          username: users.name,
          avatar: users.imageUrl,
          updatedAt:users.updatedAt,
        })
        .from(users)
        .where(or(
          ilike(users.name, `%${query}%`),
        ))
        .limit(limit);
        const hasMore = data.length > limit;
        const items = hasMore ? data.slice(0, -1) : data;
        const lastItem = items[items.length - 1];
        const nextCursor = hasMore && lastItem
          ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
          : null;
      return {
        items: data,
      };
    }),
});