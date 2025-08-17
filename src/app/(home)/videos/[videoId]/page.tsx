import { DEFAULT_LIMIT } from '@/constants';
import { VideoView } from '@/modules/videos /ui/views/video-view';
import { HydrateClient, trpc } from '@/trpc/server';
import { useSearchParams } from 'next/navigation';
//cause we are prefetching data inside
export const dynamic ="force-dynamic";

interface PageProps {
  params: {
    videoId: string;
  };
  searchParams: { // 添加搜索参数类型
    commentId?: string;
  };
}

const Page = async ({params,searchParams}:PageProps) => {
  const {videoId}= await params;
  const commentId = searchParams?.commentId; // 获取评论ID参数
    // 确保预取包含评论ID
    const prefetchOptions = commentId 
    ? { videoId, limit: DEFAULT_LIMIT, commentId } 
    : { videoId, limit: DEFAULT_LIMIT };
  void trpc.videos.getOne.prefetch({id: videoId});
  //TODO don't forget to change 
  void trpc.comments.getMany.prefetchInfinite(prefetchOptions);
  
  void trpc.suggestions.getMany.prefetchInfinite({videoId,limit:DEFAULT_LIMIT});

  return (
    <HydrateClient>
      <VideoView videoId={videoId} commentId={commentId}/>
    </HydrateClient>
  )
}

export default Page
