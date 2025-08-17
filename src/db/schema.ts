import { boolean, foreignKey, index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import {relations} from 'drizzle-orm';
import{
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
}from "drizzle-zod";

export const reactionType=pgEnum("reaction_type",["like","dislike"]);
//user schema
export const users=pgTable("users",{
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique().notNull(),
  name: text("name").notNull(),
  //TODO :add banner fields
  bannerUrl:text("banner_url"),
  bannerKey:text("banner_key"),
  imageUrl:text('image_url').notNull(),
  createdAt:timestamp("created_at").defaultNow().notNull(),
  updatedAt:timestamp("updated_at").defaultNow().notNull(),
},(t)=>[uniqueIndex("clerk_id_idx").on(t.clerkId)]);

export const userRelations=relations(users,({many})=>({
  videos:many(videos),
  videoViews:many(videoViews),
  videoReactions:many(videoReactions),
  subscriptions:many(subscriptions,{
    relationName:"subscriptions_viewer_id_fkey"
  }),
  subscribers:many(subscriptions,{
    relationName:"subscriptions_creator_id_fKey"
  }),
  comments:many(comments),
  commentReactions:many(commentReactions),
  playlists:many(playlists),
  sentNotifications: many(notifications, { 
    relationName: "notification_sender" 
  }),
  receivedNotifications: many(notifications, { 
    relationName: "notification_recipient" 
  }),
}))


export const subscriptions=pgTable("subscriptions",{
  viewerId:uuid("viewer_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  creatorId:uuid("creator_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  createdAt:timestamp("created_at").defaultNow().notNull(),
  updatedAt:timestamp("updated_at").defaultNow().notNull(),
},(t)=>[
  primaryKey({
    name:"subscriptions_pk",
    columns:[t.viewerId,t.creatorId]
  })
])

export const subscriptionRelations=relations(subscriptions,({one})=>({
  viewer:one(users,{
    fields:[subscriptions.viewerId],
    references:[users.id],
    relationName:"subscriptions_viewer_id_fkey"
  }),
  creator:one(users,{
    fields:[subscriptions.creatorId],
    references:[users.id],
    relationName:"subscriptions_creator_id_fKey"
  })
}))

//categories schema 
export const categories=pgTable("categories",{
  id: uuid("id").primaryKey().defaultRandom(),
  name:text("name").notNull().unique(),
  description:text("description"),
  createdAt:timestamp("created_at").defaultNow().notNull(),
  updatedAt:timestamp("updated_at").defaultNow().notNull(),
},(t)=>[uniqueIndex("name_idx").on(t.name)]);

export const categoryRelations=relations(categories,({many})=>({
  videos:many(videos),
}))

//这是定义 PostgreSQL 数据库中的 ENUM 类型，用来约束字段只能是某几个固定值之一。
export const videoVisibility=pgEnum("video_visibility",[
  "private",
  "public",
])
//videos schema
export const videos=pgTable("videos",{
  id: uuid("id").primaryKey().defaultRandom(),
  title:text("title").notNull(),
  description:text("description"),
  muxStatus:text("mux_status"),
  muxAssetId:text("mux_asset_id").unique(),
  muxUploadId:text("mux_upload_id").unique(),
  muxPlaybackId:text("mux_playback_id").unique(),
  muxTrackId:text("mux_track_id").unique(),
  muxTrackStatus:text("mux_track_status"),
  thumbnailUrl:text("thumbnail_url"),
  thumbnailKey:text("thumbnail_key"),
  previewUrl:text("preview_url"),
  previewKey:text("preview_key"),
  duration:integer("duration").default(0).notNull(),
  visibility:videoVisibility("visibility").default("private").notNull(),
  userId:uuid("user_id").references(()=>users.id,{
    onDelete:"cascade",
  }).notNull(),
  categoryId:uuid("category_id").references(()=>categories.id,{
    onDelete:"set null",
  }),
  createdAt:timestamp("created_at").defaultNow().notNull(),
  updatedAt:timestamp("updated_at").defaultNow().notNull(),
})

//这三行代码是用 Drizzle ORM 提供的工具函数，为你的数据库表 videos 自动生成 表单校验/类型检查用的 Zod schema
//从 videos 表结构中生成一个用于插入数据时的 Zod schema。
export const videoInsertSchema=createInsertSchema(videos);
//生成一个用于更新数据时的 Zod schema。
export const videoUpdateSchema=createUpdateSchema(videos);
//生成一个用于读取/展示数据的 Zod schema。
export const videoSelectSchema=createSelectSchema(videos);

export const videoRelations=relations(videos,({one,many})=>({
  user:one(users,{
    fields:[videos.userId],
    references:[users.id]
  }),
  category:one(categories,{
    fields:[videos.categoryId],
    references:[categories.id]
  }),
  views:many(videoViews),
  reactions:many(videoReactions),
  comments:many(comments),
  playlistVideos:many(playlistVideos),
  notifications: many(notifications), 
}))

// 在 comments 表中添加 rootId 字段
export const comments = pgTable("comments",{
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parentId"),
  rootId: uuid("rootId"), // 指向线程根评论
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => {
  return [
    foreignKey({  
      columns: [t.parentId],
      foreignColumns: [t.id],
      name: "comments_parent_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.rootId],
      foreignColumns: [t.id],
      name: "comments_root_id_fkey",
    }).onDelete("cascade"),
  ]
});

// 更新评论关系
export const commentRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [comments.videoId],
    references: [videos.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "comments_parent_id_fkey",
  }),
  root: one(comments, {
    fields: [comments.rootId],
    references: [comments.id],
    relationName: "comments_root_id_fkey",
  }),
  reactions: many(commentReactions),
  replies: many(comments, {
    relationName: "comments_parent_id_fkey",
  }),
  notifications: many(notifications), 
}));


  export const commentSelectSchema=createSelectSchema(comments);
  export const commentInsertSchema=createInsertSchema(comments);
  export const commentUpdateSchema=createUpdateSchema(comments);


