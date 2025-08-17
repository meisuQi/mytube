import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError,UTApi } from "uploadthing/server";
import { z } from "zod";

//f 定义文件上传规则的入口。
const f = createUploadthing();
//定义上传路由：thumbnailUploader
export const ourFileRouter = {
  bannerUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    // 权限控制 .middleware(...)
    .middleware(async () => {
      // This code runs on your server before upload
      const {userId:clerkUserId} = await auth();
      if (!clerkUserId) throw new UploadThingError("Unauthorized");
      //we have to check if user ID is the user ID from the database not just the clerk userID
      const[existingUser]=await db
            .select()
            .from(users)
            .where(eq(users.clerkId,clerkUserId));
            if(!existingUser) throw new UploadThingError("Unauthorized");
          if(existingUser.bannerKey){
            const utapi=new UTApi();
            await utapi.deleteFiles(existingUser.bannerKey);
            await db
                  .update(users)
                  .set({bannerKey:null,bannerUrl:null})
                  .where(and(
                    eq(users.id,existingUser.id)
                  ))
          }
      // 如果成功，返回 user + videoId，将传入下一个阶段（上传成功回调）。
      return {userId:existingUser.id};
    })
    //上传成功后 .onUploadComplete(...)
    .onUploadComplete(async ({ metadata, file }) => {
      await db
        .update(users)
        .set({
          //把文件链接 file.url 写入数据库 videos.thumbnailUrl
          bannerUrl:file.url,
          bannerKey:file.key,
        })
        .where(
          eq(users.id,metadata.userId),
          )
      // 最后把 userId 返回客户端（可选）。
      return { uploadedBy: metadata.userId };
    }),
  // Define as many FileRoutes as you like, each with a unique routeSlug
  thumbnailUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
  //输入校验 .input(...)
  .input(z.object({
    videoId:z.string().uuid(),
  }))
    // 权限控制 .middleware(...)
    .middleware(async ({ input }) => {
      // This code runs on your server before upload
      const {userId:clerkUserId} = await auth();
      if (!clerkUserId) throw new UploadThingError("Unauthorized");
      //we have to check if user ID is the user ID from the database not just the clerk userID
      const[user]=await db
            .select()
            .from(users)
            .where(eq(users.clerkId,clerkUserId));
            if(!user) throw new UploadThingError("Unauthorized");
      const[existingVideo]=await db
          .select({
            thumbnailKey:videos.thumbnailKey,
          })
          .from(videos)
          .where(and(
            eq(videos.id,input.videoId),
            eq(videos.userId,user.id),
          ))        
          if(!existingVideo) throw new UploadThingError("NOT FOUND")
          if(existingVideo.thumbnailKey){
            const utapi=new UTApi();
            await utapi.deleteFiles(existingVideo.thumbnailKey);
            await db
                  .update(videos)
                  .set({thumbnailKey:null,thumbnailUrl:null})
                  .where(and(
                    eq(videos.id,input.videoId),
                    eq(videos.userId,user.id),
                  ))
          }
      // 如果成功，返回 user + videoId，将传入下一个阶段（上传成功回调）。
      return { user,...input};
    })
    //上传成功后 .onUploadComplete(...)
    .onUploadComplete(async ({ metadata, file }) => {
      await db
        .update(videos)
        .set({
          //把文件链接 file.url 写入数据库 videos.thumbnailUrl
          thumbnailUrl:file.url,
          thumbnailKey:file.key,
        })
        .where(and(
          eq(videos.id,metadata.videoId),
          eq(videos.userId,metadata.user.id)
          ))
      // 最后把 userId 返回客户端（可选）。
      return { uploadedBy: metadata.user.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
