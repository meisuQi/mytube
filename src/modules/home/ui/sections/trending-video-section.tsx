"use client"
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos /ui/components/video-row-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";


export const TrendingVideoSection=()=>{
  return(
    <Suspense fallback={<TrendingVideoSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <TrendingVideoSectionSuspense/>
    </ErrorBoundary>
  </Suspense>
  )
}

const TrendingVideoSectionSkeleton=()=>{
  return (
    <div className="gap-4 gap-y-5 flex flex-col " >
        {Array.from({length:18}).map((_,index)=>(
            <VideoRowCardSkeleton key={index} />
          ))
          }
      </div>
  )
}

const TrendingVideoSectionSuspense=()=>{
  const [videos,query] =trpc.videos.getTrending.useSuspenseInfiniteQuery(
    {limit:DEFAULT_LIMIT},
  {
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  }
  );

  return(
    <div>
      <div className="gap-2 gap-y-2 flex flex-col " >
        {videos.pages
          .flatMap((page)=>page.items)
          .map((video)=>(
            <VideoRowCard key={video.id} data={video}/>
          ))
          }
      </div>
      <InfiniteScroll
      hasNextPage={query.hasNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
      fetchNextPage={query.fetchNextPage}
      />
    </div>
  )
  
}