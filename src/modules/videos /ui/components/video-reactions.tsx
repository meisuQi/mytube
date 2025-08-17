import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import React from 'react';
import { VideoGetOneOutput } from '../../types';
import { useClerk } from '@clerk/nextjs';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';

interface VideoReactionsProps{
  videoId:string;
  likes:number;
  dislikes:number;
  viewerReaction:VideoGetOneOutput["viewReactions"];
}


//TODO:properly implement viewer reactions
export const VideoReactions = ({
  videoId,
  likes,
  dislikes,
  viewerReaction,
}:VideoReactionsProps) => {
  const clerk=useClerk();
  const utils=trpc.useUtils();
  const like=trpc.videoReactions.like.useMutation({
    onSuccess:()=>{
      utils.videos.getOne.invalidate({id:videoId})
      //TODO:Invalidate "liked" playlist
      utils.playlists.getLiked.invalidate();
    },
    onError:(error)=>{
      toast.error("Something went wrong");
      if(error.data?.code==="UNAUTHORIZED"){
        clerk.openSignIn();
      }
    }
  }
  );
  const dislike=trpc.videoReactions.dislike.useMutation(
    {
      onSuccess:()=>{
        utils.videos.getOne.invalidate({id:videoId})
        //TODO:Invalidate "liked" playlist
        utils.playlists.getLiked.invalidate();
      },
      onError:(error)=>{
        toast.error("Something went wrong");
        if(error.data?.code==="UNAUTHORIZED"){
          clerk.openSignIn();
        }
      }
    }
  );
  return (
    //flex-none 表示这个元素 在 flex 布局中不允许伸缩，也不会自动缩放大小，它的尺寸完全由 width / height 或内容大小决定。
    <div className="flex items-center flex-none">
      <Button
        onClick={()=>like.mutate({videoId})}
        disabled={like.isPending||dislike.isPending}
        variant="secondary"
        className="rounded-l-full rounded-r-none gap-2 pr-4"
      >
      <ThumbsUpIcon className={cn("size-5",viewerReaction==="like" && "fill-black")}/>
      {likes}
      </Button>
      {/* <Separator orientation="vertical" /> 是一个垂直分隔线组件，常用于并排布局中，将两个区域视觉上分开。 */}
      <Separator orientation='vertical' className="h-7"/>
      <Button
        onClick={()=>dislike.mutate({videoId})}
        disabled={like.isPending||dislike.isPending}
        variant="secondary"
        className="rounded-l-none rounded-r-full pl-3"
      >
      <ThumbsDownIcon className={cn("size-5",viewerReaction ==="dislike" && "fill-black")}/>
      {dislikes}
      </Button>
    </div>
  )
}
