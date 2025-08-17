"use client"

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { VideoPlayer, VideoPlayerSkeleton } from "../components/video-player";
import { VideoBanner } from "../components/video-banner";
import { VideoTopRow, VideoTopRowSkelton } from "../components/video-top-row";
import { useAuth } from "@clerk/nextjs";

interface VideoSectionProps{
  videoId:string;
}

export const VideoSection=({videoId}:VideoSectionProps)=>{
  return(
    <Suspense fallback={<VideoSectionSkeleton/>}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <VideoSectionSuspense videoId={videoId}/>
      </ErrorBoundary>
    </Suspense>
  )
}

const VideoSectionSkeleton=()=>{
  return (
    <>
    <VideoPlayerSkeleton/>
    <VideoTopRowSkelton/>
    </>
  )
}

const VideoSectionSuspense=({videoId}:VideoSectionProps)=>{
  const utils=trpc.useUtils();
  const {isSignedIn}=useAuth();
  const [video]=trpc.videos.getOne.useSuspenseQuery({id:videoId});
  const createView=trpc.videoViews.create.useMutation({
    onSuccess:()=>{
      //invalidate tells React Query to refetch this video's data (e.g., view count) because it's now outdated.
      utils.videos.getOne.invalidate({id:videoId})
    },

  }
  );
  const handlePlay=()=>{
    if(!isSignedIn) return;
    //如果用户已登录，就调用 createView.mutate()，向后端发送该视频的“观看记录”。
    //这里的 mutate() 通常来自 React Query 或 tRPC 的 mutation，用于执行数据更新操作（如新增记录）。
    createView.mutate({videoId});
  }
  return(
    <>
    {/* aspect-video：宽高比为视频比例（通常16:9） 
      video.muxStatus !== "ready"：如果视频还没准备好（可能还在上传或处理中）
      && "rounded-b-none"：那就把底部的圆角去掉
    */}
    <div className={cn(
      "aspect-video bg-black rounded-xl overflow-hidden relative",
       video.muxStatus !=="ready" && "rounded-b-none"
    )}>
      <VideoPlayer
      autoPlay
      onPlay={handlePlay}
      playbackId={video.muxPlaybackId}
      thumbnailUrl={video.thumbnailUrl}
      />
    </div>
    <VideoBanner status={video.muxStatus}/>
    <VideoTopRow video={video}/>
    </>
  )
}