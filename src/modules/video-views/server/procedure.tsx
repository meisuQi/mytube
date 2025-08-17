import { db } from "@/db";
import { videoViews } from "@/db/schema";
import {createTRPCRouter,protectedProcedure} from "@/trpc/init";
import { and,eq } from "drizzle-orm";
import { z } from "zod";

export const videoViewsRouter=createTRPCRouter({
  create:protectedProcedure
    .input(z.object({videoId:z.string().uuid()}))
    .mutation(async({input,ctx})=>{
      const {videoId}=input;
      const {id:userId}=ctx.user;
      // The way of tracking views is going to be only for logged in users and only one view per user
      const [existingVideoView]=await  db
        .select()
        .from(videoViews)
        .where(
          and(
            eq(videoViews.videoId,videoId),
            eq(videoViews.userId,userId),
          )
        );
        //in there, we don't throw an error,cuz the TRPC will still trigger our refetch on react query.so what we have to do is find a way to block that on the front end part
        if(existingVideoView){
          return existingVideoView;
        }
        const [createVideoView]= await db
           .insert(videoViews)
           .values({userId,videoId}) 
           .returning()
        return createVideoView;
    }),  
})
