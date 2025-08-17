import { VideoView } from "@/modules/studio/ui/views/video-view";
import { HydrateClient, trpc } from "@/trpc/server";

/* 告诉 Next.js：“这个页面 每次请求都要重新生成，不要缓存、不要预渲染。”适用于内容实时变化或需要请求数据库/外部 API 的页面 */
export const dynamic="force-dynamic";
interface PageProps{
  params:Promise<{videoId:string}>
}

const Page = async ({params}:PageProps) => {
  const {videoId}=await params;
  void trpc.studio.getOne.prefetch({id:videoId});
  void trpc.categories.getMany.prefetch();
  return (
    <HydrateClient>
      <VideoView videoId={videoId}/>
    </HydrateClient>
  )
}

export default Page