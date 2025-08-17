"use client";
import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { VideoRowCard, VideoRowCardSkeleton } from "../components/video-row-card";
import { VideoGridCard, VideoGridCardSkeleton } from "../components/video-grid-card";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useRouter } from "next/navigation";
import { toast } from "sonner";


interface SuggestionsSectionProps{
  videoId:string;
  isManual?:boolean;
}

 export const SuggestionsSection=({
  videoId,
  isManual,
 }:SuggestionsSectionProps)=>{
    return(
      <Suspense fallback={<SuggestionsSectionSkeleton/>}>
        <ErrorBoundary fallback={<p>Error</p>}>
          <SuggestionsSectionSuspense videoId={videoId} isManual={isManual}/>
        </ErrorBoundary>
      </Suspense>
    )
 } 

 const SuggestionsSectionSkeleton=()=>{
  return (
    <>
    <div className="hidden md:block space-y-3">
      {/* Array.from({ length: 8 })功能：创建一个包含8个空位的数组（实际值为undefined）,遍历数组的每个元素（忽略值_），通过索引index生成内容。 */}
      {Array.from({length:5}).map((_,index)=>(
        <VideoRowCardSkeleton key={index} size="default"/>
      ))}
    </div>
    <div className="block md:hidden space-y-10">
      {Array.from({length:5}).map((_,index)=>(
        <VideoGridCardSkeleton key={index} />
      ))}
    </div>
    </>
  )
 }

 const SuggestionsSectionSuspense=({
  videoId,
  isManual,
}:SuggestionsSectionProps)=>{
  const [suggestions,query]=trpc.suggestions.getMany.useSuspenseInfiniteQuery({
     videoId,
     limit:DEFAULT_LIMIT, 
  },{
    getNextPageParam:(lastPage)=>lastPage.nextCursor,
  })
  
  return(
    <>
    {/* md:768px 及以上 */}
  <div className="hidden md:block space-y-3">
    {suggestions.pages.flatMap((page)=>page.items.map((video)=>(
      <VideoRowCard
      key={video.id}
      data={video}
      size="default"
      />
    )))}
  </div>
  <div className="block md:hidden space-y-10">
  {suggestions.pages.flatMap((page)=>page.items.map((video)=>(
      <VideoGridCard
      key={video.id}
      data={video}
      />
    )))}
  </div>
  <InfiniteScroll
    isManual={isManual}
    hasNextPage={query.hasNextPage}
    isFetchingNextPage={query.isFetchingNextPage}
    fetchNextPage={query.fetchNextPage}
  />
  </>
  )
}