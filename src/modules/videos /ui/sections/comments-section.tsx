// modules/comments/ui/components/comments-section.tsx
"use client";

import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { CommentForm } from "@/modules/comments/ui/components/comment-form";
import { CommentItem } from "@/modules/comments/ui/components/comment-item";
import { trpc } from "@/trpc/client";
import { Loader2Icon } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface CommentsSectionProps {
  videoId: string;
  commentId?: string; // 新增：接收commentId
}

export const CommentsSection = ({ videoId, commentId }: CommentsSectionProps) => {
  return (
    <Suspense fallback={<CommentsSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <CommentsSectionSuspense videoId={videoId} commentId={commentId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const CommentsSectionSkeleton = () => {
  return (
    <div className="mt-6 flex justify-center items-center">
      <Loader2Icon className="text-muted-foreground size-7 animate-spin" />
    </div>
  );
};

interface CommentsSectionSuspenseProps extends CommentsSectionProps {
  commentId?: string;
}

export const CommentsSectionSuspense = ({ 
  videoId, 
  commentId: targetCommentId 
}: CommentsSectionSuspenseProps) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [comments, query] = trpc.comments.getMany.useSuspenseInfiniteQuery(
    {
      videoId,
      limit: DEFAULT_LIMIT,
      ...(targetCommentId ? { commentId: targetCommentId } : {})
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // 当评论加载完成时，尝试滚动到目标评论
  useEffect(() => {
    if (!targetCommentId || hasScrolled) return;
    
    const element = document.getElementById(`comment-${targetCommentId}`);
    if (element) {
      // 使用更可靠的滚动方法
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHasScrolled(true);
      
      // 高亮评论
      element.classList.add('highlight-comment');
      setTimeout(() => {
        element.classList.remove('highlight-comment');
      }, 3000);
    } else {
      // 如果评论不在第一页，尝试加载更多
      if (query.hasNextPage) {
        query.fetchNextPage();
      }
    }
  }, [comments, targetCommentId, hasScrolled, query]);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-bold">
          {comments.pages[0]?.totalCount || 0} Comments
        </h1>
        <CommentForm videoId={videoId} />
        <div className="flex flex-col gap-4 mt-2">
          {comments.pages.flatMap((page) => page.items).map((comment) => {
            return (
              <div 
                key={comment.id}
                className="comment-item"
              >
                <CommentItem comment={comment} />
              </div>
            );
          })}
          <InfiniteScroll
            isManual
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
            fetchNextPage={query.fetchNextPage}
          />
        </div>
      </div>
    </div>
  );
};