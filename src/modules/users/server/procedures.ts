import { db} from "@/db";
import { subscriptions, users, videos } from "@/db/schema";
import {z} from 'zod';
import { baseProcedure, createTRPCRouter} from "@/trpc/init";
import { eq,getTableColumns, inArray, isNotNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";


  export const usersRouter=createTRPCRouter({ 
    getOne:baseProcedure
        .input(z.object({id:z.string().uuid()}))
        .query(async ({input,ctx})=>{
          //从请求上下文（ctx）中取出来的，是当前登录用户的 ID。通过它查数据库得到当前登录用户的 userId，用于查询他对视频的行为（点赞、点踩等）
          const {clerkUserId}=ctx;
          let userId;
          const [user]=await db
                .select()
                .from(users) 
                //这里使用 inArray，是因为 这个查询条件要么是一个包含一个元素的数组，要么是空数组，而 inArray 支持传入任意长度的数组。
                .where(inArray(users.clerkId,clerkUserId ? [clerkUserId]:[])) 
          //If user is found, store the user ID.      
          if(user){
            userId=user.id;
          } 

           const viewerSubscriptions=db.$with("viewer_subscriptions").as(
            db
              .select()
              .from(subscriptions)
              .where(inArray(subscriptions.viewerId,userId ? [userId]:[]))
           )

          const [existingUser]=await db
           /* if you want to do an Join-something on that table,you have to add with in the beginning here */
            .with(viewerSubscriptions)  
            .select({
              ...getTableColumns(users),
              viewerSubscribed:isNotNull(viewerSubscriptions.viewerId).mapWith(Boolean),
              videoCount:db.$count(videos,eq(videos.userId,users.id)),
              subscriberCount:db.$count(subscriptions,eq(subscriptions.creatorId,users.id)),
            })
            .from(users)
            .leftJoin(viewerSubscriptions,eq(viewerSubscriptions.creatorId,users.id))
            .where(eq(users.id,input.id))
            if(!existingUser){
              throw new TRPCError({code:"NOT_FOUND"})
            }
            return existingUser;
        }),
});