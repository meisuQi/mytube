import { db} from "@/db";
import { subscriptions, users, videoReactions, videoUpdateSchema, videoViews, videos } from "@/db/schema";
import {z} from 'zod';
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq,and,or,lt,desc,getTableColumns, inArray, isNotNull } from "drizzle-orm";
import { mux } from "@/lib/mux";
import { TRPCError } from "@trpc/server";
import { UTApi } from "uploadthing/server";
import { workflow } from "@/lib/workflow";

  export const videosRouter=createTRPCRouter({ 
  
    getManySubscribed:protectedProcedure
    .input(
      z.object({   
        cursor:z.object({
          id:z.string().uuid(),
          updatedAt:z.date(),
        })
        .nullish(),
        limit:z.number().min(1).max(100),
      })
    )
    .query(async({ctx,input})=>{
      const {id:userId}=ctx.user;
      const {cursor,limit}=input;

      const viewerSubscription=db.$with("viewer_subscriptions").as(
          db
            .select({
              userId:subscriptions.creatorId,
            })
            .from(subscriptions)
            .where(eq(subscriptions.viewerId,userId))
      )

      const data=await db
        .with(viewerSubscription)    
        .select({
          ...getTableColumns(videos),
          user:users,
          viewCount:db.$count(videoViews,eq(videoViews.videoId,videos.id)),
          likeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"like"),
            )),
          dislikeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"dislike"),
            )), 
        })
        .from(videos)
        .innerJoin(users,eq(videos.userId,users.id))
        .innerJoin(
          viewerSubscription,
          eq(viewerSubscription.userId,users.id)
        )
        .where(and(
          eq(videos.visibility,"public"),
          cursor
            ? or(
              lt(videos.updatedAt,cursor.updatedAt),
              and(
                eq(videos.updatedAt,cursor.updatedAt),
                lt(videos.id,cursor.id)
              ))
            :undefined,
          )).orderBy(desc(videos.updatedAt),desc(videos.id))
          // Add 1 to the limit to check if there is more data
          .limit(limit+1)
          const hasMore=data.length >limit
          //remove the last item if there is more data
          const items=hasMore ?data.slice(0,-1):data
          //set the next cursor to the last item if there is more data
          const lastItem=items[items.length-1];
          const nextCursor=hasMore ?
            {
              id:lastItem.id,
              updatedAt:lastItem.updatedAt
            }:null;
        return {
          items,
          nextCursor
        };
    }),
    getTrending:baseProcedure
    .input(
      z.object({  
        cursor:z.object({
          id:z.string().uuid(),
          viewCount:z.number(),
        })
        .nullish(),
        limit:z.number().min(1).max(100),
      })
    )
    .query(async({input})=>{
      const {cursor,limit}=input;
      const viewCountSubquery=db.$count(
        videoViews,
        eq(videoViews.videoId,videos.id)
      )
      const data=await db
        .select({
          ...getTableColumns(videos),
          user:users,
          /* when it's in a constant,it will allow us to do some ordering by that subqueryre */
          viewCount:viewCountSubquery,
          likeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"like"),
            )),
          dislikeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"dislike"),
            )), 
        })
        .from(videos)
        .innerJoin(users,eq(videos.userId,users.id))
        .where(and(
          eq(videos.visibility,"public"),
          cursor
            ? or(
              lt(viewCountSubquery,cursor.viewCount),
              and(
                eq(viewCountSubquery,cursor.viewCount),
                lt(videos.id,cursor.id)
              ))
            :undefined,
          )).orderBy(desc(viewCountSubquery),desc(videos.id))
          // Add 1 to the limit to check if there is more data
          .limit(limit+1)
          const hasMore=data.length >limit
          //remove the last item if there is more data
          const items=hasMore ?data.slice(0,-1):data
          //set the next cursor to the last item if there is more data
          const lastItem=items[items.length-1];
          const nextCursor=hasMore ?
            {
              id:lastItem.id,
              viewCount:lastItem.viewCount
            }:null;
        return {
          items,
          nextCursor
        };
    }),  
    
  getMany:baseProcedure
    .input(
      z.object({   
        categoryId:z.string().uuid().nullish(),
        userId:z.string().uuid().nullish(),
        cursor:z.object({
          id:z.string().uuid(),
          updatedAt:z.date(),
        })
        .nullish(),
        limit:z.number().min(1).max(100),
      })
    )
    .query(async({input})=>{
      const {cursor,limit,categoryId,userId}=input;
      const data=await db
        .select({
          ...getTableColumns(videos),
          user:users,
          viewCount:db.$count(videoViews,eq(videoViews.videoId,videos.id)),
          likeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"like"),
            )),
          dislikeCount:db.$count(videoReactions,and(
            eq(videoReactions.videoId,videos.id),
            eq(videoReactions.type,"dislike"),
            )), 
        })
        .from(videos)
        .innerJoin(users,eq(videos.userId,users.id))
        .where(and(
          eq(videos.visibility,"public"),
          categoryId ? eq(videos.categoryId,categoryId):undefined,
          userId ? eq(videos.userId,userId):undefined,
          cursor
            ? or(
              lt(videos.updatedAt,cursor.updatedAt),
              and(
                eq(videos.updatedAt,cursor.updatedAt),
                lt(videos.id,cursor.id)
              ))
            :undefined,
          )).orderBy(desc(videos.updatedAt),desc(videos.id))
          // Add 1 to the limit to check if there is more data
          .limit(limit+1)
          const hasMore=data.length >limit
          //remove the last item if there is more data
          const items=hasMore ?data.slice(0,-1):data
          //set the next cursor to the last item if there is more data
          const lastItem=items[items.length-1];
          const nextCursor=hasMore ?
            {
              id:lastItem.id,
              updatedAt:lastItem.updatedAt
            }:null;
        return {
          items,
          nextCursor
        };
    }),
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


          /* This creates a temporary CTE（公用表表达式） (viewer_reactions) that includes only the current user’s reactions to videos, so it can be joined later. */
          //viewerReactions will already by default only load the currently logged in user id if it exists.
          const viewerReactions=db.$with("viewer_reactions").as(
            db
              .select({
                videoId:videoReactions.videoId,
                type:videoReactions.type,
              })
              .from(videoReactions)
              .where(inArray(videoReactions.userId,userId ? [userId]:[]))
          );

           const viewerSubscriptions=db.$with("viewer_subscriptions").as(
            db
              .select()
              .from(subscriptions)
              .where(inArray(subscriptions.viewerId,userId ? [userId]:[]))
           )

          const [existingVideo]=await db
           /* if you want to do an Join-something on that table,you have to add with in the beginning here */
            .with(viewerReactions,viewerSubscriptions)  
            .select({
              ...getTableColumns(videos),
              user:{
                ...getTableColumns(users),
                subscriberCount:db.$count(subscriptions,eq(subscriptions.creatorId,users.id)),
                /* isNotNull(viewerSubscriptions.viewerId)
                  判断 viewerSubscriptions.viewerId 是否不为 null，返回一个布尔值或布尔包装对象。
                  → 结果是 true 或 false。 */
                viewerSubscribed:isNotNull(viewerSubscriptions.viewerId).mapWith(Boolean),
              },
              /* 
              计算该视频的：
              播放次数（viewCount）
              点赞数（likeCount）
              点踩数（dislikeCount） 
              */
              //这是 Drizzle ORM 中的一个快捷统计方法，用于统计符合条件的行数。
              viewCount: db.$count(videoViews,eq(videoViews.videoId,videos.id)),
              likeCount:db.$count(
                videoReactions,
                and(
                  eq(videoReactions.videoId,videos.id),
                  eq(videoReactions.type,"like"),
                )),
              dislikeCount:db.$count(
                videoReactions,
                and(
                  eq(videoReactions.videoId,videos.id),
                  eq(videoReactions.type,"dislike"),
                )),
              viewReactions:viewerReactions.type,  
            })
            .from(videos)
            //这句是在查询视频时，连表查出视频上传者的用户信息，跟 clerkUserId 没关系。
            .innerJoin(users,eq(users.id,videos.userId))
            //当前用户是否对该视频有 reaction（left join viewerReactions）
            .leftJoin(viewerReactions,eq(viewerReactions.videoId,videos.id))
            .leftJoin(viewerSubscriptions,eq(viewerSubscriptions.creatorId,users.id))
            .where(eq(videos.id,input.id))
            if(!existingVideo){
              throw new TRPCError({code:"NOT_FOUND"})
            }
            return existingVideo;
        }),
    // 这段代码是一个使用 tRPC 定义的受保护 mutation（变异操作），用于通过 Upstash QStash 触发一个生成视频缩略图的工作流。
    generateTitle:protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ctx,input})=>{
          const{id:userId}=ctx.user;
          const{workflowRunId}=await workflow.trigger({
            url:`${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`,
            //know which user triggered this background job 
            body:{userId,videoId:input.id},
            retries:3,
          })  
          return workflowRunId;
        }),
    generateDescription:protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ctx,input})=>{
          const{id:userId}=ctx.user;
          const{workflowRunId}=await workflow.trigger({
            url:`${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/description`,
            //know which user triggered this background job 
            body:{userId,videoId:input.id},
            retries:3,
          })  
          return workflowRunId;
        }),
    generateThumbnail:protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ctx,input})=>{
          const{id:userId}=ctx.user;
          const{workflowRunId}=await workflow.trigger({
            url:`${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`,
            //know which user triggered this background job 
            body:{userId,videoId:input.id},
            retries:3,
          })  
          return workflowRunId;
        }),
    revalidate:protectedProcedure
        .input(z.object({id:z.string().uuid()}))
        .mutation(async({ctx,input})=>{
          const {id:userId}=ctx.user;
          const [existingVideo]=await db
            .select()
            .from(videos)
            .where(and(
              eq(videos.id,input.id),
              eq(videos.userId,userId)
            )); 
        if(!existingVideo){
          throw new TRPCError({code:"NOT_FOUND"})
         }
        if(!existingVideo.muxUploadId){
            throw new TRPCError({code:"BAD_REQUEST"})
         }; 
        const directUpload=await mux.video.uploads.retrieve(
          existingVideo.muxUploadId
        ) 
        if(!directUpload ||!directUpload.asset_id ){
          throw new TRPCError({code:"BAD_REQUEST"})
        }
        const asset=await mux.video.assets.retrieve(
          directUpload.asset_id
        ) 
        if(!asset){
          throw new TRPCError({code:"BAD_REQUEST"})
        }
        const playbackId=asset.playback_ids?.[0].id;
        const duration=asset.duration ? Math.round(asset.duration*1000):0;
        const [updatedVideo]=await db
              .update(videos)
              .set({
                muxStatus:asset.status,
                muxPlaybackId:playbackId,
                muxAssetId:asset.id,
                duration,
              })  
              .where(and(
                eq(videos.id,input.id),
                eq(videos.userId,userId),
              ))  
              .returning();
              return updatedVideo;   
        }),
    restoreThumbnail:protectedProcedure
      .input(z.object({id:z.string().uuid()}))
      .mutation(async({ctx,input})=>{
        const {id:userId}=ctx.user;
        const [existingVideo]=await db
          .select()
          .from(videos)
          .where(and(
            eq(videos.id,input.id),
            eq(videos.userId,userId)
          ));
         if(!existingVideo){
          throw new TRPCError({code:"NOT_FOUND"})
         }   
         if(existingVideo.thumbnailKey){
          const utapi=new UTApi();
          await utapi.deleteFiles(existingVideo.thumbnailKey);
          await db
                .update(videos)
                .set({thumbnailKey:null,thumbnailUrl:null})
                .where(and(
                  eq(videos.id,input.id),
                  eq(videos.userId,userId),
                ))
        }
         if(!existingVideo.muxPlaybackId){
          throw new TRPCError({code:"BAD_REQUEST"})  
         }
         const thumbnailUrl=`https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`;
          const [updatedVideo]=await db
            .update(videos)
            .set({thumbnailUrl})
            .where(and(
              eq(videos.id,input.id),
              eq(videos.userId,userId),
            ))
            .returning(); 
            return updatedVideo;
      }),
    remove:protectedProcedure
      .input(z.object({id:z.string().uuid()}))
      .mutation(async({ctx,input})=>{
        const {id:userId}=ctx.user;
        const [removedVideo]= await db
            .delete(videos)
            .where(and(
              eq(videos.id,input.id),
              eq(videos.userId,userId)
            ))
            .returning();
            if(!removedVideo){
              throw new TRPCError({code:"NOT_FOUND"})
            }
           return removedVideo; 
      }),
     


    update:protectedProcedure
    .input(videoUpdateSchema)
    .mutation(async({ctx,input})=>{
      const {id:userId}=ctx.user;
      if(!input.id){
        throw new TRPCError({code:"BAD_REQUEST"})
      }
      const [updatedVideo]=await db
          .update(videos)
          .set({
            title:input.title,
            description:input.description,
            categoryId:input.categoryId,
            visibility:input.visibility,
            updatedAt:new Date(),
          })
          .where(and(
            eq(videos.id,input.id),
            eq(videos.userId,userId)
          ))
          .returning();

          if(!updatedVideo){
            throw new TRPCError({code:"NOT_FOUND"})
          }
          return updatedVideo;  
    }),
    create:protectedProcedure.mutation(async({ctx})=>{
    const{id:userId}= ctx.user
    const upload=await mux.video.uploads.create({
        new_asset_settings:{
          passthrough:userId,
          playback_policy:["public"],
          input:[
            {
              generated_subtitles:[
                {
                  language_code:'en',
                  name:"English",
                },
            ],
            },
          ],
        },
        cors_origin:"*",//In Production ,set to your url
    })
    const[video]=await db
      .insert(videos)
      .values({
        userId,
        title:"Untitled",
        muxStatus:"waiting",
        muxUploadId:upload.id
      })
      //returning() 是 SQL（特别是 PostgreSQL）里的一个特性，用于在执行 INSERT、UPDATE 或 DELETE 操作后，返回被影响的行的数据。
      /* 因为你插入数据库的时候：
        通常不会手动传 id、createdAt 等字段
        这些字段由数据库自动生成
        但前端马上就要用这些信息（比如展示在页面、跳转到视频详情页）
        🟡 如果不写 .returning()，你得：
        插入完
        再发送一个 select 查询去查这条数据（麻烦 & 效率低） */
      .returning();
      return{
        video:video,
        url:upload.url
      };
   }),
});