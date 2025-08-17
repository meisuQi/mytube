import { useMemo } from "react";
import { VideoGetOneOutput } from "../../types";
import { VideoDescription } from "./video-description";
import { VideoMenu } from "./video-menu";
import { VideoOwner } from "./video-owner";
import { VideoReactions } from "./video-reactions";
import {format,formatDistanceToNow} from 'date-fns';
import{Skeleton} from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
interface VideoTopRowProps{
  video:VideoGetOneOutput;
};

export const VideoTopRowSkelton=()=>{
  return(
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex flex-col gap-2"> 
        <Skeleton className="h-6 w-4/5 md:w-2/5"/>
      </div>
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3 w-[70%]">
        <Skeleton className="w-10 h-10 rounded-full shrink-0"/>
        <div className="flex flex-col gap-2 w-full">
        <Skeleton className="h-5 w-4/5 md:w-2/6"/>
        <Skeleton className="h-5 w-3/5 md:w-1/5"/>
      </div>
      </div>
        <Skeleton className="h-9 w-2/6 md:1/6 rounded-full"/>
      </div>  
      <div className="h-[120px] w-full"/>
    </div>
  );
}

export const VideoTopRow=({video}:VideoTopRowProps)=>{
    const utils=trpc.useUtils();
    const router=useRouter();
    const deleteVideo=trpc.videos.remove.useMutation({
      onSuccess:()=>{
        utils.videos.getOne.invalidate({id:video.id});
        utils.videos.getMany.invalidate();
        toast.success("Video has been successfully deleted")
        router.push('/');
      },
      onError:(error)=>{
         toast.error("Something went wrong") 
      }
    })
    const handleRemove=()=>{
      deleteVideo.mutate({id:video.id})
    }

    const compactViews=useMemo(()=>{
    return Intl.NumberFormat("en",{
      notation:"compact"
    }).format(video.viewCount)
  },[video.viewCount]);

  /* 用于性能优化，缓存计算结果
     只有当 data.viewCount 改变时才重新计算
     避免在每次渲染时都重新格式化数字*/
  const expandedViews=useMemo(()=>{
    return Intl.NumberFormat("en",{
      notation:"standard"
    }).format(video.viewCount)
  },[video.viewCount]);
  const compactDate=useMemo(()=>{
    return formatDistanceToNow(video.createdAt,{addSuffix:true})
  },[video.createdAt]);
  const expandedDate=useMemo(()=>{
    return format(video.createdAt,"d MMM yyyy")},
    [video.createdAt]
    );
  return(
    <div className="flex flex-col gap-4 mt-4">
      <h1 className="text-xl font-semibold">{video.title}</h1>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <VideoOwner user={video.user} videoId={video.id}/>
        <div className="flex overflow-x-auto sm:min-w-[calc(50%-6px)] sm:justify-end sm:overflow-visible pb-2 -mb-2 sm:pb-0 sm:mb-0 gap-2">
          <VideoReactions
          videoId={video.id}
          likes={video.likeCount}
          dislikes={video.dislikeCount}
          viewerReaction={video.viewReactions}
          />
          <VideoMenu videoId={video.id} variant="secondary" onRemove={handleRemove} />
        </div>
      </div>
      <VideoDescription
        compactViews={compactViews}
        expandedViews={expandedViews}
        compactDate={compactDate}
        expandedDate={expandedDate}
        description={video.description}
      />
    </div>
  )
}
