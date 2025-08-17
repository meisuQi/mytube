"use client";

import { DEFAULT_LIMIT } from "@/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { trpc } from "@/trpc/client";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { SortFilter } from "../components/sort-filter";
import { useSearchParams } from "next/navigation";
import { VideoGridCard } from "@/modules/videos /ui/components/video-grid-card";
import { VideoRowCard } from "@/modules/videos /ui/components/video-row-card";
import { UserResults } from "./user-results";

interface ResultsSectionProps {
  query: string | undefined;
  categoryId: string | undefined;
}

export const ResultsSection = ({
  query,
  categoryId,
}: ResultsSectionProps) => {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  
  // 获取排序参数，默认为 "default"
  const sortBy = searchParams.get("sort") || "default";
  
  const [results, resultQuery] = trpc.search.getMany.useSuspenseInfiniteQuery(
    { 
      query, 
      categoryId, 
      limit: DEFAULT_LIMIT,
      sortBy: sortBy as "default" | "views"
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );
  
  const videos = results.pages.flatMap((page) => page.items);
  const hasVideos = videos.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {query ? `Latest from "${query}"` : "Search Results"}
        </h2>
        
        {/* 添加筛选器按钮 */}
        <SortFilter />
      </div>
            
      {/* 显示用户搜索结果（仅在搜索查询存在时） */}
      {query && <UserResults query={query} />}

      {/* 默认显示搜索结果 */}
      {hasVideos ? (
        <>
          <div className={isMobile ? "flex flex-col gap-y-10" : "flex flex-col gap-4"}>
            {videos.map((video) =>
              isMobile ? (
                <VideoGridCard key={video.id} data={video} />
              ) : (
                <VideoRowCard key={video.id} data={video} />
              )
            )}
          </div>
          
          <InfiniteScroll
            hasNextPage={resultQuery.hasNextPage}
            isFetchingNextPage={resultQuery.isFetchingNextPage}
            fetchNextPage={resultQuery.fetchNextPage}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No matching content found</p>
        </div>
      )}
    </div>
  );
};