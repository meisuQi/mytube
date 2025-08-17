import { db } from "@/db";
import { commentReactions, comments, notifications } from "@/db/schema";
import {createTRPCRouter,protectedProcedure} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and,eq } from "drizzle-orm";
import { z } from "zod";

export const commentReactionsRouter=createTRPCRouter({
  like:protectedProcedure
    .input(z.object({
      commentId:z.string().uuid(),
      videoId:z.string().uuid(),
    }))
    .mutation(async({input,ctx})=>{
      const {commentId,videoId}=input;
      const {id:userId}=ctx.user;
      // 1. 获取评论所有者
      const commentOwner = await db
        .select({ userId: comments.userId })
        .from(comments)
        .where(eq(comments.id, commentId))
        .then(rows => rows[0]?.userId);
      
      if (!commentOwner) throw new TRPCError({ code: "NOT_FOUND", message: "评论不存在" });
      // The way of tracking views is going to be only for logged in users and only one view per user
      const [existingCommentReactionLike]=await  db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId,commentId),
            eq(commentReactions.videoId,videoId),
            eq(commentReactions.userId,userId),
            eq(commentReactions.type,"like")
          )
        );
        //removing our like
        if(existingCommentReactionLike){
          const [deletedCommentReaction]=await db
             .delete(commentReactions)
             .where(
              and(
                eq(commentReactions.userId,userId),
                eq(commentReactions.videoId,videoId),
                eq(commentReactions.commentId,commentId),
              )
             ) 
             .returning();
             return deletedCommentReaction;
        }
        const [createCommentReaction]= await db
           .insert(commentReactions)
           .values({userId,videoId,commentId,type:"like"}) 
           //当我们之前已经点击过dislike时，会发生冲突，所以会重新设置为like
           .onConflictDoUpdate({
            target:[commentReactions.userId,commentReactions.commentId],
            set:{
              type:"like",
            },
           })
           .returning()
           if (commentOwner !== userId) {
            await db.insert(notifications).values({
              type: "comment_like",
              senderId: userId,
              recipientId: commentOwner,
              videoId,
              commentId,
              read: false,
              createdAt: new Date()
            });
          }
        return createCommentReaction;
    }),  
    dislike:protectedProcedure
    .input(z.object({
      commentId:z.string().uuid(),
      videoId:z.string().uuid(),
    }))
    .mutation(async({input,ctx})=>{
      const {commentId,videoId}=input;
      const {id:userId}=ctx.user;
      // The way of tracking views is going to be only for logged in users and only one view per user
      const [existingCommentReactionDislike]=await  db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId,commentId),
            eq(commentReactions.userId,userId),
            eq(commentReactions.videoId,videoId),
            eq(commentReactions.type,"dislike")
          )
        );
        //removing our like
        if(existingCommentReactionDislike){
          const [deletedCommentReaction]=await db
             .delete(commentReactions)
             .where(
              and(
                eq(commentReactions.userId,userId),
                eq(commentReactions.videoId,videoId),
                eq(commentReactions.commentId,commentId),
              )
             ) 
             .returning();
             return deletedCommentReaction;
        }
        const [createCommentReaction]= await db
           .insert(commentReactions)
           .values({userId,videoId,commentId,type:"dislike"}) 
           .onConflictDoUpdate({
            target:[commentReactions.userId,commentReactions.commentId],
            set:{
              type:"dislike",
            },
           })
           .returning()
        return createCommentReaction;
    }), 
})
