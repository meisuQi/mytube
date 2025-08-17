import { db } from "@/db";
import { notifications, videoReactions, videos } from "@/db/schema";
import {createTRPCRouter,protectedProcedure} from "@/trpc/init";
import { and,eq } from "drizzle-orm";
import { z } from "zod";

export const videoReactionsRouter=createTRPCRouter({
  like:protectedProcedure
    .input(z.object({videoId:z.string().uuid()}))
    .mutation(async({input,ctx})=>{
      const {videoId}=input;
      const {id:userId}=ctx.user;
      // 1. 获取视频所有者
    const videoOwner = await db
    .select({ userId: videos.userId })
    .from(videos)
    .where(eq(videos.id, videoId))
    .then(rows => rows[0]?.userId);
  
  if (!videoOwner) throw new Error("video not exist");
      // The way of tracking views is going to be only for logged in users and only one view per user
      const [existingVideoReactionLike]=await  db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.videoId,videoId),
            eq(videoReactions.userId,userId),
            eq(videoReactions.type,"like")
          )
        );
        //removing our like
        if(existingVideoReactionLike){
          const [deletedViewerReaction]=await db
             .delete(videoReactions)
             .where(
              and(
                eq(videoReactions.userId,userId),
                eq(videoReactions.videoId,videoId),
              )
             ) 
             .returning();
             // 发送通知（如果不是自己的视频）
              if (videoOwner !== userId) {
                await db.insert(notifications).values({
                  type: "video_like",
                  senderId: userId,
                  recipientId: videoOwner,
                  videoId,
                  read: false,
                  createdAt: new Date()
                });
              }
             return deletedViewerReaction;
        }
        const [createVideoReaction]= await db
           .insert(videoReactions)
           .values({userId,videoId,type:"like"}) 
           //当我们之前已经点击过dislike时，会发生冲突，所以会重新设置为like
           .onConflictDoUpdate({
            target:[videoReactions.userId,videoReactions.videoId],
            set:{
              type:"like",
            },
           })
           .returning()
        return createVideoReaction;
    }),  
    dislike:protectedProcedure
    .input(z.object({videoId:z.string().uuid()}))
    .mutation(async({input,ctx})=>{
      const {videoId}=input;
      const {id:userId}=ctx.user;
      // The way of tracking views is going to be only for logged in users and only one view per user
      const [existingVideoReactionDislike]=await  db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.videoId,videoId),
            eq(videoReactions.userId,userId),
            eq(videoReactions.type,"dislike")
          )
        );
        //removing our like
        if(existingVideoReactionDislike){
          const [deletedViewerReaction]=await db
             .delete(videoReactions)
             .where(
              and(
                eq(videoReactions.userId,userId),
                eq(videoReactions.videoId,videoId),
              )
             ) 
             .returning();
             return deletedViewerReaction;
        }
        const [createVideoReaction]= await db
           .insert(videoReactions)
           .values({userId,videoId,type:"dislike"}) 
           .onConflictDoUpdate({
            target:[videoReactions.userId,videoReactions.videoId],
            set:{
              type:"dislike",
            },
           })
           .returning()
        return createVideoReaction;
    }), 
})