export const commentReactions=pgTable("comment_reactions",{
  userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
  commentId:uuid("comment_id").references(()=>comments.id,{onDelete:"cascade"}).notNull(),
  videoId:uuid("video_id").references(()=>videos.id,{onDelete:"cascade"}).notNull(),
  type:reactionType("type").notNull(),
  createdAt:timestamp("created_at").defaultNow().notNull(),
  updatedAt:timestamp("updated_at").defaultNow().notNull(),
},(t)=>[
    primaryKey({
      name:"comment_reactions_pk",
      columns:[t.userId,t.commentId],
    }),
  ])
  export const commentReactionRelations=relations(commentReactions,({one})=>({
    user:one(users,{
      fields:[commentReactions.userId],
      references:[users.id]
    }),
    comment:one(comments,{
      fields:[commentReactions.commentId], 
      references:[comments.id]
    }),
    video:one(videos,{
      fields:[commentReactions.videoId],
      references:[videos.id]
    }),
  }));

export const videoViews=pgTable("video-views",{
   userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
   videoId:uuid("video_id").references(()=>videos.id,{onDelete:"cascade"}).notNull(),
   createdAt:timestamp("created_at").defaultNow().notNull(),
   updatedAt:timestamp("updated_at").defaultNow().notNull(),
  },(t)=>[
    primaryKey({
      name:"video_views_pk",
      columns:[t.userId,t.videoId],
    }),
  ]);

  export const videoViewRelations=relations(videoViews,({one})=>({
    user:one(users,{
      fields:[videoViews.userId],
      references:[users.id]
    }),
    video:one(videos,{
      fields:[videoViews.videoId],
      references:[videos.id]
    }),
  }));

  export const videoViewSelectSchema=createSelectSchema(videoViews);
  export const videoViewInsertSchema=createInsertSchema(videoViews);
  export const videoViewUpdateSchema=createUpdateSchema(videoViews);
  /* reactionType：这是常量的名称，你可以通过它引用该常量。
    pgEnum：这个函数可能是一个用来定义 PostgreSQL 枚举类型的自定义函数。它接受两个参数：
    第一个参数 "reaction_type" 是枚举的名称，表示在数据库中你可能有一个叫做 reaction_type 的枚举字段。
    第二个参数 ["like", "dislike"] 是枚举的可能值，即该字段只能是 "like" 或 "dislike"，这通常用于表示某种用户反应或状态。
    */
  

  export const videoReactions=pgTable("video-reactions",{
    userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
    videoId:uuid("video_id").references(()=>videos.id,{onDelete:"cascade"}).notNull(),
    type:reactionType("type").notNull(),
    createdAt:timestamp("created_at").defaultNow().notNull(),
    updatedAt:timestamp("updated_at").defaultNow().notNull(),
   },(t)=>[
     primaryKey({
       name:"video_reactions_pk",
       columns:[t.userId,t.videoId],
     }),
   ]);

   export const videoReactionRelations=relations(videoReactions,({one})=>({
    user:one(users,{
      fields:[videoReactions.userId],
      references:[users.id]
    }),
    video:one(videos,{
      fields:[videoReactions.videoId], 
      references:[videos.id]
    }),
  }));
  //zod验证从数据库中读取出/新增/更新的数据结构是否正确。
  export const videoReactionSelectSchema=createSelectSchema(videoReactions);
  export const videoReactionInsertSchema=createInsertSchema(videoReactions);
  export const videoReactionUpdateSchema=createUpdateSchema(videoReactions);


  export const playlistVideos=pgTable("playlist_videos",{
    playlistId:uuid("playlist_id").references(()=>playlists.id,{onDelete:"cascade"}).notNull(),
    videoId:uuid("video_id").references(()=>videos.id,{onDelete:"cascade"}).notNull(),
    createdAt:timestamp("created_at").defaultNow().notNull(),
    updatedAt:timestamp("updated_at").defaultNow().notNull(),
  },(t)=>[
    primaryKey({
      name:"playlist_videos_pk",
      columns:[t.playlistId,t.videoId],
    }),
  ])

  export const playlistVideoRelations=relations(playlistVideos,({one})=>({
    playlist:one(playlists,{
      fields:[playlistVideos.playlistId],
      references:[playlists.id],
    }),
    video:one(videos,{
      fields:[playlistVideos.videoId],
      references:[videos.id],
    }),
  }))

  export const playlists=pgTable("playlists",{
    id:uuid("id").primaryKey().defaultRandom(),
    name:text("name").notNull(),
    description:text("description"),
    userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(),
    createdAt:timestamp("created_at").defaultNow().notNull(),
    updatedAt:timestamp("updated_at").defaultNow().notNull(),
  })

  export const playlistRelations=relations(playlists,({one,many})=>({
    user:one(users,{
      fields:[playlists.userId],
      references:[users.id],
    }),
    playlistVideos:many(playlistVideos),
  }))

  // 在 pgEnum 部分添加通知类型
export const notificationType = pgEnum("notification_type", [
  "video_like", 
  "video_comment", 
  "comment_like",
  "comment_reply",
]);

// 通知表
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: notificationType("type").notNull(),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  recipientId: uuid("recipient_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("notifications_recipient_idx").on(t.recipientId),
  index("notifications_read_idx").on(t.read),
]);

// 通知关系
export const notificationRelations = relations(notifications, ({ one }) => ({
  sender: one(users, {
    fields: [notifications.senderId],
    references: [users.id],
    relationName: "notification_sender"
  }),
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
    relationName: "notification_recipient"
  }),
  video: one(videos, {
    fields: [notifications.videoId],
    references: [videos.id]
  }),
  comment: one(comments, {
    fields: [notifications.commentId],
    references: [comments.id]
  }),
}));