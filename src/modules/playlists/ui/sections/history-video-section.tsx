"use client"
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos /ui/components/video-grid-card";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos /ui/components/video-row-card";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";


export const HistoryVideoSection=()=>{
  return(
    <Suspense fallback={<HistoryVideoSectionSkeleton/>}>
    <ErrorBoundary fallback={<p>Error</p>}>
      <HistoryVideoSectionSuspense/>
    </ErrorBoundary>
  </Suspense>
  )
}

const HistoryVideoSectionSkeleton=()=>{
  return (
    <div>
      <div className="gap-2 gap-y-2 flex flex-col md:hidden" >
        {Array.from({length:18}).map((_,index)=>(
            <VideoGridCardSkeleton key={index} />
          ))
          }
      </div>
      <div className="gap-2 gap-y-2 hidden flex-col md:flex " >
        {Array.from({length:18}).map((_,index)=>(
            <VideoRowCardSkeleton key={index} size="compact"/>
          ))
          }
      </div>
    </div>
    
  )
}

const HistoryVideoSectionSuspense=()=>{
  const [videos,query] =trpc.playlists.getHistory.useSuspenseInfiniteQuery(
    {limit:DEFAULT_LIMIT},
  {
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  }
  );

  return(
    <div>
      <div className="gap-2 gap-y-2 flex flex-col md:hidden " >
        {videos.pages
          .flatMap((page)=>page.items)
          .map((video)=>(
            <VideoGridCard key={video.id} data={video}/>
          ))
          }
      </div>
      <div className="gap-2 gap-y-2 hidden flex-col md:flex " >
        {videos.pages
          .flatMap((page)=>page.items)
          .map((video)=>(
            <VideoRowCard key={video.id} data={video} size="compact"/>
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